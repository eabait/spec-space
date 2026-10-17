# SDD workflow

## Change lifecycle

1. Resume from PROJECT_STATUS and inspect the repository.
2. Define the problem, scope, exclusions, and relationship to VISION.
3. Write `specs/NNN-name.md` as a **Proposal** with verifiable criteria.
4. Record explicit user acceptance (date and reference or faithful summary); then mark **Accepted**. Keep unresolved decisions open; do not invent them.
5. Create `plans/NNN-name.md` with steps, affected files, risks, and validation. Do not implement an accepted SPEC without this plan.
6. Implement within the contract. Material scope changes return to proposal and acceptance; routine technical decisions belong in the plan.
7. Validate and record actual results, including anything that could not be verified.
8. Mark **Implemented** only after meeting its criteria. Update SPEC, ARCHITECTURE when relevant, and PROJECT_STATUS before closing.

## States and traceability

SPEC: Proposal → Accepted → In progress → Implemented. It may also be Rejected or Superseded; retain the reason and replacement link.

Plan: Pending → In progress → Complete; use Blocked with the reason and next action.

Use the same number and name in both files. Inspect directories for the next available number; never renumber history. Record dates and transition evidence; checked boxes do not replace results.

The baseline in SPEC describes work that predates this process: do not fabricate historical SPECs or retrospective acceptance. This workflow applies to future increments. Documentation fixes that do not change the contract may be made directly and recorded in PROJECT_STATUS; behavior changes, including bug fixes, require an increment proportionate to their size.

## Proportional validation

- Documentation: links, consistency with code, formatting, and the AGENTS line limit.
- Frontend: relevant tests, build, formatting, and affected interactions.
- Files and saving: Rust tests, text preservation, conflicts, and access boundaries.
- Menus or native integration: build Tauri and verify the updated app.
- UI: visually inspect the relevant state and window size.

Do not claim historical tests ran in the current task. Do not expand testing without a concrete reason. Commands are in README.
