# Plan 020 — Copy Markdown tables and clarify outline hierarchy

Status: In progress. SPEC 020 accepted by the user with “aceptada” on 2026-10-27; implementation and automated validation complete.

Contract: [SPEC 020](../specs/020-copy-markdown-tables-and-outline-indentation.md).

## Steps

1. Add source-position table extraction and an icon-only clipboard action in `src/Preview.tsx`, preserving the active unsaved buffer and existing table overflow.
2. Update outline presentation styles for left alignment and level-based indentation without changing parsing or navigation.
3. Add focused tests for exact table extraction, clipboard feedback, multiple tables, unsaved content, and outline hierarchy presentation.
4. Run frontend tests, build, formatting, and diff checks.
5. Build and inspect the packaged macOS app with disposable Markdown documents, copying tables into another Markdown-capable document and checking repeated H1/H2/H3 outline levels.

## Validation

Frontend validation: `npm test` passed with 56 tests; `npm run build`, `npm run format:check`, and `git diff --check` passed. `npm run tauri build` produced the release app bundle successfully. Packaged-app copy/paste and outline inspection remain outstanding before closure.
