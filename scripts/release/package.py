"""Verify, archive, extract, and checksum a macOS app bundle."""

import hashlib
import os
from pathlib import Path
import plistlib
import subprocess
import tempfile

from validate import version_from_tag


def inspect(app, version, arch):
    with (app / "Contents/Info.plist").open("rb") as source:
        info = plistlib.load(source)
    if info["CFBundleShortVersionString"] != version:
        raise ValueError("Packaged version does not match release tag")
    binary = app / "Contents/MacOS" / info["CFBundleExecutable"]
    if not binary.is_file() or not os.access(binary, os.X_OK):
        raise ValueError("App executable missing or not executable")
    actual = subprocess.check_output(["lipo", "-archs", str(binary)], text=True).strip()
    if actual != arch:
        raise ValueError(f"Expected {arch}, got {actual}")
    return hashlib.sha256(binary.read_bytes()).hexdigest()


def package(app, tag, arch, output):
    version = version_from_tag(tag)
    if arch not in ("arm64", "x86_64"):
        raise ValueError("Unsupported architecture")
    original = inspect(app, version, arch)
    output.mkdir(parents=True, exist_ok=True)
    archive = output / f"SpecSpace-{tag}-macos-{arch}.zip"
    subprocess.run(
        [
            "ditto",
            "-c",
            "-k",
            "--sequesterRsrc",
            "--keepParent",
            str(app),
            str(archive),
        ],
        check=True,
    )
    with tempfile.TemporaryDirectory() as temporary:
        subprocess.run(["ditto", "-x", "-k", str(archive), temporary], check=True)
        if inspect(Path(temporary) / app.name, version, arch) != original:
            raise ValueError("Extracted executable differs from build")
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix(".zip.sha256").write_text(f"{digest}  {archive.name}\n")
    print(f"Verified {archive.name}: {digest}")


if __name__ == "__main__":
    package(
        Path(os.environ["APP_PATH"]),
        os.environ["RELEASE_TAG"],
        os.environ["RELEASE_ARCH"],
        Path(os.environ["ASSET_DIR"]),
    )
