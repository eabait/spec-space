# Project status — start here

Updated: 2026-10-21. SpecSpace Desktop 0.1.0, local macOS application.

## Resume development

Read [AGENTS.md](AGENTS.md), [VISION.md](VISION.md), [SPEC.md](SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [SDD.md](SDD.md). Then read the relevant increment in [specs](specs/README.md) and [plans](plans/README.md).

## Current state

- MVP: local folders, tabs, CodeMirror, Markdown/Mermaid preview, explicit saving, and pending-edit protection. File → Open Folder… (⌘O) is the primary folder action.
- [001 — Connected Specifications](specs/001-connected-specifications.md) is implemented: saved-file index, outgoing references/backlinks, missing-document detection, and a navigable directed graph with zoom and automatic fit.
- Connections rebuild on workspace opening, successful save/reload, and refresh; editor buffers and undo histories remain intact. Errors, skipped files, and stale snapshots are visible.
- [SPEC 005](specs/005-mermaid-image-export.md) is implemented locally with [plan 005](plans/005-mermaid-image-export.md): save an individual Mermaid diagram as PNG or copy it to the image clipboard. The user confirmed the outstanding manual checks; implementation and validation evidence are recorded in the plan.
- Repository: `/Users/estebanabait/Documents/Projects/spec-space`. Increments 001 and 003 are committed on `main`; the checkout was clean at the start of this continuation. Inspect Git before resuming. The initial baseline is tagged `v0.1.0`.

## Validation evidence

- Increment 001 validation (2026-10-17): 13 TypeScript tests and 6 Rust tests passed; frontend build, formatting, diff checks, and macOS release bundle succeeded. Details and limitations are in [plan 001](plans/001-connected-specifications.md).
- Native release executable verified by its full path. This repository initially produced 13 documents / 32 references before closure documentation added links. Graph navigation opened tabs and SPEC.md showed its outgoing reference and 4 backlinks.
- Temporary workspace checks: missing-target reporting, unsaved-edit notice, external refresh preserving pending content, save updating the graph, and reconstruction after restarting the app passed. Automatic fit was corrected and visually verified at approximately 850 × 580 and normal size.
- Bundle: `src-tauri/target/release/bundle/macos/SpecSpace.app`. No user session was closed; only the test session created in this task was restarted.
- Rust remains under `/private/tmp`; see README and verify availability on future runs.

## Limits and next step

Connections describe explicit document references, not semantic dependency or change impact. Scanning is bounded and reports partial results; see SPEC. No autosave, unsaved-edit recovery, file watcher, Git UI, or collaboration.

**Active focus: Horizon 1 — Authoring Workspace**, selected by the user on 2026-10-18. SPEC 010's visual direction, implementation scope, and plan were accepted on 2026-10-19. The redesign is implemented and validated locally; see [SPEC 010](specs/010-visual-experience-revamp.md) and [plan 010](plans/010-visual-experience-revamp.md). SPEC 003's minimum-window creation inspection remains outstanding.

The user accepted [SPEC 011](specs/011-document-section-outline.md) and its matching plan on 2026-10-19. The section outline is implemented and validated in automated checks and an isolated packaged macOS app; see [plan 011](plans/011-document-section-outline.md). [SPEC 012](specs/012-readable-markdown-tables.md) is implemented; automated checks and packaged layout checks pass. Manual confirmation of horizontal scrolling remains (see plan 012).

Bulk tab closing is implemented through SPEC 004. Mermaid-syntax PNG export and image clipboard copying are implemented through SPEC 005. SPEC 006 was discarded after packaged-app validation: Preview selection works well; horizontal selection in Source remains unresolved, and the user accepts that tradeoff. SPEC 007's isolated Pele comparison is complete. SPEC 008's Pele migration and isolated native visual, PNG save, and image-copy checks are complete; paste into another app was not repeated for Pele output. SPEC 009 is implemented locally: normal relaunch restores the last workspace and valid clean tabs from disk. SPEC 010's visual redesign and new system-blueprint icon are implemented and verified in the isolated packaged app. SPEC 011 adds a live per-document section outline with Source, Preview, and Split navigation; SPEC 012 keeps wide Preview tables readable with local horizontal scrolling; see plans 008–012 for evidence and limits. SPEC 003's minimum-window creation inspection remains outstanding. Next unused ID: 013.

[Proposal 002](specs/002-assisted-artifact-inventory.md) and its pilot are deferred. The assisted-inventory direction remains in VISION for future human fixed-price preparation; no automatic estimation is planned. The selected iCloud Drive/Test input and suggested EP-01 slice are retained for possible resumption. The npm audit found existing dependency advisories (versions unchanged from baseline); follow-up details are in plan 001. Do not publish or commit implicitly.

## Latest task

2026-10-21: Prepared [proposal 014](specs/014-find-and-focus-flowchart-nodes.md) after the user agreed to develop the node-search direction. Detailed acceptance is pending; the first planned step after acceptance is validating reliable flowchart-node mapping through Pele and the existing sanitizer. Next unused ID: 015. The user also approved increment 013 and confirmed the requested manual check with “validado”; plan 013's closure evidence still needs consolidation. This supersedes the earlier proposal/acceptance-pending description for 013 below.

2026-10-21: Prepared [proposal 013](specs/013-focused-diagram-view.md) for exploring one diagram in a focused read-only view with zoom, pan, fit, and preserved document context. Acceptance is pending; no implementation or plan has started. Existing SPEC 012 changes remain untouched. Next unused ID: 014 (supersedes earlier next-ID notes below).

2026-10-19: SPEC 005 accepted with “si”, implemented, and closed after the user confirmed the remaining manual checks with “comprobados”. Local PNG export and native image copying are implemented and the release bundle rebuilt. 23 frontend and 8 Rust tests pass. Actual PNG saving and image pasting into Preview and TextEdit passed on a sample diagram; see plan 005 for observed evidence and the limits of the user's confirmation. The SPEC 004 right-click menu was observed in the rebuilt native app.

2026-10-19: The user confirmed the SPEC 003 document-creation dialog in the packaged app is OK. Minimum-window inspection remains outstanding.

2026-10-19: SPEC 007 was accepted for comparison with “hagamos la comparación”. In a production browser harness, Pele 1.6.0 rendered all 11 valid cases in the 12-case corpus; existing SVG sanitization and PNG export worked except for the deliberately over-limit wide graph, which Mermaid also rejects at the current export boundary. Warm local median rendering ranged 0.1–0.9 ms for Pele versus 2.0–44.3 ms for Mermaid 11.17.2. Renderer-only gzip JavaScript was 280 KB for Pele and 974 KB for Mermaid. Pele's visual layout differs; see [plan 007](plans/007-pele-renderer-evaluation.md). Recommend evaluating a controlled production migration in a separate accepted SPEC; no renderer or dependency was changed.

2026-10-19: SPEC 008 was accepted with “avanzar”. Pele 1.6.0 now replaces Mermaid in Preview; Mermaid is removed from runtime dependencies. Pele and each diagram type load lazily, the existing SVG sanitizer remains, and diagram links/images are disabled. The checked-in Architecture flowchart and representative sequence, class, state, ER, Gantt, pie, architecture, style/directive, invalid, and unsafe-resource cases are covered by frontend tests. All 34 frontend tests and 8 Rust tests passed; the standard release bundle and an isolated QA bundle were built. Later isolated app verification visually confirmed the checked-in flowchart, native save to a valid 1478 × 128 RGBA PNG, and “Image copied” feedback. Cross-app paste with Pele output was not repeated. See [plan 008](plans/008-pele-mermaid-renderer.md).

2026-10-19: SPEC 009 was accepted with “aceptada,” and the user accepted its plan with “aceptado el plan, implementar.” Implemented Rust-owned local session metadata containing only workspace/tab paths and active index; normal startup restores clean documents from current disk content, skipping missing files. 35 frontend and 9 Rust tests pass; frontend build, formatting, Rust formatting, and diff checks pass. Isolated packaged QA confirmed normal quit/relaunch restores workspace, two tabs in order, and the active tab. See [plan 009](plans/009-session-continuity.md). Preserve earlier uncommitted SPEC 008 and SPEC 009 documentation changes.

2026-10-19: SPEC 010's plan was accepted with “aceptado”; implementation was explicitly requested and later validated by the user with “valide el incremento”. Updated the workspace, source editor, Markdown reading view, Connections styling, and connected-module app icon. Automated checks pass: 35 frontend tests, production build, formatting, and diff checks. Isolated packaged macOS QA verified the normal-size split and Connections view, compact Source/Preview access, preserved dirty editor state through resize, the rebuilt source-only pane filling the available width, and the new icon. The temporary edit was discarded in the isolated workspace; the user's running SpecSpace session was preserved. See [plan 010](plans/010-visual-experience-revamp.md).

2026-10-19: SPEC 011 and its plan were accepted before implementation. Added a transient accessible outline from the active unsaved Markdown buffer, with source-offset navigation into Preview and the existing CodeMirror instance and explicit Split synchronization. `npm test` passes 43 tests; production build, format check, and diff check pass. Isolated packaged macOS QA verified hierarchy, duplicate headings, frontmatter/code exclusions, Preview and Split navigation, normal layout, and panel usability at 850 × 580. The user's running app and files were left untouched. See [plan 011](plans/011-document-section-outline.md).

2026-10-19: The user selected local horizontal scrolling with readable minimum column widths to address Preview tables collapsing narrow columns and accepted the matching plan. Implemented an accessible local overflow region with content-based table sizing and left-aligned preview cells, while preserving Markdown alignment markers in source. 44 frontend tests, build, formatting, and diff checks pass; isolated packaged layout verification passed at normal and 850 × 580 sizes. The test fixture remained disposable and the user's app session was untouched. UI automation could not demonstrate the trackpad scroll gesture, as recorded in plan 012. Next unused ID: 013.

On 2026-10-18 the user accepted SPEC 004 with “aceptada”. Implemented File → Close All Tabs / Close Other Tabs plus the same actions in a tab right-click menu, target-only save/discard/cancel prompts, partial-save failure protection, native menu availability, and editor transaction guards preserving undo history. Validation: 22 frontend tests, 7 Rust tests, frontend/native release builds, formatting, and diff checks passed. Native checks used an isolated copy of the exact release executable and disposable files at normal and minimum 850 × 580 size; the user's running session was preserved. See plan 004 for evidence and the executable hash.

2026-10-19: SPEC 006 was accepted with “avanzar”, then discarded by the user after packaged-app validation. The user confirmed selection works very well in Preview, while horizontal selection in Source remains broken, and accepted this as a tradeoff. Reverted the SPEC 006 source implementation. SPEC 003's minimum-window inspection remains outstanding. Proposal 002 remains deferred.
