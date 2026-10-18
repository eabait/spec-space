# 002 — Assisted artifact inventory

Status: Proposal — deferred. Created: 2026-10-17. Revised: 2026-10-18.

Priority decision (2026-10-18): the user requested preserving this direction in VISION and focusing work on Horizon 1 — Authoring Workspace. The rationale is to consolidate the writing/editing experience before adding assisted inventory. This proposal and its pilot remain available for future reconsideration; neither is an active next step or a prerequisite for authoring improvements. No implementation is accepted.

## Revision and direction

This is a revision of the unaccepted proposal previously named `002-fixed-price-estimation-baseline.md`, not a new increment. The initial draft included effort/cost calculations, role rates, commercial prices, and immutable quotation baselines. Those responsibilities are deferred following the user's 2026-10-18 clarification: first understand the path forward and assist in identifying the artifacts needed to resolve functional scope across requirements, technical/software architecture, UX/visual design, and testing design.

Relationship to VISION: **Refines**. Fixed-price preparation remains an important downstream use case. The immediate product contribution is a reviewed inventory and visible gaps, not automatic estimates. This rationale precedes the corresponding VISION revision.

## Problem and intended outcome

A functional scope does not directly reveal every artifact needed to design, build, verify, and deliver it. Related evidence is distributed across requirements, architecture, UX decisions, and testing strategy. A file-reference graph does not answer what exists, what needs work, or what is still unknown.

The intended outcome is a reviewable inventory for a selected functional scope. Each entry names a concrete artifact or deliverable, explains why it is needed, cites its supporting evidence, and identifies pending work or questions. It supports later human estimation without claiming exhaustive coverage, implementation completion, hours, or a price.

## Path before implementation

1. **Pilot the analysis on real documents.** Use the selected Test folder, one epic, and its shared prerequisites. Produce a small Markdown inventory with assistant help and review it with the user. This can happen in the current workflow; no in-app model integration or new persistence service is needed to test the idea.
2. **Validate the inventory model.** Check usefulness, granularity, omissions, duplicates, and correction effort. Refine fields from observed needs. If the result adds little value, prioritize editing and navigation improvements.
3. **Implement the smallest inventory experience.** Only after the pilot demonstrates value and the product contract is accepted, create the matching plan for scope selection, inventory review/editing, source navigation, and local save/reopen. Add in-app assisted analysis only with a separately specified execution/data-flow contract.
4. **Consider later capabilities from evidence.** Useful dependency visualization, comparisons as scope changes, and human estimation inputs can follow. Cost/pricing engines and a comprehensive SDLC platform are not assumed destinations.

This proposal establishes the pilot and candidate product behavior. It does not authorize implementing stages 3 or 4 before their acceptance. Stage 1 validates analysis usefulness, not a claim that the application already performs automatic analysis.

## Inventory structure

Use three concepts initially: selected scope, inventory entries, and open questions. Requirements, epics, or stories already present in the sources can identify scope; users need not create a full hierarchy of all three.

| Field            | Purpose                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| ID and name      | Stable local reference and a concrete, reviewable output                                                        |
| Scope references | One or more selected requirements, epics, or stories served by the item                                         |
| Discipline       | Requirements; technical design/architecture; UX/visual design; testing; implementation/delivery where supported |
| Kind             | Plain descriptive label such as API contract, user flow, adapter, or test suite; no universal ontology          |
| Evidence         | Source-relative file, section, excerpt, and revision at analysis time                                           |
| Basis            | Explicitly stated in a source, proposed from evidence, or manually added with rationale                         |
| Needed work      | Reuse, clarify, create, or adapt; unspecified remains unknown                                                   |
| Review           | Proposed, accepted, or excluded with a reason                                                                   |
| Open questions   | Unresolved decisions and their effect on this item                                                              |
| Prerequisites    | Optional references to other entries, only when an actual prerequisite is identified and explained              |

Accepting an inventory entry means accepting it as part of the inventory. It does not certify that the artifact exists, is approved, is implemented, or is deployed. Source document maturity (draft/proposed/accepted) remains visible in evidence.

