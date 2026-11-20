# 021 — Native Structurizr architecture explorer

Date: 2026-11-16<br>
Status: In progress; code delivered and automated checks passed, native acceptance pending<br>
Target: `specs/021-c4hero-integration.md`<br>
Plan: `plans/021-c4hero-integration.md`

## Objective

Explore Structurizr DSL architecture models inside SpecSpace through a native interface integrated with its documents, tabs, and visual language.

Reuse selected C4 Hero parsing and semantic logic behind an adapter. SpecSpace owns rendering, navigation, document state, and persistence.

This aligns with VISION’s emphasis on agent-authored artifacts, human understanding and review, portable formats, and local operation.

## Acceptance and supersession

The user accepted this approach on 2026-11-16: “lets use this approach, update the spec and plan”.

This replaces the earlier embedded-editor proposal. No application iframe, C4 Hero application shell, or visual model mutation is included.

The original request to implement using Sol remains applicable. The accepted attachment used increment 019. This checkout already assigns 019 to resizing the main panels and 020 to Markdown table copying and outline indentation. The Structurizr increment uses the next available ID, 021.

## Scope

### Architecture exploration

- Discover existing `.dsl` files in the authorized workspace and open them in dedicated tabs.
- Render supported System Landscape, System Context, Container, and Component views.
- Select views and navigate to available child views.
- Provide zoom, pan, fit, and navigation back to the previously visited view.
- Search elements by name, distinguishing duplicate labels.
- Inspect element descriptions, technologies, tags, and direct relationships.
- Follow a relationship to its other endpoint when that element is visible. Clearly identify endpoints outside the active view.
- Keep selection, viewport, and navigation state separate for each open document.

### Source editing

- Provide Source, Architecture, and Split modes.
- Render from the current source buffer, including unsaved edits.
- Preserve invalid source and show actionable parsing diagnostics.
- Reuse explicit Save, Reload, revision conflict detection, and existing pending-change guards.
- Keep the raw source buffer authoritative. Rendering never serializes a model back into DSL.

### Existing functionality

Markdown, Pele rendering, outline, Connections, and existing document workflows continue to work. DSL documents are not indexed as Markdown.

## Ownership and integration

| Concern                                    | Owner                                                                |
| ------------------------------------------ | -------------------------------------------------------------------- |
| Workspace access and saving                | SpecSpace’s Rust filesystem boundary                                 |
| DSL parsing and reusable semantics         | Pinned C4 Hero code behind a local adapter                           |
| View preparation                           | SpecSpace adapter, reusing tested upstream semantics where practical |
| Layout                                     | Established layout library                                           |
| Rendering and interaction                  | SpecSpace React components                                           |
| Tabs, dirty state, navigation, diagnostics | SpecSpace                                                            |
| Source text                                | Original document buffer                                             |

The parser is an upstream-derived dependency, not an assumed stable SDK. Preserve its license, provenance, relevant tests, and update instructions.

## Behavior and data contract

1. **Source preservation.** Opening, viewing, selecting, navigating, and arranging the viewport never change the source. An unchanged save preserves its bytes. Source edits retain existing text-preservation guarantees.

2. **Derived diagrams.** The architecture model and rendered views are derived state. Generated default views, when provided by the parser, are identified as inferred and never written into the source.

3. **Semantic fidelity.** Render the active view’s elements, relationships, containment boundaries, and supported styles. Do not substitute the entire workspace graph for a declared view.

4. **Explicit compatibility.** Document the supported syntax and view coverage. Unsupported views and unresolved directives produce visible diagnostics. Parsing a partial model must not imply complete architectural coverage.

5. **Error recovery.** Invalid source remains editable. If the last valid diagram stays visible, label it stale. Outdated parse or layout results must not replace a newer buffer’s results.

6. **File protection.** Rust retains path containment, symlink rejection, UTF-8 validation, file-size limits, revision checks, and atomic individual-file saving. Save conflicts leave pending edits available.

7. **Local operation.** Bundle all runtime dependencies locally. Do not execute DSL scripts or plugins, resolve remote includes, load remote themes/images, or enable telemetry or provider calls.

8. **Initial include policy.** Multi-file include resolution is deferred. Unresolved includes are reported, and the resulting view is clearly identified as incomplete.

9. **Presentation state.** Selection, viewport, and navigation history are transient per-document state. Persistent manual layout and C4 Hero sidecar import are deferred and disclosed.

10. **Consistent interaction.** Use SpecSpace’s visual conventions and visible controls. Introduce no additional shortcuts.

## Acceptance criteria

| ID   | Criterion                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| AC1  | Open supported `.dsl` fixtures and explore all four supported view types offline.                            |
| AC2  | Preserve source bytes during viewing and unchanged saves.                                                    |
| AC3  | Render declared view membership, relationships, and boundaries correctly against the compatibility fixtures. |
| AC4  | Search, inspect, follow visible relationships, and navigate child/back views without changing source.        |
| AC5  | Keep document buffers, selection, and navigation independent across tabs.                                    |
| AC6  | Update previews from source edits and handle invalid, incomplete, and stale results visibly.                 |
| AC7  | Protect pending work during save conflicts, reload, closing, workspace changes, and quit.                    |
| AC8  | Reject unauthorized filesystem operations and make no runtime network requests.                              |
| AC9  | Preserve existing Markdown/Pele/Connections behavior.                                                        |
| AC10 | Remain usable at normal size and 850 × 580; record actual automated and native validation.                   |

## Deferred capabilities

Visual creation or mutation of elements and relationships; DSL serialization; persistent manual layout; sidecar compatibility; Dynamic and Deployment views; local include resolution; document-to-element linking; new export formats; AI features; collaboration.

These may become separate increments after the exploration workflow is validated.

## Completion

Mark Implemented only after the acceptance checks pass. Record code delivery, test results, and outstanding native validation separately.

## Delivery evidence

The native explorer code and compatibility documentation are delivered locally. On 2026-11-20, 151 frontend tests, the production frontend build, and 10 Rust tests passed. The isolated macOS bundle compiled during implementation. Native interaction checks at normal size and 850 × 580, observed offline packaged behavior and runtime network activity, and larger-model timing evidence remain pending. The implementation plan records the validation boundaries and the user's explicit merge/push authorization.
