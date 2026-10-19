# Plan 009 — Restore the last workspace and open tabs

Status: Complete. Date: 2026-10-19.

Contract: [SPEC 009](../specs/009-session-continuity.md), accepted by the user with “aceptada” on 2026-10-19.

## Initial state

SpecSpace holds the selected canonical workspace in Rust memory for the current process. React holds the open document tabs, active document, saved content, revisions, and editor state in memory. A normal quit prompts about pending edits, but a later launch begins at the welcome screen and does not restore the prior workspace or tabs. Preserve all existing uncommitted SPEC 008 and SPEC 009 documentation work in this checkout.

## Dependencies and decisions

- Keep filesystem authorization and session metadata persistence in Rust. Reopen documents through the existing validated workspace read path; React must not gain general filesystem access.
- Persist paths and tab order only. Never persist editor buffers, saved copies, revisions as a substitute for current disk state, or other document content.
- Inspect current Tauri configuration and platform APIs before choosing a small Rust-owned config record or established plugin. Record the choice and its failure behavior here before broad implementation.
- Decision: restore automatically after validating the saved workspace. A stale workspace leaves the welcome screen available with a concise status notice.
- Storage: Rust owns `session.json` under Tauri's app config directory; no new plugin is required. The record is size-bounded and atomically replaced through a same-directory temporary file.

## Steps

1. Trace application startup, workspace selection, open-tab ordering, active-tab changes, normal quit guards, and Rust workspace validation. Record state transitions and metadata storage choice.
2. Add a Rust-owned session record and narrowly scoped commands/events for reading and updating workspace/tab path metadata. Validate the restored workspace and every relative document path at the Rust boundary; reject traversal and symlinks through existing path rules.
3. Coordinate startup restoration so the workspace opens first, valid tabs load from current disk content, tab order and active selection are reconstructed, and missing/stale entries are skipped with a concise notice. Keep welcome usable if restoration cannot proceed.
4. Update persisted metadata after successful workspace and tab state changes. Ensure pending edits remain protected by the existing quit/close prompts and never enter persisted session metadata.
5. Add focused tests for metadata round-trip, restart reconstruction, stale/missing/invalid paths, tab order/active selection, storage errors, and existing dirty-save lifecycle protections.
6. Run relevant frontend and Rust checks, formatting, build, and `git diff --check`. Build the macOS package and verify normal quit/relaunch in an isolated QA app with a disposable workspace, preserving the user's app session.
7. Record observed behavior and limits; update SPEC 009, ARCHITECTURE, SPEC, and PROJECT_STATUS if the implementation requires a current-product description. Update indexes and mark complete only when every criterion has evidence.

## Expected affected files

Likely: `src-tauri/src/lib.rs`, a focused Rust session module if justified, `src-tauri/Cargo.toml` and lockfile only if the selected storage approach requires it, `src/App.tsx`, focused frontend/Rust tests, `ARCHITECTURE.md`, `SPEC.md`, `PROJECT_STATUS.md`, `specs/009-session-continuity.md`, this plan, and the spec/plan indexes. Confirm scope after tracing current app lifecycle; avoid unrelated refactors.

## Risks and preservation

- Do not overwrite user work or close the normal running app to verify relaunch. Use a QA-specific app identity and disposable workspace.
- A stale absolute workspace path must fail explicitly; never infer a replacement from a folder name.
- Treat session metadata as untrusted input. Rust revalidates containment, symlink boundaries, extensions, and document existence before opening anything.
- A crash may leave metadata representing the last tab state, but this increment does not promise crash recovery or unsaved-content recovery. Describe only the verified normal quit/relaunch behavior.
- If persisting state fails, report it without blocking editing or corrupting workspace/document data.

## Progress and validation

- [x] Trace lifecycle and select metadata storage approach.
- [x] Implement Rust-owned session metadata persistence and validation.
- [x] Restore workspace and valid clean tabs at startup.
- [x] Persist workspace/tab ordering and active selection safely.
- [x] Add focused lifecycle and path-validation tests.
- [x] Run project checks and package the app.
- [x] Verify normal quit/relaunch in an isolated macOS app.
- [x] Update product/architecture/status documentation with evidence.

## Results and closure

Implementation: Rust persists the last canonical workspace, ordered relative paths for up to 500 tabs, and an optional active-tab index as bounded JSON beneath Tauri's app config directory. Writes use a synced same-directory temporary file and atomic replacement. Rust rejects malformed metadata, duplicate or non-Markdown paths, traversal components, invalid active indexes, and non-absolute workspace paths. Restoration requires the saved workspace to canonicalize to exactly the saved path and to remain a directory; documents reopen through the existing validated `open_document` boundary. React skips unavailable documents, restores the selected surviving tab (or first valid tab), shows a status notice, and saves only navigation metadata. Normal quit waits for metadata persistence after the existing dirty-edit guard; persistence failure is reported but does not prevent quit.

Validation on 2026-10-19: 35 frontend tests passed, including restoration order/active tab, current disk content, skipping an unavailable tab, and confirming serialized metadata contains no document content. 9 Rust tests passed, including metadata round-trip, write-time unsafe path rejection, and filtering unsafe tab metadata while retaining valid session state. `npm run build`, `npm run format:check`, `cargo fmt --check`, and `git diff --check` passed. The first online Cargo check could not resolve crates.io; the same test run succeeded with `--offline` from the existing local Cargo cache.

Packaged QA: built `/private/tmp/spec-space-pele-target/release/bundle/macos/SpecSpace Pele QA.app` with a separate app identifier, then used disposable files under `/private/tmp/spec-space-pele-qa/workspace`. Opened `Architecture.md` then `Requirements.md`; Rust persisted `{"workspace":"/private/tmp/spec-space-pele-qa/workspace","tabs":["Architecture.md","Requirements.md"],"active":1}` in the QA app config directory. Quit through the normal app quit command and relaunched the app. The workspace, both tabs in the same order, and `Requirements.md` as active document reappeared with the clean current disk content and “Session restored” status. Added a disposable unsaved edit and invoked normal quit: the existing prompt offered Cancel, Discard changes, and Save changes. Cancel preserved the dirty editor; Discard left the Markdown file unchanged, and the reopened QA window showed the clean disk content. The regular SpecSpace app session was not closed or modified.

The QA demonstrated normal quit/relaunch, metadata shape, and the existing dirty-edit quit prompt. The automated tests covered unavailable documents being skipped while valid tabs restored and unsafe metadata being filtered. Crash/power-loss recovery and restoration from a moved workspace are outside the contract. Implementation and validation are complete locally; no commit or publication was performed.
