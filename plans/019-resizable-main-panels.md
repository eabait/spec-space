# Plan 019 — Resize the three main panels

Status: Complete and user-validated on 2026-10-27. SPEC 019 accepted by the user with “aceptado”; manual validation confirmed with “probado y aceptado el cambio”.

Contract: [SPEC 019](../specs/019-resizable-main-panels.md).

## Steps

1. Add transient panel-size state and pointer/keyboard separator interactions in `src/App.tsx`; keep editors mounted and preserve compact mode behavior.
2. Add layout variables, separator presentation, and clamped flex sizing in `src/styles.css`; keep current defaults and responsive breakpoint.
3. Add focused interaction tests for clamping, reset, and cleanup where the existing test harness can exercise real behavior.
4. Run frontend tests, build, formatting, and diff checks.
5. Build and inspect the packaged macOS app at normal and minimum sizes with a disposable workspace; record native drag and preservation results.

## Decisions and bounds

- Explorer preference: 248px wide (210px compact), clamped to 180–420px.
- Split preference: Source share defaults to 44%, clamped so Source and Preview each retain at least 280px when the available area permits.
- Preferences are session-only and reset to responsive defaults on a fresh launch.
- Resize handles use pointer capture and keyboard arrows; cancellation, blur, resize, and guarded operations end active interaction.

## Validation

Frontend validation: `npm test` passed with 55 tests; `npm run build`, `npm run format:check`, and `git diff --check` passed. `npm run tauri build` produced the release app bundle successfully. The user manually tested the packaged change and accepted the resize behavior, including the three-panel interaction and preservation expectations.

## Closure

All acceptance criteria are covered by the implementation, automated checks, packaged build, and user validation. No document content or session metadata contract changed. No commit, publication, or deployment was performed.
