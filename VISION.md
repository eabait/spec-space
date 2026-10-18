# SpecSpace — Product Vision

> Status: Revisable strategic vision.
> Defines the product direction, not committed scope.
> `SPEC.md` is the source of truth for the current product.

## 1. Purpose

SpecSpace aims to transform how software engineering teams create, understand, evolve, and use technical specifications.

Its goal is to turn software documentation into a living, navigable, connected workspace where requirements, architectural decisions, diagrams, and technical solutions can be developed and maintained clearly.

Documents should be more than files to read: they should help people think, design, collaborate, and build software.

A primary downstream use case is preparing fixed-price software proposals. SpecSpace helps users understand the artifacts needed to satisfy functional scope across requirements, technical design/software architecture, UX/visual design, and testing. A reviewed inventory and explicit gaps provide input to human estimation; the product does not estimate projects by default.

## 2. The problem we want to solve

Software specifications are often fragmented across documents, folders, and tools.

This makes it difficult to:

- Quickly understand a project's scope.
- Navigate functional and non-functional requirements.
- Interpret architectures and technical diagrams.
- Identify relationships and dependencies between specifications.
- Maintain consistency as a project evolves.
- Detect inconsistencies, ambiguities, and omissions.
- Connect design decisions to their implementation.
- Use specifications as input for AI-assisted development processes.
- Build a reviewable inventory of design, implementation, verification, and delivery artifacts for a selected scope.
- Avoid counting shared work several times or overlooking integration, testing, and deployment effort.
- Understand what is documented, what still needs design or implementation, and what remains unknown.

Traditional editors solve the writing problem, but do not necessarily help users understand the system as a whole.

## 3. Vision

Become a workspace dedicated to software specifications, where teams can move naturally from isolated documents to an understandable, connected, evolving representation of a system.

SpecSpace aspires to combine four capabilities:

### Write

A clear, fluid editing experience tailored to engineering documentation.

Writing and maintaining specifications should be simple, without unnecessary complexity.

### Understand

Help users understand a project beyond any individual document.

Navigate requirements, components, diagrams, decisions, and dependencies while preserving context.

### Evolve

Support the evolution of specifications and their use throughout the development lifecycle.

Help identify changes, inconsistencies, and impacts while maintaining traceability between decisions, scope, and technical artifacts.

### Prepare

Help users assemble and review the artifacts needed to resolve a functional scope. Connect requirements, design decisions, UX/visual design, testing needs, and implementable deliverables to source evidence. Distinguish declared material, inferred work, shared artifacts, and unanswered questions.

Requirements, architecture, UX/visual design, and testing are complementary review lenses rather than a mandatory waterfall. A reusable artifact can serve several capabilities. A reviewed inventory can support estimation with the user's existing process; artifact counts do not establish effort, duration, or price.

## 4. Target users

SpecSpace is primarily for professionals involved in defining and evolving software solutions:

- Software and Solution Architects.
- Technical Leads and Software Engineers.
- Business Analysts and Product Owners.
- Engineering teams using Spec-Driven Development.
- Teams using AI agents during the software development lifecycle (SDLC).
- Technical leads, architects, and delivery teams preparing fixed-price software proposals.

The focus is on people who need to write specifications and understand the relationships between them.

## 5. Product principles

### 5.1 Open by design

The documents belong to the user.

Prioritize open, portable formats that work with external tools.

Markdown is the primary format for specifications.

### 5.2 Local-first

The core experience should work locally, without requiring remote services for essential operations.

External integrations should extend the product, not become unnecessary dependencies.

### 5.3 Documentation as a living system

Specifications evolve alongside software.

SpecSpace should support their understanding, maintenance, and continuous evolution.

### 5.4 Structured without rigidity

Allow users to add structure, references, and traceability without imposing proprietary formats or unnecessarily restrictive conventions.

### 5.5 Human-centered, AI-augmented