A shared entry can serve multiple scope items and is recorded once. Requirements and design documentation are not counted as implementation effort. Dependencies are optional, specific prerequisites; source citations, scope coverage, and document links do not automatically create dependencies.

## Review lenses, not a mandatory waterfall

| Discipline                      | Questions the assistance should raise                                                                      | Candidate outputs when relevant                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Requirements                    | Are behavior, business rules, exceptions, acceptance criteria, and exclusions sufficiently defined?        | Refined story/use case, rule definition, acceptance criteria                       |
| Technical design / architecture | What solution elements, interfaces, data, constraints, and decisions need definition?                      | Component design, API contract, data model, justified ADR                          |
| UX / visual design              | Which journeys, screens, interaction states, accessibility considerations, and reusable assets are needed? | User flow, prototype, screen/state inventory, visual specification                 |
| Testing design                  | How will behavior and quality requirements be verified, with what data and dependencies?                   | Test scenarios/cases, test plan, test data, mocks, nonfunctional verification plan |
| Implementation / delivery       | What concrete results follow from the reviewed design, including shared and operational work?              | UI flow, adapter, schema change, pipeline, deployment configuration, runbook       |

These are review lenses that can evolve together. Not every requirement needs a separate ADR, UX artifact, or release. Out-of-scope or inapplicable disciplines can be marked with rationale. A document describing a prototype or test strategy does not prove that a prototype or executable tests exist.

Granularity should support an independent design/build/review decision. Start with meaningful deliverables; do not expand every class, method, field, or assertion. Split a broad entry only when different scope, ownership, dependencies, or verification make the distinction useful.

## Pilot: selected source and suggested slice

The user selected `Test` in iCloud Drive. Its local path is `/Users/estebanabait/Library/Mobile Documents/com~apple~CloudDocs/Test`. Inspect and reference these files read-only; do not modify the pilot documents or copy the full project into this repository.

The inspected materials describe an electronic subscription portal. `pb/PB.md` identifies a fixed-price engagement and indexes scope, assumptions, and milestones. `asd/ASD.md` defines ASD as **Architecture Specification Document**. Its sections include functional mapping, software architecture, UX decisions, testing, and operations. These sources are partly draft and include unresolved items.

Suggested first slice: **EP-01 — subscription initiation, identification, saving, and secure resumption**, with shared prerequisites included explicitly. This is a proposed pilot boundary, not acceptance of additional project scope.

Relevant source anchors:

- `pb/02-scope.md`: EP-01, UX/design-system uncertainty, shared delivery conditions, and exclusions.
- `asd/02-functional-overview.md`: functional-to-component relationships.
- `asd/06-software-architecture.md`: Subscription context, persistent state, identity uncertainty, and detailed designs deferred to individual components.
- `asd/adr/ADR-006-ux-flujos-frontend.md`: UX journey work, navigable prototype, responsiveness, accessibility, and open UI-kit/user-validation questions.
- `asd/10-testing.md`: testing strategy and gates; these are not automatically detailed EP-01 test cases.

Illustrative candidate entries, to be validated in the pilot:

| Discipline                | Candidate for EP-01                                                                   | Evidence versus proposal                                                     |
| ------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Requirements              | Define acceptance criteria for saving and securely resuming a subscription            | Capability is stated; the necessary detail needs review                      |
| Technical design          | Define the initiation/resumption interface and session/identity behavior              | Architecture discusses these concerns and leaves the identity mechanism open |
| UX / visual design        | Specify the resumption journey, challenge/error states, and responsive presentation   | Journey work is stated; exact screens/states are proposed for review         |
| Testing                   | Define resumption, expiration, failure, and access-control scenarios and test data    | Strategy exists; this scenario set is a proposal                             |
| Implementation / delivery | Implement the reviewed UI/API flow with shared state/audit facilities identified once | Candidate derived from scope/design; no implemented status is inferred       |

These examples are not a complete inventory or a claim that missing material does not exist elsewhere. A gap means “not established in the selected evidence.” The original RFQ and any actual UX/test artifacts referenced by these documents have not been verified in this task.

