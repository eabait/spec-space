import io
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from urllib.error import HTTPError
from draft import GitHub, prepare
from validate import validate, version_from_tag

SHA = "a" * 40
TAG = "v1.2.3-rc.1"


class FakeGitHub:
    def __init__(self, draft=True, exists=True):
        self.release = {
            "id": 7,
            "tag_name": TAG,
            "draft": draft,
            "prerelease": True,
            "body": "Maintainer notes",
            "html_url": "https://example.test/draft",
        }
        self.exists = exists
        self.assets = []
        self.writes = []
        self.sha = SHA
        self.publish_after_delete = False
        self.annotated = False

    def pages(self, path):
        return iter(
            ([self.release] if self.exists else [])
            if path == "releases"
            else self.assets.copy()
        )

    def request(self, method, path, data=None, binary=False):
        if method == "GET":
            if path.startswith("git/ref/"):
                return {
                    "object": {
                        "type": "tag" if self.annotated else "commit",
                        "sha": self.sha,
                    }
                }
            if path.startswith("git/tags/"):
                return {"object": {"type": "commit", "sha": self.sha}}
            return self.release.copy()
        self.writes.append((method, path, data))
        if path == "releases":
            self.release.update(data)
            self.exists = True
            return self.release.copy()
        if method == "DELETE":
            self.assets = [
                a for a in self.assets if a["id"] != int(path.split("/")[-1])
            ]
            if self.publish_after_delete:
                self.release["draft"] = False
            return None
        query = parse_qs(urlsplit(path).query)
        asset = {
            "id": len(self.assets) + 10,
            "name": query["name"][0],
            "label": query["label"][0],
            "state": "uploaded",
            "size": len(data),
            "digest": "sha256:" + hashlib.sha256(data).hexdigest(),
        }
        self.assets.append(asset)
        return asset


class DraftTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        for arch in ("arm64", "x86_64"):
            archive = self.directory / f"SpecSpace-{TAG}-macos-{arch}.zip"
            archive.write_bytes(b"fixture archive " + arch.encode())
            archive.with_suffix(".zip.sha256").write_text(
                f"{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n"
            )

    def run_release(self, api):
        prepare(api, self.directory, TAG, SHA)

    def test_create_draft_and_idempotent_retry(self):
        api = FakeGitHub(exists=False)
        api.annotated = True
        self.run_release(api)
        self.assertTrue(api.release["draft"])
        self.assertTrue(api.release["prerelease"])
        self.assertIn(SHA, api.release["body"])
        self.assertEqual(len(api.assets), 4)
        api.release["body"] = "Edited notes"
        api.writes.clear()
        self.run_release(api)
        self.assertEqual(api.writes, [])
        self.assertEqual(api.release["body"], "Edited notes")

    def test_published_release_is_never_modified(self):
        api = FakeGitHub(draft=False)
        with self.assertRaisesRegex(ValueError, "published"):
            self.run_release(api)
        self.assertEqual(api.writes, [])

    def test_unrelated_asset_and_notes_preserved(self):
        api = FakeGitHub()
        api.assets.append({"id": 1, "name": "manual.pdf"})
        self.run_release(api)
        self.assertEqual(api.assets[0]["name"], "manual.pdf")
        self.assertEqual(api.release["body"], "Maintainer notes")

    def test_unowned_collision_rejected_before_writes(self):
        api = FakeGitHub()
        api.assets.append({"id": 1, "name": f"SpecSpace-{TAG}-macos-x86_64.zip"})
        with self.assertRaisesRegex(ValueError, "unowned"):
            self.run_release(api)
        self.assertEqual(api.writes, [])

    def test_owned_incomplete_upload_is_replaced(self):
        api = FakeGitHub()
        api.assets.append(
            {
                "id": 1,
                "name": f"SpecSpace-{TAG}-macos-arm64.zip",
                "label": f"specspace-release:{SHA}",
                "state": "starter",
            }
        )
        self.run_release(api)
        self.assertEqual(api.writes[0][:2], ("DELETE", "releases/assets/1"))
        self.assertEqual(len(api.assets), 4)

    def test_detect_publication_between_mutations(self):
        api = FakeGitHub()
        api.assets.append(
            {
                "id": 1,
                "name": f"SpecSpace-{TAG}-macos-arm64.zip",
                "label": f"specspace-release:{SHA}",
                "state": "starter",
            }
        )
        api.publish_after_delete = True
        with self.assertRaisesRegex(ValueError, "published"):
            self.run_release(api)
        self.assertEqual(len(api.writes), 1)

    def test_moved_tag_rejected_before_writes(self):
        api = FakeGitHub()
        api.sha = "b" * 40
        with self.assertRaisesRegex(ValueError, "moved"):
            self.run_release(api)
        self.assertEqual(api.writes, [])

    def test_missing_architecture_rejected_before_writes(self):
        api = FakeGitHub()
        (self.directory / f"SpecSpace-{TAG}-macos-x86_64.zip").unlink()
        with self.assertRaises(FileNotFoundError):
            self.run_release(api)
        self.assertEqual(api.writes, [])

    def test_upload_failure_keeps_draft_and_retry_repairs_it(self):
        api = FakeGitHub()
        original = api.request

        def fail_upload(method, path, data=None, binary=False):
            if binary:
                raise OSError("Network failure")
            return original(method, path, data, binary)

        with patch.object(api, "request", side_effect=fail_upload):
            with self.assertRaisesRegex(OSError, "Network failure"):
                self.run_release(api)
        self.assertTrue(api.release["draft"])
        self.run_release(api)
        self.assertEqual(len(api.assets), 4)
        self.assertTrue(api.release["draft"])

    def test_corrupt_asset_rejected_before_writes(self):
        api = FakeGitHub()
        next(self.directory.glob("*.zip")).write_bytes(b"corrupt")
        with self.assertRaisesRegex(ValueError, "checksum"):
            self.run_release(api)
        self.assertEqual(api.writes, [])


