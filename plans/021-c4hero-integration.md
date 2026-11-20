# 021 — Native Structurizr architecture explorer implementation plan

Date: 2026-11-16<br>
Status: In progress<br>
Target: `plans/021-c4hero-integration.md`<br>
Specification: `specs/021-c4hero-integration.md`<br>
Implementation model: GPT‑6.1 Sol

## Accepted direction

Replace the embedded-editor design with native rendering and exploration inside SpecSpace.

Reuse C4 Hero’s parser and selected semantic helpers. Do not import its complete Canvas, application store, routing, browser persistence, or application bootstrap.

Source editing saves the original text buffer through SpecSpace. No model serializer or layout sidecar writer is required.

## Inspected baseline

SpecSpace uses Tauri 2, React 19, TypeScript, and Vite. React coordinates document sessions; Rust controls workspace access and revision-checked saving.

C4 Hero source previously inspected at:

`207b357d5ebdb9cd8523053ad4fb7d67154822e4`

Recheck the repository state and applicable instructions before editing. Preserve unrelated work. Both increment directories were checked in the implementation checkout. The attachment’s original ID 019 is already assigned to panel resizing, so this plan and its specification use 021.

## Implementation sequence

### 1. Isolate and validate the parser

- Extract the minimum dependency closure needed for parsing, model types, default views, and supported semantic helpers.
- Record the immutable upstream revision, license notices, and local modifications.
- Expose a narrow adapter returning model data and normalized diagnostics.
- Avoid importing the upstream application store or serializer through broad entry points.
- Carry over relevant upstream tests and add compatibility fixtures for the supported contract.

Expected result: parsing works independently of the C4 Hero application.

### 2. Establish the native rendering path

- Use React Flow as the initial canvas choice.
- Evaluate Dagre for layout against nested boundaries, long labels, and representative relationship patterns before finalizing the layout adapter.
- Implement SpecSpace node, relationship, and boundary presentation.
- Reuse upstream semantic helpers where their dependencies can be isolated.
- Keep view membership and architecture identity independent of layout coordinates.
- Treat any generated default views as transient derived views.

Expected result: representative models render correctly in SpecSpace’s React interface.

### 3. Extend document support

- Add `.dsl` discovery, opening, and saving through the Rust boundary.
- Reuse existing path, UTF-8, size, revision, and atomic-save protections.
- Retain explicit Markdown filtering for Connections and Markdown creation.
- Extend clean-tab session restoration to recognize DSL paths.
- Introduce document-kind routing without duplicating pending-change logic.

Expected result: mixed Markdown and DSL tabs behave consistently.

### 4. Build the exploration experience

- Add a view selector and zoom/pan/fit controls.
- Add element search with unambiguous identities.
- Add an inspector for descriptions, technologies, tags, and direct relationships.
- Support child-view navigation and back navigation.
- Preserve transient view state independently for each open document.
- Distinguish off-view relationship endpoints and unavailable child views.

Expected result: users can understand a model without modifying it.

### 5. Connect source editing and diagnostics

- Add Source, Architecture, and Split modes.
- Parse the current buffer without replacing or normalizing its text.
- Load parsing/rendering dependencies lazily.
- Invalidate outdated parse and layout results using document identity and revision.
- Show errors, unresolved includes, unsupported coverage, and stale previews distinctly.
- Keep saves independent of diagram serialization.
- Verify that close/reload guards protect unsaved source even when parsing fails.

Expected result: agent-authored or manually corrected DSL remains the authoritative document.

### 6. Validate the contract

| Area                  | Required evidence                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Parsing and semantics | Fixtures for each supported view, boundaries, view membership, relationships, diagnostics, and generated views |
| Preservation          | BOM, CRLF, comments, final newline, unchanged saves, and edited-source tests                                   |
| Interaction           | Search, duplicate labels, inspector, relationship navigation, child/back navigation, mixed tabs                |
| Concurrency           | Stale parse/layout results, tab switching, external edits, save conflicts                                      |
| Filesystem            | Traversal, symlinks, invalid UTF-8, oversized files, unauthorized paths                                        |
| Regression            | Existing relevant Markdown, Pele, Connections, session, and close-guard tests                                  |
| Runtime               | Offline packaged operation and absence of remote-resource requests                                             |
| Native UI             | Isolated Tauri checks at normal size and 850 × 580                                                             |

Run frontend tests, production build, formatting checks, Rust tests, and Rust formatting checks. Record exact results and any unperformed checks.

### 7. Update documentation and deliver

- Add representative `.dsl` examples.
- Document supported syntax, view coverage, include limitations, and transient layout behavior.
- Update increment indexes and PROJECT_STATUS.
- Update current SPEC and ARCHITECTURE only to reflect delivered behavior, with validation limits stated.
- Deliver through an isolated review branch; no release publication or deployment.

