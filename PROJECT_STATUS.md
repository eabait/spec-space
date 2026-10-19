# Project status — start here

Updated: 2026-10-19. SpecSpace Desktop 0.1.0, local macOS application.

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

Connections describe explicit document references, not semantic dependency or change impact. Scanning is bounded and reports partial results; see SPEC. No autosave, session recovery, file watcher, Git UI, or collaboration.

**Active focus: Horizon 1 — Authoring Workspace**, selected by the user on 2026-10-18. Assess editing/navigation friction and session continuity. [SPEC 003](specs/003-create-markdown-documents.md) is implemented locally with [plan 003](plans/003-create-markdown-documents.md): create an empty Markdown file through the native File menu or explorer action, validate it in Rust, and open it in a clean tab. The user confirmed the packaged creation dialog is OK; minimum-window inspection remains outstanding. [SPEC 004](specs/004-bulk-tab-closing.md) is implemented locally with [plan 004](plans/004-bulk-tab-closing.md): native bulk tab closing with pending-edit protection.

Bulk tab closing is implemented through SPEC 004. Mermaid-syntax PNG export and image clipboard copying are implemented through SPEC 005. SPEC 006 was discarded after packaged-app validation: Preview selection works well; horizontal selection in Source remains unresolved, and the user accepts that tradeoff. Its source implementation is reverted; the standard bundle was not rebuilt at that time because `cargo` was unavailable. The temporary Rust toolchain is now available. SPEC 007's isolated Pele comparison is complete. SPEC 008 is accepted and in progress: replacing Mermaid with Pele while retaining the sanitizer and PNG workflow. The next unused ID is 009.

[Proposal 002](specs/002-assisted-artifact-inventory.md) and its pilot are deferred. The assisted-inventory direction remains in VISION for future human fixed-price preparation; no automatic estimation is planned. The selected iCloud Drive/Test input and suggested EP-01 slice are retained for possible resumption. The npm audit found existing dependency advisories (versions unchanged from baseline); follow-up details are in plan 001. Do not publish or commit implicitly.

## Latest task

2026-10-19: SPEC 005 accepted with “si”, implemented, and closed after the user confirmed the remaining manual checks with “comprobados”. Local PNG export and native image copying are implemented and the release bundle rebuilt. 23 frontend and 8 Rust tests pass. Actual PNG saving and image pasting into Preview and TextEdit passed on a sample diagram; see plan 005 for observed evidence and the limits of the user's confirmation. The SPEC 004 right-click menu was observed in the rebuilt native app.

2026-10-19: The user confirmed the SPEC 003 document-creation dialog in the packaged app is OK. Minimum-window inspection remains outstanding.

2026-10-19: SPEC 007 was accepted for comparison with “hagamos la comparación”. In a production browser harness, Pele 1.6.0 rendered all 11 valid cases in the 12-case corpus; existing SVG sanitization and PNG export worked except for the deliberately over-limit wide graph, which Mermaid also rejects at the current export boundary. Warm local median rendering ranged 0.1–0.9 ms for Pele versus 2.0–44.3 ms for Mermaid 11.17.2. Renderer-only gzip JavaScript was 280 KB for Pele and 974 KB for Mermaid. Pele's visual layout differs; see [plan 007](plans/007-pele-renderer-evaluation.md). Recommend evaluating a controlled production migration in a separate accepted SPEC; no renderer or dependency was changed.

2026-10-19: SPEC 008 was accepted with “avanzar”. Pele 1.6.0 now replaces Mermaid in Preview; Mermaid is removed from runtime dependencies. Pele and each diagram type load lazily, the existing SVG sanitizer remains, and diagram links/images are disabled. The checked-in Architecture flowchart and representative sequence, class, state, ER, Gantt, pie, architecture, style/directive, invalid, and unsafe-resource cases are covered by frontend tests. All 34 frontend tests and 8 Rust tests pass; the standard release bundle at `src-tauri/target/release/bundle/macos/SpecSpace.app` and an isolated QA bundle were built. README documents permanent Rust setup. Visual inspection and native PNG interaction remain outstanding: the QA launch showed an already populated workspace, which was left untouched. See [plan 008](plans/008-pele-mermaid-renderer.md).

On 2026-10-18 the user accepted SPEC 004 with “aceptada”. Implemented File → Close All Tabs / Close Other Tabs plus the same actions in a tab right-click menu, target-only save/discard/cancel prompts, partial-save failure protection, native menu availability, and editor transaction guards preserving undo history. Validation: 22 frontend tests, 7 Rust tests, frontend/native release builds, formatting, and diff checks passed. Native checks used an isolated copy of the exact release executable and disposable files at normal and minimum 850 × 580 size; the user's running session was preserved. See plan 004 for evidence and the executable hash.

2026-10-19: SPEC 006 was accepted with “avanzar”, then discarded by the user after packaged-app validation. The user confirmed selection works very well in Preview, while horizontal selection in Source remains broken, and accepted this as a tradeoff. Reverted the SPEC 006 source implementation. The packaged macOS bundle could not be rebuilt because `cargo` is unavailable; see [plan 006](plans/006-precise-text-selection.md). SPEC 003's minimum-window inspection remains outstanding. Proposal 002 remains deferred. Next unused ID: 008.