Artificial intelligence can help users understand, validate, and evolve specifications.

The user remains in control of the documents and decisions.

AI-derived scope and artifact inventories are reviewable proposals with source evidence and explicit assumptions. Unknown work remains visible. A specification that mentions a feature, test, or deployment is not proof that it has been implemented, passed, or deployed.

### 5.6 Focus over complexity

Prioritize a focused, simple, consistent experience.

SpecSpace is not intended to become a general-purpose IDE, project manager, or full ALM platform.

Consolidate the authoring workspace first. When assisted inventory is revisited, start with source documents, a selected scope, inventory entries, and open questions. Add structure when a real workflow needs it. General task administration, billing, and contract management are outside this focus.

## 6. Evolution horizons

The following horizons describe possible directions, not implementation commitments.

### Horizon 1 — Authoring Workspace

Build an excellent experience for editing and viewing technical specifications.

**Active product focus, selected by the user on 2026-10-18.** Prioritize the everyday workflow of creating, opening, writing, previewing, navigating, and safely saving specifications. Existing capabilities remain available; further semantic analysis and assisted inventory work are deferred.

Areas of interest:

- Markdown editing.
- Diagram viewing and editing.
- Reusing individual Mermaid diagrams outside the workspace: save a rendered diagram as a PNG file or copy it to the clipboard as an image, preserving the Markdown source.
- Document navigation.
- Tab management, including closing all tabs or all except the active tab, with clear save/discard/cancel handling for pending edits.
- Predictable copy and paste, with clear selection and keyboard behavior and preservation of Markdown text, line breaks, and indentation. Establish concrete source/preview expectations before selecting clipboard changes.
- Project organization.
- A fluid desktop experience.

Use this order to assess candidate increments:

1. Complete the basic authoring loop, especially creating a Markdown document within the workspace and returning to it after saving.
2. Reduce friction while editing and reviewing Markdown and Mermaid, including navigation, bulk tab closing, copy/paste, source/preview usability, and diagram export or image copying.
3. Improve continuity and confidence in longer editing sessions, based on observed problems with saving, reopening, or external changes.

These are prioritization criteria, not accepted feature contracts. Select one bounded problem at a time, define its SPEC and validation, and record acceptance before implementation. Evaluate success through real writing tasks: fewer interruptions or external-tool detours, clear save state, and preservation of source and pending work. The assisted-inventory pilot is not a gate for Horizon 1.

### Horizon 2 — Connected Specifications

Evolve from independent documents toward related specifications.

Areas of interest:

- Cross-references.
- Requirements identification.
- Dependencies between components.
- Contextual navigation.
- Visualizing relationships between artifacts.
- Change impact analysis.

Artifact identity is independent of file identity. A document can describe several artifacts, and a shared artifact can serve several scope items. Source evidence and optional prerequisites are sufficient starting relationships; a comprehensive SDLC ontology is not a prerequisite for useful inventory review.

### Horizon 3 — Intelligent Specifications

Add intelligent capabilities to help users understand and improve specifications.

Areas of interest:

- Ambiguity detection.
- Inconsistency identification.
- Completeness analysis.
- Writing and review assistance.
- Understanding architectures and requirements.
- AI-assisted impact analysis.

### Horizon 4 — Specifications to Execution

Explore connections between specifications and software planning and implementation.

Areas of interest:

- Deriving technical artifacts.
- Dependency graphs.
- Supporting human implementation estimation with reviewed scope and artifact inventories.
- Traceability between requirements, architecture, and code.
- Integration with agentic development workflows.
- Validating implementations against specifications.
- Exporting inventories and unresolved assumptions for use in existing planning and quotation processes.

These horizons are not mandatory phases and do not establish a fixed development order.

### Deferred path for assisted inventory

Preserve the following direction for future reconsideration. Proposal 002 and its pilot are deferred while Horizon 1 is the active focus; the steps below do not constitute the current work queue.

