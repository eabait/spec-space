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