class VersionTests(unittest.TestCase):
    def test_semver(self):
        for tag in ("v0.1.0", "v1.2.3-rc.1", "v1.2.3-alpha-beta"):
            self.assertEqual(version_from_tag(tag), tag[1:])
        for tag in (
            "v01.2.3",
            "v1.2.3-01",
            "v1.2.3+build",
            "main",
            "--help",
            "v1.2.3\n",
            "$(touch bad)",
        ):
            with self.subTest(tag=tag), self.assertRaises(ValueError):
                version_from_tag(tag)

    def test_real_git_tag_resolution_and_version_mismatch(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "src-tauri").mkdir()
            (root / "package.json").write_text(json.dumps({"version": "1.2.3"}))
            (root / "package-lock.json").write_text(
                json.dumps({"version": "1.2.3", "packages": {"": {"version": "1.2.3"}}})
            )
            (root / "src-tauri/tauri.conf.json").write_text(
                json.dumps({"version": "1.2.3"})
            )
            (root / "src-tauri/Cargo.toml").write_text(
                '[package]\nname="app"\nversion="1.2.3"\n'
            )
            (root / "src-tauri/Cargo.lock").write_text(
                '[[package]]\nname="app"\nversion="1.2.3"\n'
            )

            def git(*args):
                return subprocess.run(
                    ["git", *args], cwd=root, check=True, capture_output=True, text=True
                )

            git("init")
            git("add", ".")
            git(
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.test",
                "-c",
                "commit.gpgsign=false",
                "commit",
                "-m",
                "fixture",
            )
            git("tag", "v1.2.3")
            git("tag", "v2.0.0")
            with patch(
                "validate.git", side_effect=lambda *args: git(*args).stdout.strip()
            ):
                self.assertEqual(validate("v1.2.3")["prerelease"], "false")
                with self.assertRaisesRegex(ValueError, "does not match"):
                    validate("v2.0.0")
                with self.assertRaises(subprocess.CalledProcessError):
                    validate("v9.9.9")
                # Working-tree edits must not alter what is released from the tag.
                (root / "package.json").write_text('{"version":"9.9.9"}')
                self.assertEqual(validate("v1.2.3")["version"], "1.2.3")


class APIErrorTests(unittest.TestCase):
    def test_forbidden_reports_reason_without_token(self):
        error = HTTPError(
            "https://api.github.com/test",
            403,
            "Forbidden",
            {"X-GitHub-Request-Id": "test-id"},
            io.BytesIO(b'{"message":"Resource not accessible secret-token"}'),
        )
        with patch("draft.urlopen", side_effect=error):
            with self.assertRaises(RuntimeError) as raised:
                GitHub("owner/repo", "secret-token").request("POST", "releases", {})
        self.assertIn("Resource not accessible", str(raised.exception))
        self.assertIn("test-id", str(raised.exception))
        self.assertNotIn("secret-token", str(raised.exception))
