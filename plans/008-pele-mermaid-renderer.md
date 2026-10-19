# Plan 008 — Replace Mermaid with Pele for diagram previews

Status: In progress. Date: 2026-10-19.

Contract: [SPEC 008](../specs/008-pele-mermaid-renderer.md), accepted with “avanzar” on 2026-10-19.

## Initial state

`src/Preview.tsx` dynamically imports Mermaid, serializes renders, sanitizes SVG with DOMPurify, and uses the rendered SVG for PNG save and clipboard copy. Mermaid 11.17.2 is a runtime dependency. SPEC 007 compared Pele 1.6.0 in a temporary production harness; no production renderer was changed in that increment.

## Steps

1. Inventory diagram types and relevant syntax in checked-in Markdown; record the corpus in this plan.
2. Add Pele as the local renderer and isolate the async render call behind a small adapter so security options, lazy loading, and unique SVG IDs are explicit.
3. Replace Mermaid in Preview, retain queue/debounce/stale-result handling and existing DOMPurify restrictions, and use Pele CSS variables for a readable neutral palette.
4. Update renderer/export tests to cover render options, SVG sanitization, errors, stale results, and export/copy behavior.
5. Remove Mermaid, update product and architecture docs, then run tests, frontend build, formatting, diff checks, Rust checks, and a packaged build if the temporary Rust toolchain is available.
6. Inspect the rebuilt native app only if it can be built without disturbing the user's running session; record actual evidence and limitations.

## Affected files

Expected: `package.json`, lockfile, `src/Preview.tsx`, a renderer adapter if warranted, diagram tests, `src/styles.css`, `SPEC.md`, `ARCHITECTURE.md`, this plan, SPEC 008, both indexes, and `PROJECT_STATUS.md`.

## Risks and preservation

- Do not remove DOMPurify or loosen its allowlist. Disable Pele links and images in fixed renderer options.
- Never insert diagram error strings as HTML; render errors as text.
- Preserve original Markdown verbatim and existing export IPC/limits.
- Pele's output style differs from Mermaid; inspect actual checked-in samples before settling styles.
- Do not close the user's app or documents to validate. Use an isolated disposable app instance if a packaged build can be produced.
- A failed corpus case or changed security boundary returns to the accepted SPEC for review rather than being silently excluded.

## Progress and validation

- [x] Record user acceptance and create the accepted contract before implementation.
- [x] Inventory checked-in Mermaid corpus.
- [x] Implement Pele rendering and remove Mermaid dependency.
- [x] Add/update meaningful frontend tests.
- [x] Run required automated checks.
- [ ] Complete visual and native PNG interaction checks in a clean isolated packaged-app workspace.

## Corpus and results

The only checked-in Mermaid fence is a left-to-right flowchart in `examples/Architecture.md`. Added renderer tests use that exact fence plus sequence, class, state, ER, Gantt, pie, architecture, and a flowchart with style declarations and an init directive. Invalid source, a link statement, and an external-image node cover failure and resource restrictions.

Pele is pinned at 1.6.0; Mermaid is absent from `package.json` and the lockfile. `src/pele-renderer.ts` dynamically imports `pele/lazy` on first diagram render, passes a unique ID prefix, and fixes `links` and `images` to false. Pele then loads the selected diagram type on demand. Preview retains its debounce and serialized queue, cancellation guard, DOMPurify SVG allowlist boundary, and existing PNG path. Pele errors render through React text content in the existing alert element.

Validation: all 34 frontend tests passed, including 11 Pele renderer cases and the existing PNG export flow; `npm run build`, `npm run format:check`, and `git diff --check` passed. The production frontend build emits a separate 25 KB gzip `pele/lazy` chunk plus per-type chunks. The existing large application chunk warning remains. All 8 Rust tests and `cargo fmt --check` passed using the temporary toolchain under `/private/tmp`. Tauri produced an 11.26 MiB release app bundle at `/private/tmp/spec-space-pele-target/release/bundle/macos/SpecSpace Pele QA.app` with a QA-only app identifier; no app in the project checkout was overwritten.

At the user's request on 2026-10-19, `npm run tauri build` also produced the standard 11.26 MiB bundle at `src-tauri/target/release/bundle/macos/SpecSpace.app`. This build used the same temporary Rust toolchain; README now documents installing Rust persistently through rustup.

The QA app opened, but it showed an already populated workspace. To protect that session, no workspace was changed and no save/copy buttons were pressed. Thus this verifies packaging and launch, not pixel-level visual appearance or native PNG save/clipboard behavior. Those checks remain outstanding. The temporary QA app and workspace files are under `/private/tmp/spec-space-pele-qa` and `/private/tmp/spec-space-pele-target`; they can be removed after any desired manual inspection.
