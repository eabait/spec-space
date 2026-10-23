"""Validate release identity without executing code from the selected tag."""

import json
import os
import re
import subprocess
import tomllib


TAG = re.compile(
    r"v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
)


def version_from_tag(tag):
    match = TAG.fullmatch(tag)
    if not match or any(
        part.isdigit() and len(part) > 1 and part.startswith("0")
        for part in (match[4] or "").split(".")
    ):
        raise ValueError(
            "Expected vMAJOR.MINOR.PATCH with an optional SemVer prerelease suffix"
        )
    return tag[1:]


def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()


def validate(tag):
    version = version_from_tag(tag)
    commit = git("rev-parse", "--verify", f"refs/tags/{tag}^{{commit}}")

    def read(path):
        return git("show", f"{commit}:{path}")

    package = json.loads(read("package.json"))
    lock = json.loads(read("package-lock.json"))
    cargo = tomllib.loads(read("src-tauri/Cargo.toml"))["package"]
    cargo_lock = tomllib.loads(read("src-tauri/Cargo.lock"))
    entries = [
        p
        for p in cargo_lock["package"]
        if p["name"] == cargo["name"] and "source" not in p
    ]
    if len(entries) != 1:
        raise ValueError("Expected exactly one local application entry in Cargo.lock")
    versions = {
        "package.json": package["version"],
        "package-lock.json": lock["version"],
        "package-lock.json root": lock["packages"][""]["version"],
        "tauri.conf.json": json.loads(read("src-tauri/tauri.conf.json"))["version"],
        "Cargo.toml": cargo["version"],
        "Cargo.lock": entries[0]["version"],
    }
    for path, actual in versions.items():
        if actual != version:
            raise ValueError(f"{path}: version {actual!r} does not match {tag}")
    return {
        "tag": tag,
        "version": version,
        "commit": commit,
        "prerelease": str("-" in version).lower(),
    }


if __name__ == "__main__":
    result = validate(os.environ["RELEASE_TAG"])
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as output:
            output.writelines(f"{key}={value}\n" for key, value in result.items())
    print(json.dumps(result))
