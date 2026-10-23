"""Create drafts and upload only workflow-owned assets; never publish."""

import hashlib
import json
import os
from pathlib import Path
import re
from urllib.parse import quote
from urllib.request import Request, urlopen

from validate import version_from_tag


class GitHub:
    def __init__(self, repository, token):
        if not re.fullmatch(r"[\w.-]+/[\w.-]+", repository):
            raise ValueError("Invalid repository")
        self.repository = repository
        self.token = token

    def request(self, method, path, data=None, binary=False):
        host = "https://uploads.github.com" if binary else "https://api.github.com"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": (
                "application/octet-stream" if binary else "application/json"
            ),
        }
        payload = (
            data
            if binary
            else (json.dumps(data).encode() if data is not None else None)
        )
        request = Request(
            f"{host}/repos/{self.repository}/{path}",
            data=payload,
            headers=headers,
            method=method,
        )
        with urlopen(request, timeout=120) as response:
            body = response.read()
            return json.loads(body) if body else None

    def pages(self, path):
        page = 1
        while True:
            batch = self.request("GET", f"{path}?per_page=100&page={page}")
            yield from batch
            if len(batch) < 100:
                return
            page += 1


def verify_assets(directory, tag):
    version_from_tag(tag)
    expected = []
    for arch in ("arm64", "x86_64"):
        name = f"SpecSpace-{tag}-macos-{arch}.zip"
        archive = directory / name
        checksum = directory / f"{name}.sha256"
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        if checksum.read_text() != f"{digest}  {name}\n":
            raise ValueError(f"Invalid checksum for {name}")
        expected.extend([archive, checksum])
    if {p.name for p in directory.iterdir()} != {p.name for p in expected}:
        raise ValueError("Unexpected files in release assets")
    return expected


def verify_remote_tag(api, tag, commit):
    obj = api.request("GET", f"git/ref/tags/{quote(tag, safe='')}")["object"]
    # Both lightweight and annotated tags must still point to the validated source.
    for _ in range(10):
        if obj["type"] == "commit":
            if obj["sha"] != commit:
                raise ValueError("Remote tag moved since validation")
            return
        if obj["type"] != "tag":
            break
        obj = api.request("GET", f"git/tags/{obj['sha']}")["object"]
    raise ValueError("Tag does not resolve to a commit")


def require_draft(api, release_id, tag):
    release = api.request("GET", f"releases/{release_id}")
    if (
        not release.get("draft")
        or release.get("immutable")
        or release["tag_name"] != tag
    ):
        raise ValueError(
            "Refusing to modify a published, immutable, or retagged release"
        )
    return release


def prepare(api, directory, tag, commit):
    version = version_from_tag(tag)
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Expected a full source commit SHA")
    files = verify_assets(directory, tag)
    verify_remote_tag(api, tag, commit)
    matches = [
        release for release in api.pages("releases") if release["tag_name"] == tag
    ]
    if len(matches) > 1:
        raise ValueError("Multiple releases for the same tag")
    if matches:
        release = require_draft(api, matches[0]["id"], tag)
        if release["prerelease"] != ("-" in version):
            raise ValueError(
                "Existing draft prerelease classification does not match tag"
            )
    else:
        release = api.request(
            "POST",
            "releases",
            {
                "tag_name": tag,
                "target_commitish": commit,
                "name": f"SpecSpace {tag}",
                "body": (
                    f"Source commit: `{commit}`\n\n"
                    "macOS downloads: arm64 for Apple Silicon; x86_64 for Intel. "
                    "Extract the ZIP and move SpecSpace.app to Applications. "
                    "Each archive includes a separate SHA-256 checksum file.\n\n"
                    "These builds are not Developer ID signed or notarized; macOS may block them. "
                    "Automated build and archive checks do not establish native launch validation.\n\n"
                    "Wait for the workflow to succeed, review the assets and release notes, "
                    "and test on the intended Macs before publishing this draft."
                ),
                "draft": True,
                "prerelease": "-" in version,
            },
        )
    release_id = release["id"]
    owner = f"specspace-release:{commit}"
    assets = {
        asset["name"]: asset for asset in api.pages(f"releases/{release_id}/assets")
    }
    # Preflight every collision before modifying any assets.
    for file in files:
        existing = assets.get(file.name)
        if existing and existing.get("label") != owner:
            raise ValueError(f"Refusing to overwrite unowned asset {file.name}")
    for file in files:
        payload = file.read_bytes()
        digest = "sha256:" + hashlib.sha256(payload).hexdigest()
        existing = assets.get(file.name)
        if (
            existing
            and existing.get("state") == "uploaded"
            and existing.get("digest") == digest
        ):
            continue
        verify_remote_tag(api, tag, commit)
        require_draft(api, release_id, tag)
        if existing:
            api.request("DELETE", f"releases/assets/{existing['id']}")
        require_draft(api, release_id, tag)
        asset = api.request(
            "POST",
            f"releases/{release_id}/assets?name={quote(file.name)}&label={quote(owner)}",
            payload,
            binary=True,
        )
        if (
            asset.get("state") != "uploaded"
            or asset.get("size") != len(payload)
            or asset.get("digest") != digest
        ):
            raise ValueError(f"Upload verification failed: {file.name}")
    require_draft(api, release_id, tag)
    print(f"Draft ready for review: {release['html_url']}")


if __name__ == "__main__":
    prepare(
        GitHub(os.environ["GITHUB_REPOSITORY"], os.environ["GITHUB_TOKEN"]),
        Path(os.environ["ASSET_DIR"]),
        os.environ["RELEASE_TAG"],
        os.environ["RELEASE_COMMIT"],
    )
