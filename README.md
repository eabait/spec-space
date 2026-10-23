# SpecSpace Desktop

A focused local Markdown workspace for software specifications. Built with Tauri 2, React, TypeScript, Vite, CodeMirror 6, and Pele for Mermaid-syntax previews. No account, server, cloud integration, or collaboration service.

The interface uses a warm editorial reading surface and a connected-module blueprint identity. At wide sizes, Source and Preview can share the document view; compact windows let you focus on either pane with the existing controls.

## Run on macOS

Prerequisites: Node.js 22.12+ (Node 24 recommended), npm, the stable Rust toolchain installed via [rustup](https://rustup.rs), and Apple's Command Line Tools (`xcode-select --install`).

```sh
npm ci
npm run tauri dev
```

Choose **File → Open Folder…** (⌘O), then select a folder containing `.md` or `.markdown` files. The `examples` folder is a ready-to-use workspace.

Use **Connections** to explore saved Markdown references as a directed graph. Select a node to open its document and inspect its outgoing references and backlinks; **Go to editor** returns to editing. Broken references lists missing Markdown destinations. The graph fits the window; use zoom controls or scrolling for detail, and All documents for full paths.

With a workspace open, use File → New Markdown Document… (⌘N) or the plus action in the explorer to create an empty Markdown file. The native dialog stays within the workspace boundary, and existing files are never overwritten.

Use **File → Close All Tabs** or **Close Other Tabs**, or right-click a tab for the same actions. Pending changes offer Save All, Discard Changes, or Cancel. A save failure keeps all tabs open; earlier successful saves remain saved.

After a normal quit, SpecSpace restores the last workspace and open Markdown tabs from their current disk contents, including tab order and the active document. Unsaved edits, undo history, and view state are not restored. Missing documents are skipped with a status notice.

Use **Outline** in the document toolbar to navigate headings in the active document. The nested list follows unsaved edits and distinguishes repeated heading titles; selecting an entry scrolls the current Source, Preview, or both Split panes.

Expand a rendered diagram with its expand icon. In supported flowcharts, the magnifying glass opens **Find node**: enter part of a component name, then click a result or use Up/Down and Enter to center it. Escape closes search first, then returns to the document. Search highlights do not alter exported images.

Wide tables in Preview retain readable columns and scroll horizontally within their own region; compact tables keep their natural width.

Connections update after saves, reloads, and workspace opening. Use **Refresh connections** after external file changes; **Refresh workspace** also updates the explorer. Neither refresh overwrites pending editor changes. Scan limits, skipped files, and stale results are shown in the view. See [SPEC](SPEC.md) for exact limits and exclusions.

```sh
npm run tauri build
```

Creates `src-tauri/target/release/bundle/macos/SpecSpace.app`. This local build is not notarized for distribution. For a faster development bundle, use `npm run tauri -- build --debug`.

`npm run dev` runs only the browser UI; local filesystem operations require the desktop app.

### Set up Rust for local builds

macOS desktop builds need Apple's Command Line Tools and the stable Rust toolchain. Install the Command Line Tools once if needed:

```sh
xcode-select --install
```

Install Rust with rustup, then open a new terminal. If the current shell does not recognize `cargo`, load rustup's environment and select stable:

```sh
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
source "$HOME/.cargo/env"
rustup default stable
```

Install the project dependencies and build the local macOS app bundle:

```sh
npm ci
npm run tauri build
```

The bundle is written to `src-tauri/target/release/bundle/macos/SpecSpace.app`. For a debug build, run `npm run tauri -- build --debug`.

## Project documentation

Start with [PROJECT_STATUS.md](PROJECT_STATUS.md) to resume development and [AGENTS.md](AGENTS.md) for project conventions.

- [VISION.md](VISION.md): revisable direction.
- [SPEC.md](SPEC.md): current product and scope.
- [ARCHITECTURE.md](ARCHITECTURE.md): current implementation.
- [SDD.md](SDD.md): change workflow; see [specs/](specs/README.md) and [plans/](plans/README.md).

## Checks

```sh
npm test
npm run build
npm run format:check
cargo test --manifest-path src-tauri/Cargo.toml
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
git diff --check
```

## Prepare a GitHub release

The `Prepare macOS release` workflow builds Apple Silicon (`arm64`) and Intel (`x86_64`) ZIP archives and checksum files, then creates a **draft** release. It does not publish, Developer ID sign, or notarize the application. macOS may block these downloads. No Apple credentials or personal access token are required; the release job uses GitHub's repository token.

1. Select an unused version, such as `0.2.0` or `0.2.0-rc.1`. Keep `package.json`, both root version fields in `package-lock.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and the local `spec-space` package entry in `src-tauri/Cargo.lock` consistent. Regenerate lockfiles with the package managers and review their changes. Do not change dependency versions merely to prepare a release.
2. Run the checks above and `npm run test:release` (Python 3.11+). Review and commit the intended source, including the workflow and its helper scripts. Push that commit. Uncommitted local files are not included in a release build.
3. Create and push a version tag pointing to that commit. For example, after choosing `0.2.0` and preparing its matching commit:

   ```sh
   git tag -a v0.2.0 -m "SpecSpace 0.2.0"
   git push origin v0.2.0
   ```

4. Watch **Actions → Prepare macOS release**. The workflow validates the existing tag and versions, runs frontend/Rust checks on both macOS runners, builds the apps, verifies executable architecture and packaged version, extracts the ZIPs to check executable preservation, and uploads assets only after both builds succeed.
5. Wait for the workflow to finish successfully, then open **Releases** and review the draft. Download the ZIP for the intended Mac and its `.sha256` file into the same directory. Run, for example, `shasum -a 256 -c SpecSpace-v0.2.0-macos-arm64.zip.sha256`, extract the archive, and test the app on the intended architecture. Automated checks do not establish successful native launch on every supported Mac.
6. Edit the release notes and publish manually when ready. Versions containing a prerelease suffix are marked as prereleases. The workflow never publishes a draft or modifies an already published release.

To retry, rerun the failed workflow or use **Actions → Prepare macOS release → Run workflow** with the existing tag. The workflow must be present on the default branch for the manual control to appear. It builds the tag's commit, not the selected branch's current application source; the tagged commit must include the release helpers. Existing draft notes and unrelated assets are preserved. Only assets carrying this workflow's ownership label for the same source commit can be replaced. An unowned filename collision fails with an explanation; inspect it manually instead of deleting unrelated content. Do not move release tags.

Do not publish or edit draft assets while a run is uploading. Draft state is checked before each mutation, but GitHub does not offer an atomic draft-only upload condition. A failed upload can leave an incomplete draft; rerun before publishing. A published version requires a new version/tag for changed binaries.

Hosted macOS runner availability and account usage limits apply. The workflow uses `macos-15` and `macos-15-intel`; see [GitHub's runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners). Local workflow validation is recorded in [plan 018](plans/018-github-release-workflow.md); the first actual hosted run remains a separate verification step after pushing. For workflow edits, run `actionlint .github/workflows/release.yml`, format the YAML with Prettier, and check the Python helpers with Black.
