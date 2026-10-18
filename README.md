# SpecSpace Desktop

A focused local Markdown workspace for software specifications. Built with Tauri 2, React, TypeScript, Vite, CodeMirror 6, and Mermaid. No account, server, cloud integration, or collaboration service.

## Run on macOS

Prerequisites: Node.js 22.12+ (Node 24 recommended), npm, the stable Rust toolchain installed via [rustup](https://rustup.rs), and Apple's Command Line Tools (`xcode-select --install`).

```sh
npm ci
npm run tauri dev
```

Choose **File → Open Folder…** (⌘O), then select a folder containing `.md` or `.markdown` files. The `examples` folder is a ready-to-use workspace.

Use **Connections** to explore saved Markdown references as a directed graph. Select a node to open its document and inspect its outgoing references and backlinks; **Go to editor** returns to editing. Broken references lists missing Markdown destinations. The graph fits the window; use zoom controls or scrolling for detail, and All documents for full paths.

Connections update after saves, reloads, and workspace opening. Use **Refresh connections** after external file changes; **Refresh workspace** also updates the explorer. Neither refresh overwrites pending editor changes. Scan limits, skipped files, and stale results are shown in the view. See [SPEC](SPEC.md) for exact limits and exclusions.

```sh
npm run tauri build
```

Creates `src-tauri/target/release/bundle/macos/SpecSpace.app`. This local build is not notarized for distribution. For a faster development bundle, use `npm run tauri -- build --debug`.

`npm run dev` runs only the browser UI; local filesystem operations require the desktop app.

### Temporary validation toolchain

The initial implementation was verified with Rust installed under `/private/tmp`, without changing shell configuration. If that temporary toolchain is still present, run:

```sh
export RUSTUP_HOME=/private/tmp/spec-space-rustup
export CARGO_HOME=/private/tmp/spec-space-cargo
export PATH="$CARGO_HOME/bin:$PATH"
npm run tauri dev
```

For ongoing development, install Rust normally. If npm reports a cache permission error, use `npm ci --cache /private/tmp/spec-space-npm-cache`.

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
