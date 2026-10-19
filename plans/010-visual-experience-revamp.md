# Plan 010 — Visual experience for reading and navigating specifications

Status: Complete and user-validated: 2026-10-19.

Contract: [SPEC 010](../specs/010-visual-experience-revamp.md), implementation scope accepted with “aceptada” and plan accepted with “aceptado” on 2026-10-19; implementation explicitly requested.

## Initial state

The current interface uses cool-gray surfaces, a conventional file tree and tab strip, a Markdown preview styled as a generic panel, a separate Connections view, and a book-shaped app icon. The user reviewed a warm editorial and blueprint-inspired direction positively. Preserve all existing uncommitted work, especially SPEC 008 and 009.

## Decisions and dependencies

- Preserve product behavior and local-first/security contracts. This increment changes presentation and responsive pane arrangement only.
- Keep the file tree, tabs, toolbar, current mode controls, status feedback, and separate Connections view. Do not add the mockup's outline or contextual reference rail.
- At wide sizes use a broad reading pane and functional source pane side by side. At minimum size make Source and Preview independently usable through the existing controls; preserve the mounted editor and its state when changing layouts.
- Build all app icon outputs from one approved connected-module blueprint concept. Inspect configured Tauri icon files and available image tooling before choosing a reproducible conversion path.
- Use checked-in examples for visual validation. No external workspace content is included.

## Steps

1. Inspect the current UI and all configured Tauri icon assets. Record the current relevant interaction and visual states without closing the user's session.
2. Translate the reviewed direction into concrete design tokens: page/chrome colors, text hierarchy, reading measure, spacing, borders, selection/focus/dirty/error states, and diagram styling.
3. Implement the cohesive visual changes in React/CSS, retaining current behavior. Adjust only the existing responsive source/split/preview layout as required to keep both panes usable at 850 × 580.
4. Create the replacement icon master artwork and update the source SVG plus every configured Tauri icon size/format consistently. Inspect small-size readability and macOS rendering.
5. Add or update focused tests only where responsive mode behavior or UI state preservation requires coverage. Do not add tests that merely assert style declarations.
6. Run frontend tests, build, format checks, `git diff --check`, Rust tests/formatting as appropriate, and package a macOS app.
7. Verify the actual rebuilt app at normal and minimum sizes with Architecture.md, Requirements.md, and Connections; check Source/Preview switching, unsaved text, selected tab, save state, links, and diagram actions. Inspect the packaged Dock/Finder icon. Use an isolated QA identity and disposable workspace, preserving the user's running app/session.
8. Record observed results, update SPEC, ARCHITECTURE, README and PROJECT_STATUS as warranted, and close only when every criterion has evidence.

## Expected affected files

Likely `src/styles.css`, `src/App.tsx` only if narrow-layout mode behavior requires it, focused UI tests if behavior changes, `src-tauri/icons/source.svg` and configured generated icon assets, and current-product docs. Confirm exact scope before editing; avoid unrelated refactors or dependencies.

## Risks and preservation

- Do not edit workspace Markdown examples to improve screenshots; use their existing content.
- Keep blueprint decoration out of the document body where it harms contrast or increases visual noise.
- Preserve existing editor instance, text, selection, undo history, active tab, dirty state, and source/preview choice across resizing and view changes.
- Do not close or replace the user's running SpecSpace session. Verify the executable path before native checks.
- Preserve the generated direction boards as evidence; the icon and UI in them are concepts, not ready-to-ship assets.
- No commit, publishing, notarization, or deployment unless separately requested.

## Progress and validation

- [x] Inspect existing UI/icon assets and record baseline states.
- [x] Implement the accepted visual system across the existing workspace and Connections surfaces.
- [x] Make wide and minimum-size source/preview layouts practical without losing editor state.
- [x] Replace all configured app icon assets and inspect small-size/macOS rendering.
- [x] Run project checks and isolated packaged-app visual validation at normal/minimum sizes.
- [x] Record evidence and close SPEC/plan only after all criteria pass.

## Implementation and validation results

- Reworked `src/styles.css` across the workspace chrome, editor, Markdown typography/elements, diagrams, Connections, controls, focus/dirty/error states, and compact layout. `src/App.tsx` adds a compact effective pane mode while keeping the editor mounted and retaining the selected mode. `src/Editor.tsx` styles CodeMirror to match the new source surface.
- Replaced the book mark in `src-tauri/icons/source.svg` with connected modules and regenerated every configured Tauri icon output (`32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png`, `icon.icns`, `icon.ico`). The generated source SVG was inspected at small size; the native packaged app displayed the replacement mark.
- Automated validation: `npm test` passed (35 tests in 7 files); `npm run build` passed; `npm run format:check` passed; `git diff --check` passed. The Vite build reported its existing large JavaScript chunk advisory. No Rust files changed, so Rust tests and formatting were not needed for this presentation/icon-asset increment.
- Packaged QA used an isolated identity, `com.specspace.peleqa`, and the disposable workspace at `/private/tmp/spec-space-pele-qa/workspace`. The user's running `com.specspace.desktop` session was left untouched. Normal-size QA verified the visual system, split editor/preview, rendered diagram/content, and Connections. At approximately 850 × 580, the compact controls provided readable Source and Preview single-pane states. A temporary unsaved marker remained present and dirty across resize; it was discarded on the isolated QA copy. After correcting Source-only width, the rebuilt package was relaunched and confirmed Source filled the full document area. The isolated Dock icon showed the new architecture mark.
- A first wide Source-only inspection exposed a 44%-width blank remainder. Added a flex rule for the single-pane layouts, rebuilt the isolated package, and repeated the visual check successfully.
- No user workspace documents were edited. No commit, publication, notarization, or deployment was performed.

## Closure

All SPEC 010 acceptance criteria are met based on the automated checks and isolated packaged-app visual checks above. The user's ordinary SpecSpace session remained open throughout. The user validated the increment with “valide el incremento” on 2026-10-19.

## Evaluation evidence

The user accepted the evaluation direction with “aceptada” and reviewed its first design board with “está muy bueno”. The implementation scope was then accepted with “aceptada”. Generated boards:

- `/Users/estebanabait/.codex/generated_images/01a154ce-a2e6-7cf0-8295-b5825a4a7c5c/exec-4eaf81d7-4d4f-4882-9bb3-e476347332c5.png`
- `/Users/estebanabait/.codex/generated_images/01a154ce-a2e6-7cf0-8295-b5825a4a7c5c/exec-71b290ef-cfdd-42ed-b427-a186cffead58.png`

They propose warm editorial reading surfaces, navy text, restrained teal/copper, subtle blueprint marks in application chrome, wide split editing/reading, a focused compact mode, and a connected-module icon without book imagery. Some copy in the generated boards is illustrative and must not be treated as exact product behavior or content.