## Candidate behavior for the smallest tool

- Select scope and relevant saved source documents, see their versions, and state exclusions. Pending edits are identified rather than silently analyzed as saved content.
- Propose entries and questions from document contents with assistant support; each suggestion cites evidence and distinguishes source statements from inference.
- Review a single inventory table grouped or filtered by discipline. Inspect evidence alongside the entry; accept, correct, exclude, add, and merge entries.
- Preserve one identity for shared artifacts. Expose unaddressed questions and missing evidence without a fabricated completeness percentage.
- Keep optional prerequisite links lightweight. Report a cyclic prerequisite if one is recorded; do not build scheduling or graph infrastructure merely to store links.
- Preserve reviewed entries on later analysis. Present new suggestions separately and require review for changed decisions; no automatic overwrite or complex reconciliation engine in the first version.
- Save/reopen the reviewed inventory locally and provide a human-readable export. For the pilot, use ordinary Markdown. A later in-app persistence format and dedicated Rust commands must be specified before implementation; no database is presently needed.

An assisted analysis engine is a delivery decision after the pilot. The existing assistant can help validate the process now; this must not be represented as an implemented in-app AI feature. A future external model option needs an explicit data-flow, credential, cost, and network contract. No such transmission or permission expansion is authorized by this proposal.

## Exclusions

Automatic hours, rates, costs, price or margin calculations; quotation baselines; resource/capacity scheduling; automatic critical path; exhaustive semantic graph; code/test generation; creating a complete ASD/UX/test plan automatically; implementation/deployment verification; integrations with project trackers or CI/CD; multiuser collaboration; configurable workflow engines; general file management.

The existing document graph is preserved as navigation. A new graph is not an acceptance criterion for this proposal.

## Pilot acceptance and decision criteria

1. Produce a compact inventory for EP-01 or a user-selected alternative, examining all four design disciplines and any evidenced implementation/delivery implications. Inapplicability or exclusions are explained.
2. Every proposed entry has a concrete output, scope link, evidence or explicit inference, and needed-work classification. Questions remain questions instead of invented decisions.
3. Shared artifacts appear once; vague parent entries are not added to a count alongside their children as independent deliverables. Counts are grouped by kind/discipline and are not converted into effort or progress.
4. The user can identify what is already described, what needs clarification/design/building, and what is unknown. Accepted ADRs, proposed ADRs, documented tests, and executed tests are not conflated.
5. Record reviewer corrections, missed artifacts, duplicates, and review effort. Compare against the user's independent expectations for the slice. No numerical quality target or benefit is asserted before this review.
6. Make an explicit proceed/refine/pause decision with the user. The evidence should justify implementing a small inventory UI; successful document extraction alone does not establish product value.

Later implementation validation must cover preservation of source/dirty buffers, local persistence, source drift, review operations, and native usability. Those details belong in the accepted product contract and implementation plan after this pilot.

## Open decisions

- Confirm or adjust the suggested EP-01 pilot boundary and expected inventory granularity through review.
- Validate the example entries with the user and identify source documents that were referenced but not supplied.
- After the pilot, select the smallest useful product workflow, persistence format, and analysis execution method. No provider, graph database, or commercial-estimation engine is assumed.

## Authorization and acceptance

2026-10-17: the user authorized updating VISION and preparing a proposal, with fixed-price estimation as a main use case. The user subsequently selected the iCloud Test folder as the pilot input.

2026-10-18: the user requested revisiting the SPEC and VISION before further increments, prioritizing assisted artifact inventory across requirements, architecture/technical design, UX/visual design, and testing over default estimates. This revision follows that direction.

Status remains **Proposal — deferred** following the user's Horizon 1 prioritization. Neither the previous detailed estimation contract nor this candidate application behavior has been accepted for implementation. No implementation plan exists. If this direction is resumed, pilot review and acceptance would precede the matching plan, `plans/002-assisted-artifact-inventory.md`. Current implemented behavior remains in [SPEC](../SPEC.md).
