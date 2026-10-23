# Agent integration — candidate backlog

Date: 2026-10-21. Status: analysis and unaccepted candidates, not implementation scope.

## Selected proposal

The subsequent user discussion selected a centered floating palette with one default free-prompt action, reusable CLI profiles (agent, model, installed skills, and advanced parameters), and later user-configured actions. [Proposal 017](specs/017-agent-palette-and-cli-profiles.md) now defines the recommended first slice. This selection supersedes the earlier recommended ordering below; the remaining candidates are retained for later prioritization. The user accepted SPEC 017 with “si acepto” on 2026-10-21; its matching plan is recorded and implementation is pending. Other backlog candidates remain unaccepted.

## Source and decision boundaries

Derived from the shared conversation [Explore local agents](https://chatgpt.com/share/6ad8db6f-b934-83e9-8fb6-b1fb2fb60562), especially the user's second message selecting **hybrid experience, supervised autonomy, and CLI integration**, and requesting design exploration before a specification.

Those are design preferences, not acceptance of the assistant's architecture or roadmap. Two providers at launch, a separate worker, staged writes, task storage, MCP, and the proposed five increments remain suggestions. The conversation's checked validation widget is not test evidence: no reproducible execution results are supplied.

Repository sources: [VISION](VISION.md), [current product](SPEC.md), [architecture](ARCHITECTURE.md), [status](PROJECT_STATUS.md), and [SDD](SDD.md). Current source inspection confirms Rust-owned revision-checked writes and frontend save coordination; no agent execution integration was identified. No CLI compatibility or isolation experiment was run for this analysis.

## Product assessment and 2026-10-21 direction correction

The user clarified that agents should perform the main file authoring and editing work, while humans make only occasional manual edits. The user then made the priority explicit: invest in an ergonomic experience that helps people **understand** the specifications they navigate.

**Rationale:** the previous backlog treated human editing as the core workflow and agent assistance as an optional addition. That does not reflect the intended division of work.

**Consequences:** understanding becomes the primary product experience; agent authoring and supervised review support it. Navigation, reading, diagrams, context, decisions, and explanations of proposed changes take priority over editor sophistication or a broad agent platform. Existing manual editing remains available. This direction does not approve any implementation, select a provider, or resume proposal 002.

The hybrid experience and CLI preference from the shared conversation remain design inputs. Generation and modification are central agent responsibilities, but integrating execution is not a prerequisite for improving human understanding of files already produced by external agents.

Existing Connections supplies saved-document references and backlinks, not semantic dependencies. Diagram navigation and direct-node inspection already exist. New work must improve a demonstrated comprehension problem instead of duplicating them or reopening rejected SPEC 016.

## Primary backlog: human understanding

These candidates precede the agent-integration sequence below. They are proposed slices, not accepted SPECs. All align with the revised vision; relative sizing uses the definitions below.

| ID    | Candidate                                               | Size | Bounded outcome and proposed acceptance                                                                                                                                                                                                               | Dependencies / limits                                                                                                                                                  |
| ----- | ------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-01 | Validate a real specification-reading journey           | S    | Observe a person locating the system purpose, following a relationship, explaining a diagram, and identifying an unresolved decision. Record wrong turns, lost context, and tool detours; select the most costly friction for the next increment.     | Use current features and representative local documents; no new UI required.                                                                                           |
| UX-02 | Navigate back and forward without losing place          | M    | After following a document reference, return to the prior document and reading position; preserve independent pending edits and make unavailable destinations explicit.                                                                               | Define session-only history first; reuse tabs and outline. No diagram-node-to-source navigation.                                                                       |
| UX-03 | Read a document with its immediate context              | M    | From the reading view, inspect incoming/outgoing document references and open a related document without detouring through the whole graph. Show saved-index, stale, and missing-target states.                                                       | Reuse Connections; links mean references, not inferred dependencies. Validate whether contextual access reduces lost orientation.                                      |
| UX-04 | Compare two related specifications while reading        | M    | Keep a source document visible while inspecting another; make each document identity and navigation target clear. Preserve reading positions and dirty editors.                                                                                       | Test whether two reading panes are useful at normal size and define a compact fallback. This is distinct from the current Source/Preview split.                        |
| UX-05 | Understand an agent-proposed change before approving it | L    | Show before/after source and rendered Markdown or diagrams, affected document identity, the agent's stated reason, and unresolved assumptions. Clearly separate reported intent from observable changes. Approval targets the exact reviewed version. | Needs a bounded proposal input contract; agent execution is not inherently required. Pair with AI-07 conflict protection before applying changes. Start with one file. |
| UX-06 | Recognize decisions and open questions while reading    | M    | Navigate an explicitly authored decision/question index with source links; distinguish pending, accepted, and unknown only when supported by document evidence.                                                                                       | First validate a portable opt-in convention on real specs. No automatic acceptance inference or mandatory schema across all documents.                                 |
| UX-07 | Ask for an explanation tied to the current context      | M–L  | Request an explanation of a selected section or diagram with source references; distinguish source facts, interpretations, and unanswered questions. Retain the reading context when closing the explanation.                                         | Depends on a proven execution adapter and explicit context selection (AI-01–03 adapted to explanation). No need for a general chat product.                            |

**Recommended next step:** UX-01, followed by one observed friction addressed by UX-02 or UX-03. UX-05 is the bridge to supervised agent authoring. Do not wait for a universal execution layer to improve reading and navigation.

## Supporting backlog: agent execution and authoring

These IDs identify backlog candidates, not numbered SPECs. P0 is discovery before commitment; P1 is the first useful agent-integration release, after selecting it within the understanding-led roadmap; P2 follows demonstrated value; P3 is optional later work. Size is relative scope/risk, not a duration estimate: S = bounded document/UI work, M = one substantial subsystem, L = several boundaries or lifecycle risks.

| ID    | Candidate                                        | Priority | Size | Dependencies                         | Vision                                     |
| ----- | ------------------------------------------------ | -------- | ---- | ------------------------------------ | ------------------------------------------ |
| AI-01 | Prove one CLI's execution and isolation contract | P0       | M    | Priority decision                    | Refines local-first assistance             |
| AI-02 | Prepare a reviewable context snapshot            | P1       | M    | AI-01 contract                       | Aligns with user control and portability   |
| AI-03 | Run and cancel one specification review          | P1       | L    | AI-01, AI-02                         | Aligns with Write / Understand             |
| AI-04 | Review findings with verified source evidence    | P1       | M    | AI-03                                | Aligns with Understand / Evolve            |
| AI-05 | Suggest related documents as optional context    | P2       | M    | AI-02, AI-04; existing Connections   | Aligns with Connected Specifications       |
| AI-06 | Generate one proposed ADR in isolation           | P2       | M    | AI-03, AI-04                         | Aligns with Write / Evolve                 |
| AI-07 | Review and apply one proposed document change    | P2       | L    | AI-06                                | Aligns with human control and preservation |
| AI-08 | Keep a bounded local task history                | P2       | M    | AI-04                                | Aligns with continuity and traceability    |
| AI-09 | Refine a result conversationally                 | P2       | M    | AI-04, AI-08; AI-07 for file changes | Refines the hybrid experience              |
| AI-10 | Support a second CLI through proven capabilities | P3       | M–L  | AI-01–04 proven with one provider    | Refines provider independence              |
| AI-11 | Load portable workspace task definitions         | P3       | M    | AI-03, AI-04; stable result contract | Aligns with open formats                   |

## Candidate details and proposed acceptance

### AI-01 — Prove one CLI's execution and isolation contract

**Outcome:** choose a supported provider and version based on observed behavior. Candidate providers from the conversation are Codex CLI and Claude Code; selection and current capabilities remain unverified.

**Scope:** an isolated technical experiment on disposable Markdown fixtures, with an execution decision record. Check executable resolution from the packaged macOS environment, authentication readiness, noninteractive execution, result transport, permission enforcement, cancellation, and errors. Compare a Rust-managed child process with a separate worker; do not introduce a daemon by default.

**Acceptance:** record the exact version, invocation, supported capabilities, known limitations, and reproducible outcomes for success, missing executable, unavailable authentication, malformed output, timeout, cancellation, and attempted writes outside the permitted area. Verify descendants terminate and fixture originals remain byte-identical. Include an attempted read outside selected context to establish what is actually enforceable. Unsupported enforcement blocks the corresponding product promise.

**Risk/gate:** a temporary directory or working-directory setting is not a sandbox. An installed local CLI does not establish that model inference or data processing stays local. Document the actual provider/data boundary before any real documents are used. Do not collect credentials or install agents as part of detection.

### AI-02 — Prepare a reviewable context snapshot

**Outcome:** the user can see exactly which document versions a review will receive.

**Scope:** active saved Markdown document, task instructions, and a manifest containing relative paths and content hashes. Start with saved content only; if the tab is dirty, offer the normal save flow or an explicit review of the saved version. Do not silently save. Additional documents remain explicit selections.

**Acceptance:** the manifest matches the immutable input bytes; files outside the workspace, symlinks, oversized content, and excluded paths are rejected through Rust. Missing or changed inputs prevent launch or require rebuilding the snapshot. Show limits and omissions without silent truncation. Inclusion of workspace instructions such as AGENTS.md is visible and cannot expand enforced permissions.

**Risk:** document contents and task instructions may contain misleading instructions. The execution boundary, not prompt wording, must enforce allowed capabilities. Future use of unsaved buffers needs a separate provenance contract.

### AI-03 — Run and cancel one specification review

**Outcome:** invoke Review Specification from the active document and continue editing while it runs.

**Scope:** one configured CLI, one built-in task, one active execution, bounded output, explicit timeout, and states for starting, running, completed, failed, and cancelled. React handles interaction; Rust owns process execution and validated IPC. No general shell command entry in the webview.

**Acceptance:** success shows a result; launch/authentication/permission failures remain distinguishable; cancellation and timeout terminate the process tree and cannot later publish a successful result. Workspace switching and normal quit resolve the active task predictably. Late events cannot attach a result to another workspace. Editing and saving remain usable throughout execution.

**Risk:** the existing serialized action flow makes background UI inert while an action is pending. A long-running agent task needs its own lifecycle rather than holding that lock for the duration. No execution across app quit or automatic retry is promised.

### AI-04 — Review findings with verified source evidence

**Outcome:** make the result useful without giving the agent write access.

**Scope:** findings with category, explanation, suggested question/change, and source path plus quoted excerpt or range. Validate a bounded result schema. Findings remain proposals; allow reviewed/dismissed status during the session and explicit export as Markdown.

**Acceptance:** each citation is checked against the captured input and labelled verified, unresolved, or stale relative to current content. Navigation never treats invented paths or ranges as valid. Findings without source evidence are visibly assumptions. Invalid or partial responses are shown as failed/partial, never silently repaired into authoritative findings. Export uses existing guarded creation/saving and never overwrites without review.

**Validation:** use fixtures with seeded ambiguities and measurable criteria; record useful findings, missed issues, false positives, and review effort across repeated runs. Deterministic schema/path tests are separate from nondeterministic model-quality evaluation. Do not require identical model wording.

### AI-05 — Suggest related documents as optional context

**Outcome:** improve architecture reviews without automatically scanning or sending the entire workspace.

**Scope:** suggest direct outgoing references and backlinks from Connections; the user selects additions. Show the selection budget and stale/partial-index status. Add a bounded Architecture Review task over the chosen snapshot.

**Acceptance:** unselected documents are not supplied by SpecSpace; duplicates are removed; missing/unreadable targets remain visible; snapshot provenance is preserved. Compare the same fixture with and without related context and report whether omissions and invalid references improve.

**Risk:** this is context selection, not a semantic dependency graph. If the CLI can independently read more files, the UI must disclose that access or the adapter must restrict it; a manifest alone cannot promise exclusive access.

### AI-06 — Generate one proposed specification or ADR in isolation

**Outcome:** turn human intent or a reviewed question into a proposed specification or ADR authored by the agent.

**Scope:** one proposed new Markdown specification or ADR with source references, assumptions, and explicit pending decisions where applicable. Store output outside the original workspace under the proven execution policy. Preview it without applying it.

**Acceptance:** originals remain unchanged; malformed/oversized output is rejected; proposed paths cannot escape the workspace; existing-file collisions remain unresolved proposals. The generated ADR never claims human acceptance, implementation, or validation merely because the agent wrote it.

**Risk:** prefer structured returned content if sufficient. A general writable temporary workspace is not necessary for a single-document draft.

### AI-07 — Review and apply one proposed document change

**Outcome:** explicitly accept one new document or one existing-document modification after seeing its complete source diff.

**Scope:** one file per application, accept/reject, explicit save, base hash, and pending-editor checks. Exclude deletions, renames, multi-file transactions, automatic merging, and per-hunk acceptance initially.

**Acceptance:** approval applies only to the displayed proposal/version. Rejecting has no filesystem effect. An existing target changed on disk or in a dirty editor blocks application and requires renewed review; new files use exclusive creation. Preserve BOM, line endings, untouched Markdown, comments, and frontmatter. A successful application updates the tab and Connections without losing unrelated editor state. A failure retains the proposal and user edits.

**Risk:** existing revision-checked saving is reusable but does not provide cross-process locking or multi-file atomicity. State that limitation; do not promise stronger guarantees from an ordinary diff viewer. Validate with conflicts, dirty tabs, failed writes, and native app interactions.

### AI-08 — Keep a bounded local task history

**Outcome:** reopen a previous result and understand what produced it.

**Scope:** app-local task metadata, task-definition version, provider/version, input hashes, status, selected findings/results, and links to explicitly exported artifacts. Define retention, storage limits, and user-controlled removal. Raw provider logs and credentials are excluded by default.

**Acceptance:** normal relaunch restores completed records; interrupted tasks are labelled interrupted rather than resumed silently. Missing source files and stale citations remain visible. Removing operational history does not delete accepted Markdown artifacts. Explicit exports retain useful source references independently of operational history.

**Risk:** results and captured context can contain private document content. Define what is retained before persisting transcripts or complete snapshots; existing session metadata currently stores paths only.

### AI-09 — Refine a result conversationally

**Outcome:** ask a follow-up such as “consider this constraint” against an existing review or ADR draft.

**Scope:** a conversation attached to the task, reusing a visible, bounded context package; each turn creates a new execution/result version. Provider session resume is optional and must not be required for correctness.

**Acceptance:** the user can inspect the next turn's context; older proposals remain distinguishable; approval never carries automatically to a revised proposal. Cancellation affects only the active execution. A changed source snapshot requires explicit handling rather than silent mixing of old and new content.

**Risk:** unbounded transcripts increase cost and expose irrelevant context. Begin with explicit selected prior findings and instructions; no autonomous conversation loops.

### AI-10 — Support a second CLI through proven capabilities

**Outcome:** run the same review workflow with another installed agent.

**Scope:** add only the adapter capabilities needed by existing tasks. Show differences in isolation, output support, cancellation, and continuation rather than masking them.

**Acceptance:** the AI-01 fixture suite and AI-03/04 user flow work against each supported version. Disable tasks whose required capabilities are absent. Results share a validated format, not a promise of equivalent reasoning or findings. Never silently fall back to another provider.

### AI-11 — Load portable workspace task definitions

**Outcome:** reuse team-specific review instructions as ordinary versionable Markdown.

**Scope:** a small validated metadata header plus instruction text, with declared inputs and an existing output schema. Explicitly select a task; no executable hooks or automatic workspace activation.

**Acceptance:** invalid definitions show actionable errors; metadata cannot increase permissions or introduce arbitrary CLI arguments; context preview includes the task definition/version. The same task file remains readable outside SpecSpace.

## Recommended delivery sequence

1. Validate the understanding journey (UX-01), then address one observed navigation/context problem (UX-02 or UX-03). Prioritize additional reading and diagram ergonomics by evidence.
2. Design the review experience (UX-05) around one concrete agent-authored document change, including a useful explanation and preserved source evidence.
3. When integrating execution, prove AI-01 and combine context/execution with generation and safe application (AI-02, AI-03 adapted to authoring, AI-06, AI-07). A read-only review can be a technical probe, but is not the destination or a prerequisite proving that agent authoring is needed.
4. Add contextual explanation (UX-07), review findings (AI-04), richer related context, history, and conversational refinement according to observed needs. A second provider and configurable tasks follow a reliable primary workflow.

The initial AI-03 review task and AI-04 findings contract remain reusable candidates, not a mandatory release gate ahead of agent writing. AI-06/07 move into the first authoring slice when that slice is selected; UX-05 supplies its human review surface. These candidate dependencies must be resolved in the selected SPEC and plan, not interpreted as approval of the entire backlog.

Before product implementation, create accepted SPECs under [SDD](SDD.md); verify available numeric IDs at that time. This backlog reserves no SPEC number and records no acceptance.

## Deferred or excluded from this initiative

- MCP server: later, only for a demonstrated external-agent access use case; it requires a separate access contract.
- Impact analysis: later evidence-backed hypotheses, not a relabelling of document-reference edges as dependencies.
- Artifact decomposition and implementation planning: reconsider together with deferred proposal 002; do not revive automatic estimation or price calculation.
- Multi-agent orchestration, autonomous workflows, direct writes to the user's workspace, a persistent daemon, a skills marketplace, semantic memory, and Git-required execution: no initial need demonstrated.
- General chat, task administration, billing, deployment, and a replacement IDE: outside the intended focus.

## Open decisions for promotion

- Which observed comprehension problem should be addressed first, and when integrated agent execution adds more value than the next reading/navigation improvement.
- Which installed CLI/version to support first, after checking actual capabilities and the packaged-app environment.
- Which filesystem/tool/network guarantees can be enforced, and what data the configured provider may receive.
- Retention of source snapshots and results, and the exact save/review behavior before AI-07.

Documentation-only analysis: no application behavior, provider connection, executable installation, external execution, or accepted product contract was changed.
