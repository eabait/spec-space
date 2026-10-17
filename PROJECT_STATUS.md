# Project status — start here

Updated: 2026-10-17. SpecSpace Desktop 0.1.0, local macOS MVP.

## Resume development

Read [AGENTS.md](AGENTS.md), [VISION.md](VISION.md), [SPEC.md](SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [SDD.md](SDD.md). Then read the relevant increment in [specs](specs/README.md) and [plans](plans/README.md).

## Current state

- MVP implemented: local folders, tabs, CodeMirror, Markdown/Mermaid preview, saving, and protection for pending edits.
- Native primary action: File → Open Folder… with ⌘O; the upper-right button is removed.
- Baseline documented; no active SDD increment or accepted upcoming work.
- Repository: `/Users/estebanabait/Documents/Projects/spec-space`.
- Initial baseline is on `main`, identified by the annotated tag `v0.1.0`. Check `git log` and `git status` before resuming.

## Validation evidence

- MVP: 5 TypeScript tests and 3 Rust tests passed; frontend build and macOS release bundle succeeded.
- Native checks covered folder picking, tabs, editing, saving, and close prompts; preview and Mermaid labels were visually checked.
- Menu change: release build and formatting passed; File → Open Folder… was verified in the app and opened the folder picker.
- Older debug and release instances were found; verify which version is running. Current bundle: `src-tauri/target/release/bundle/macos/SpecSpace.app`.
- Rust was installed temporarily under `/private/tmp`; see README. Do not assume it remains available.

## Limits and next step

There is no file creation, autosave, session recovery, file watcher, Git UI, or collaboration. See SPEC for saving and preview limits.

The next change starts with `specs/001-<name>.md`; accept its scope and create the matching plan before implementation. No feature priority is agreed; define it with the user. Do not publish or create commits as an implicit part of documentation work.

## Latest task

The user requested SDD: separate sources of truth, concise AGENTS guidance, and progressive disclosure. This task documents the existing baseline; it does not change product behavior.
