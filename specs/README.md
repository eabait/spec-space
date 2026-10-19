# Incremental specifications

- [001 — Connected Specifications](001-connected-specifications.md): accepted on 2026-10-17; see the increment for implementation status and evidence.
- [002 — Assisted artifact inventory](002-assisted-artifact-inventory.md): deferred proposal as of 2026-10-18; direction retained while Horizon 1 authoring is the active focus. Pilot deferred too.
- [003 — Create Markdown documents](003-create-markdown-documents.md): implemented locally on 2026-10-18; native creation within the open workspace.

- [004 — Bulk tab closing](004-bulk-tab-closing.md): accepted and implemented locally on 2026-10-18; native and automated validation recorded in plan 004.

- [005 — Mermaid image export](005-mermaid-image-export.md): accepted and implemented locally on 2026-10-19; validation evidence and closure in plan 005.

- [006 — Precise text selection](006-precise-text-selection.md): discarded by the user on 2026-10-19 after packaged-app validation; Preview works well and the Source issue is accepted as a tradeoff.

- [007 — Evaluate Pele as a Mermaid renderer](007-pele-renderer-evaluation.md): evaluation complete; recommends a separately accepted integration increment. Production renderer unchanged.

- [008 — Replace Mermaid with Pele for diagram previews](008-pele-mermaid-renderer.md): implemented locally; native visual and PNG checks recorded in plan 008.

- [009 — Restore the last workspace and open tabs](009-session-continuity.md): implemented locally; validation evidence and closure in plan 009.
- [010 — Visual experience for reading and navigating specifications](010-visual-experience-revamp.md): implemented locally and validated by the user on 2026-10-19; see plan 010.

The baseline predating this workflow is documented in [SPEC.md](../SPEC.md). The repository was checked before assigning 009; no SPEC or plan numbered 009 existed.

Follow [SDD.md](../SDD.md). Create `NNN-name.md` with this minimum structure:

- Title, ID, status, and date.
- Problem and intended outcome.
- Relationship to VISION: aligned, refines, or changes it.
- Scope and exclusions.
- Behavior and data contract; security and preservation as applicable.
- Verifiable acceptance criteria and planned validation.
- Open decisions, risks, and relevant alternatives.
- Acceptance: date and explicit user evidence; pending until it exists.
- Link to the matching plan and closure evidence.

Keep proposals separate from the current contract. Verify the repository before assigning each new number.
