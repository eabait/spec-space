# Implementation plans

- [005 — Mermaid image export](005-mermaid-image-export.md): complete; accepted and validated locally on 2026-10-19.

- [006 — Precise text selection](006-precise-text-selection.md): discarded by the user on 2026-10-19 after packaged-app validation; see recorded outcome.

- [007 — Evaluate Pele as a Mermaid renderer](007-pele-renderer-evaluation.md): complete; recommends a separately accepted integration increment.

- [008 — Replace Mermaid with Pele for diagram previews](008-pele-mermaid-renderer.md): complete; accepted 2026-10-19.

- [009 — Restore the last workspace and open tabs](009-session-continuity.md): complete; accepted and implemented 2026-10-19.
- [010 — Visual experience for reading and navigating specifications](010-visual-experience-revamp.md): complete and user-validated; implementation plan acceptance and validation are recorded on 2026-10-19.

- [001 — Connected Specifications](001-connected-specifications.md): implementation and validation evidence.
- [003 — Create Markdown documents](003-create-markdown-documents.md): complete local implementation and validation evidence.

- [004 — Bulk tab closing](004-bulk-tab-closing.md): complete; native and automated validation evidence.

Each plan corresponds to an accepted SPEC in [specs/](../specs/README.md).

[Proposal 002](../specs/002-assisted-artifact-inventory.md) and its pilot are deferred while Horizon 1 authoring is the active focus. It has no implementation plan. If resumed, resolve its open decisions and record acceptance before creating the matching plan.

Create `NNN-name.md` using the same ID and name as its SPEC:

- Link to the SPEC, status, date, and acceptance evidence.
- Initial state, dependencies, and affected files.
- Ordered steps with expected results and progress.
- Risks, data preservation, and rollback strategy as applicable.
- Validation tied to each criterion, with commands or manual steps.
- Actual results, limitations, and outstanding work.
- Closure: update SPEC, ARCHITECTURE, and PROJECT_STATUS.

Do not mark a plan complete without evidence. Record routine technical adjustments here; contract changes return to the acceptance workflow in [SDD.md](../SDD.md).
