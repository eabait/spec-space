# Project status — start here

Updated: 2026-10-18. SpecSpace Desktop 0.1.0, local macOS application.

## Resume development

Read [AGENTS.md](AGENTS.md), [VISION.md](VISION.md), [SPEC.md](SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [SDD.md](SDD.md). Then read the relevant increment in [specs](specs/README.md) and [plans](plans/README.md).

## Current state

- MVP: local folders, tabs, CodeMirror, Markdown/Mermaid preview, explicit saving, and pending-edit protection. File → Open Folder… (⌘O) is the primary folder action.
- [001 — Connected Specifications](specs/001-connected-specifications.md) is implemented: saved-file index, outgoing references/backlinks, missing-document detection, and a navigable directed graph with zoom and automatic fit.
- Connections rebuild on workspace opening, successful save/reload, and refresh; editor buffers and undo histories remain intact. Errors, skipped files, and stale snapshots are visible.
- Repository: `/Users/estebanabait/Documents/Projects/spec-space`. Increment 001 is local and uncommitted on `main`; inspect Git before resuming. The initial baseline is tagged `v0.1.0`.

## Validation evidence

- Increment 001 validation (2026-10-17): 13 TypeScript tests and 6 Rust tests passed; frontend build, formatting, diff checks, and macOS release bundle succeeded. Details and limitations are in [plan 001](plans/001-connected-specifications.md).
- Native release executable verified by its full path. This repository initially produced 13 documents / 32 references before closure documentation added links. Graph navigation opened tabs and SPEC.md showed its outgoing reference and 4 backlinks.
- Temporary workspace checks: missing-target reporting, unsaved-edit notice, external refresh preserving pending content, save updating the graph, and reconstruction after restarting the app passed. Automatic fit was corrected and visually verified at approximately 850 × 580 and normal size.
- Bundle: `src-tauri/target/release/bundle/macos/SpecSpace.app`. No user session was closed; only the test session created in this task was restarted.
- Rust remains under `/private/tmp`; see README and verify availability on future runs.

## Limits and next step

Connections describe explicit document references, not semantic dependency or change impact. Scanning is bounded and reports partial results; see SPEC. No file creation, autosave, session recovery, file watcher, Git UI, or collaboration.

**Active focus: Horizon 1 — Authoring Workspace**, selected by the user on 2026-10-18. Assess the basic create/edit/preview/save workflow first, then editing/navigation friction and session continuity. No next application increment is accepted; define one bounded authoring SPEC before implementation. The next unused ID is 003.

User-requested authoring priorities also include closing all tabs, closing all except the active tab, and improving copy/paste. These refine Horizon 1 to reduce everyday editing friction. Bulk closing must preserve pending-change protection; concrete clipboard problems and expected source/preview behavior must be established before specifying changes. This records direction, not an implemented or accepted feature contract.

The user also requested exporting individual Mermaid diagrams as PNG files and copying them to the clipboard as images for reuse in other applications. This refines Horizon 1 by making authored diagrams easier to share while preserving their Markdown source; implementation details belong in a future increment.

[Proposal 002](specs/002-assisted-artifact-inventory.md) and its pilot are deferred. The assisted-inventory direction remains in VISION for future human fixed-price preparation; no automatic estimation is planned. The selected iCloud Drive/Test input and suggested EP-01 slice are retained for possible resumption. The npm audit found existing dependency advisories (versions unchanged from baseline); follow-up details are in plan 001. Do not publish or commit implicitly.

## Latest task

On 2026-10-18 the user requested preserving the assisted-inventory direction in VISION and focusing work on Horizon 1, then added bulk tab closing, copy/paste improvements, and Mermaid PNG export/image clipboard copying. Recorded the rationale above and added these priorities to VISION. Proposal 002 and its pilot remain deferred; prior read-only inspection of Test remains research only. Current SPEC and ARCHITECTURE continue to describe increment 001. Changes in this task are documentation only; prior local code work is preserved.