## Expected code boundaries

- `src/c4/`: parser adapter, view preparation, layout adapter, canvas, inspector, and diagnostics.
- Existing document/editor coordination: DSL routing, source buffers, and lifecycle integration.
- Rust document services: bounded DSL access and session restoration.
- Isolated upstream-derived parser code and notices.
- Behavioral tests and compatibility fixtures.

Exact filenames should follow the inspected repository’s conventions.

## Risks and mitigations

- **Upstream coupling:** isolate imports and preserve an explicit update process.
- **Semantic mismatch:** test view projections against known expected models; avoid claiming complete DSL support.
- **Layout quality:** validate nested boundaries and realistic labels before choosing the final engine.
- **Large models:** measure parsing/layout responsiveness and isolate expensive work as necessary.
- **Misleading partial diagrams:** surface unsupported syntax and unresolved includes prominently.
- **State leakage:** key asynchronous work and transient navigation by document session.

## Rollback

Revert integration code without migrating user documents. Markdown and DSL remain ordinary portable files. Derived model and presentation state require no data migration.

## Current evidence

The user accepted the revised direction on 2026-11-16. Source inspection established a candidate parser boundary and identified coupling in the upstream Canvas.

The accepted attachments were recorded in the local checkout on 2026-11-16. Code delivery and automated validation are recorded below. Native acceptance remains pending.

## Local implementation record

Implementation resumed on 2026-11-19 in an executable local checkout. The isolated review branch is `codex/structurizr-explorer`. Existing uncommitted work for increments 019 and 020 is preserved.

- The upstream parser is pinned to `207b357d5ebdb9cd8523053ad4fb7d67154822e4`. Its minimal local dependency closure, Apache license, NOTICE, pure status helper extraction, and update instructions live in `src/c4/upstream`. Parser/lexer tests use a test-only parse/default-view shim. The shipped frontend also contains the upstream license and NOTICE in `public/third-party/c4hero`.
- React Flow 12.12.1 renders derived read-only diagrams. Dagre 3.1.3 lays out each sibling level independently and expands nested boundary boxes outward. This avoids compound-graph edge-routing assumptions while preserving containment. Compatibility fixtures exercise nested groups, long names, and cross-boundary relationships.
- The local worker parses the current buffer and prepares layouts. Per-document source versions and requested view keys exclude outdated results. Inferred views, unresolved resources, unsupported syntax, invalid source, and stale diagrams have visible diagnostics.
- Rust extends the existing document boundary and session record validation to DSL. Connections enumeration and target checks stay explicitly Markdown-only, and document creation stays Markdown-only. Invalid architecture syntax does not affect text saving or the shared pending-edit guards.
- Source editing reuses the existing CodeMirror text-preservation path without Markdown syntax extensions for DSL. Each open DSL explorer remains mounted while other documents or modes are displayed.
- `examples/architecture.dsl` and README document syntax, supported views/styles, incomplete coverage, and transient layout behavior.

## Validation and delivery evidence

On 2026-11-20, `npm test` passed all 151 tests across 15 files, including the retained upstream parser/lexer suite, adapter membership and containment fixtures, worker-result ordering and stale-preview tests, search/navigation/viewport interactions, and mixed Markdown/DSL lifecycle checks. `npm run build` passed. The build reports a JavaScript chunk over 500 kB, with the existing main index chunk approximately 1.107 MB minified and 366.85 kB gzip; the lazy ArchitectureExplorer chunk is approximately 194 kB minified and 63.82 kB gzip.

`cargo test --manifest-path src-tauri/Cargo.toml` passed all 10 Rust tests. Coverage includes DSL byte preservation on unchanged saves, revision conflicts, session paths, Markdown-only Connections and creation, and rejection of traversal, symlinks, invalid UTF-8, and oversized files. Rust formatting and `git diff --check` passed. Frontend formatting, diff checks, and emitted license/NOTICE comparisons passed before the authorized merge.

An isolated macOS QA bundle was built during implementation under `/private/tmp/specspace-021-qa-target`, using the distinct application identifier `com.specspace.desktop.qa021`. Native interaction checks at normal size and 850 × 580 have not been completed. Actual offline packaged operation, runtime network-request observation, and large-model parsing/layout timings remain unverified. Static runtime ownership and CSP inspection support the local-resource design, and do not replace those observations.

The user explicitly authorized merging and pushing `main` on 2026-11-20. This delivery authorization permits committing the recorded implementation while the native validation above remains pending. SPEC 021 and this plan remain In progress until the remaining acceptance evidence is recorded.