1. **Validate an assisted inventory on real documents.** Examine one functional slice across requirements, technical design/architecture, UX/visual design, and testing. Use the current assistant and ordinary Markdown to test whether the result is useful before building an analysis engine.
2. **Support the validated review workflow.** If the pilot exposes useful omissions and shared artifacts with acceptable correction effort, implement a small inventory table, source navigation, review actions, and local persistence alongside the editor.
3. **Add assistance where it saves work.** Choose an analysis execution method and explicit data boundaries based on the validated workflow. Suggestions remain reviewable and must preserve human decisions.
4. **Expand only for demonstrated needs.** Dependency views, inventory comparisons, and optional human estimation inputs can follow. Automated pricing, full project scheduling, and a generalized SDLC platform are not presumed goals.

The pilot input selected by the user is the Test folder in iCloud Drive. Proposal 002 suggests a bounded functional slice, not an immediate analysis of the entire project. If resumed, the pilot should establish value before expanding the model.

## 7. What we do not aim to build

SpecSpace does not aim to:

- Replace a software development IDE.
- Replace Git as a version control system.
- Impose a proprietary document format.
- Become a general-purpose project management tool.
- Require complex infrastructure for functionality that can work locally.
- Automate architectural decisions without human oversight.
- Estimate projects or choose commercial prices by default.
- Issue binding quotations, guarantee project profitability, or infer delivery dates from artifact counts.

## 8. How we measure success

The product's evolution should be evaluated by its ability to:

- Reduce friction when creating and maintaining specifications.
- Improve understanding of complex systems.
- Make it easier to navigate related documents.
- Reduce inconsistencies and ambiguities.
- Preserve document portability and user control.
- Make specifications more useful throughout the SDLC.
- Expose omitted design, UX, testing, implementation, and delivery artifacts.
- Identify shared artifacts without duplicating them across scope items.
- Make inventory entries traceable to sources or explicit assumptions.
- Reduce the effort to review scope and prepare inputs for human estimation, without hiding uncertainty.

Concrete metrics and acceptance criteria belong in `SPEC.md` and incremental specifications.

## 9. Vision governance

This document is the product's revisable strategic direction.

It is not a backlog or an implementation commitment.

Each incremental proposal must state whether it:

- **Aligns:** directly supports the vision.
- **Refines:** deepens or clarifies an existing aspect.
- **Changes:** proposes a change in strategic direction.

Proposed vision changes must document their rationale and consequences before this file is changed.

Decisions about current scope belong in `SPEC.md`.

Implementation decisions belong in `ARCHITECTURE.md` and the incremental plans.

### 2026-10-17 refinement

The user identified fixed-price estimation as a main use case and authorized this refinement with “adelante”. The rationale and consequences were first recorded in [proposal 002](specs/002-assisted-artifact-inventory.md). This establishes product direction and authorizes proposal drafting; the detailed increment remains subject to its own acceptance. Existing implemented behavior is retained in SPEC, including the document-reference graph from increment 001.

### 2026-10-18 revision

The user clarified that the product should first assist in understanding the necessary artifact inventory across requirements, technical/software architecture, UX/visual design, and testing. The earlier estimation proposal was too broad. [Proposal 002](specs/002-assisted-artifact-inventory.md) records the rationale for removing default effort/cost/pricing calculations and quotation baselines from the near-term scope. A document-based pilot and explicit decision gates now precede further application increments. No new product implementation is accepted by this revision.

### 2026-10-18 priority decision

The user subsequently instructed: preserve this direction in VISION and focus work on Horizon 1. The rationale and consequences were recorded in proposal 002 before this update. Assisted inventory remains a future direction supporting human fixed-price preparation; its proposal and pilot are deferred. The active path is improving authoring, with one bounded, accepted increment at a time. This decision supersedes the earlier near-term inventory pilot priority and does not accept any specific new application behavior.
