# Plan 004 — Bulk tab closing

Status: Complete. Date: 2026-10-18.

## Context menu follow-up — 2026-10-19

The user explicitly requested bulk-close actions on tab right-click. Earlier follow-ups changed frontend code but did not rebuild the native bundle; their claims that restarting would load an updated application were incorrect. The native bundle was rebuilt successfully on 2026-10-19. Close Other Tabs now receives the clicked path directly rather than relying on an asynchronous active-tab update. All 22 frontend tests pass, including right-clicking an inactive tab and retaining it. The context menu itself has not yet been visually verified in this rebuilt native application; the native evidence below applies to the original File-menu implementation.

Contract: [SPEC 004](../specs/004-bulk-tab-closing.md), explicitly accepted by the user with “aceptada” on 2026-10-18.

## Initial state and boundaries

The checkout contains the prior continuation documentation edits; preserve them. App coordinates tabs, revision-checked saving, and a shared pending-edit prompt. Rust owns native menus and filesystem access. Existing editors stay mounted when switching tabs or entering Connections.

## Steps

1. Add disabled-by-default native bulk-close menu items and a narrowly scoped command to synchronize their availability. Route both events through the existing serialized action guard and revalidate targets.
2. Extend the prompt with a scrollable dirty-path list and bulk labels. Save all targets before removing any; include the failed path and retain all tabs after a partial failure. Keep ordinary close/quit prompts unchanged.
3. Prevent editor transactions and background interaction while resolving the operation without remounting editors. Preserve selection, history, and active-tab state on cancellation/failure.
4. Cover targets, prompt choices, partial failures, native availability, repeated commands, and retained editor identity/history through focused interaction tests.
5. Run frontend tests/build/format, Rust tests/format, diff checks, and package the native app. Inspect the release executable in a disposable session at normal/minimum size, preserving existing user sessions.
6. Update current product, architecture, README, status, and indexes with actual evidence and limitations.

## Affected files and risks

App.tsx, Editor.tsx, styles.css, native lib.rs, focused tests, and SDD documents. No filesystem permission or save contract changes. Partial successful writes are durable and must remain accurately reflected. Menu updates must arrive in order. Long paths must wrap inside a scrollable prompt. Do not close a user session for native verification.

## Validation and closure

Completed on 2026-10-18:

- `npm test`: 21 tests passed, including seven bulk-close/lifecycle interaction tests and one real CodeMirror edit/undo protection test (criteria 1–7). Coverage includes zero/one/multiple tabs, Connections, dirty active-tab exclusion, all prompt choices, later save conflict retaining every tab and earlier successful saves, repeated commands, and existing single-close/workspace/window-close prompts.
- The real editor test initially exposed that undo bypasses transaction filters. Guarding dispatch instead blocks both typing and undo while busy and preserves history/selection when unlocked. The final test passed.
- `npm run build`, `npm run format:check`, `git diff --check`, seven Rust tests, and `cargo fmt --check` passed. `npm run tauri build` succeeded after the editor fix. Vite still reports large output chunks; no dependency changes were made.
- Native verification used `/private/tmp/SpecSpace-004-Validation.app`, copied from the final release bundle with only its plist identity changed to isolate it from the user session. Its executable SHA-256 matches the release bundle: `a02fd0bf7105dee38d917a0ecd08ac168d6661a25c6f3104c9e4edce1951f5fa`. Process inspection confirmed the validation executable and the original user process (PID 52802) coexisted.
- Disposable workspace: `/private/tmp/specspace-004-fixture`. Native menu items were disabled with zero tabs; both were enabled with two; Close Other Tabs was disabled with one. Two dirty tabs produced a Close Other Tabs prompt listing only `alpha.md`. Cancel retained both; Save All saved alpha and closed it while beta remained dirty. Native undo/redo still worked in retained beta. Close All Tabs followed by Discard Changes removed beta and retained the workspace. Disk inspection confirmed alpha's saved edit and beta's unchanged original bytes.
- The packaged prompt was visually inspected at the normal 1440-point window width (height constrained by the display) and the minimum 850 × 580 size, captured at Retina resolution. Controls and paths were readable without clipping (criterion 8). The empty validation instance was quit normally; no user session was closed.

Current product, architecture, README, status, and indexes updated. No application publishing or commit. SPEC 003's previously outstanding creation-dialog checks remain outside this increment; they are not claimed as completed here.
