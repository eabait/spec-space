# Plan 001 — Connected Specifications

Status: Complete. Date: 2026-10-17.

Contract: [SPEC 001](../specs/001-connected-specifications.md), accepted by the user's “aprobado” on 2026-10-17 in this chat. The prior scoped recommendation is recorded in its acceptance section.

## Initial state

Clean `main` at task start. Existing Rust file authorization and atomic saving, React tabs and Markdown preview, and 5 TypeScript / 3 Rust baseline tests. The temporary Rust toolchain is available. No active increment preceded this one.

## Steps

1. Record accepted contract and this plan before implementation.
2. Extract shared directory enumeration and add a bounded read-only Rust workspace snapshot command, with errors and access-boundary tests.
3. Build a pure Markdown reference index using the existing remark ecosystem, declared as direct dependencies. Test actual Markdown semantics, path resolution, unavailable targets, and graph relationships.
4. Add a connections view with directed graph, document navigation, references, backlinks, broken-reference reporting, and accessible empty/error/loading states. Preserve mounted editors when switching views.
5. Integrate rebuilding on workspace open, successful save/reload, and refresh. Keep indexing errors separate from saving; label pending edits and stale results.
6. Run TypeScript tests/build/formatting, Rust tests/formatting, and diff checks. Inspect UI at normal/minimum sizes; build and validate the updated macOS executable without closing user sessions.
7. Record evidence, update current SPEC/ARCHITECTURE/README/PROJECT_STATUS, and close only after acceptance criteria are met.

## Files and boundaries

Rust snapshot module and `src-tauri/src/lib.rs`; new reference/index and connections UI modules; `src/App.tsx`, styles, focused tests, dependency manifests, and SDD documentation. Rust owns disk access. React owns parsing, derived relationships, navigation, and presentation.

## Risks and preservation

Index only saved source, never preview output. Bound traversal and content volume; distinguish missing files from incomplete/unreadable results. Keep prior snapshots visibly stale after refresh failure. Use the existing serialized app actions to prevent overlapping workspace changes and refreshes. Do not persist the derived index. No existing documents are modified by indexing; rollback is removal of this additive feature and command, with user Markdown untouched.

## Validation and evidence

Completed on 2026-10-17:

- `npm test`: 13 tests passed (5 source-preservation/link tests, 5 reference-index tests, 3 interaction tests). Interaction tests cover dirty-buffer identity, graph keyboard navigation, backlinks, external refresh, save failures, index failures after successful saves, retry, and workspace switching.
- `npm run build` and `npm run tauri build`: passed. Final bundle at `src-tauri/target/release/bundle/macos/SpecSpace.app`; build log retained temporarily at `/private/tmp/specspace-connections-build.log`.
- `cargo test --manifest-path src-tauri/Cargo.toml`: 6 tests passed, including bounded traversal, invalid/binary content, excluded files, nested Markdown, symlinks, target checks, rebuilding, text preservation, and save conflict rejection. Used the temporary toolchain documented in README.
- Formatting and `git diff --check`: passed. Documentation references and the AGENTS line limit were checked.
- Native executable identity: the running process was `/Users/estebanabait/Documents/Projects/spec-space/src-tauri/target/release/bundle/macos/SpecSpace.app/Contents/MacOS/spec-space`. No previous SpecSpace process was running at the start. Only the task's own saved test session was restarted to load the final visual adjustment.
- Criteria 1/6: opening the real repository yielded 13 Markdown documents and 32 directed references before documentation closure. Nested documents were indexed while their explorer folders remained collapsed. SPEC.md showed 1 outgoing reference and 4 backlinks. A graph node opened ARCHITECTURE.md in a second tab; zoom and list controls were usable.
- Criteria 3/4: a temporary workspace at `/private/tmp/specspace-connections-check` contained SPEC.md, docs/Architecture.md, reciprocal links, and a missing.md target. The native graph reported 2 documents / 2 references / 1 broken. Removing the missing link in the editor left the graph unchanged and displayed the pending-edit notice. An external edit added a self-reference; Refresh connections reported 3 references while preserving the pending edit. ⌘S then removed the broken reference and displayed Saved SPEC.md.
- Criteria 6/7: the rebuilt release reopened that workspace with 2 documents / 3 references / 0 broken, reconstructed from disk. Visual checks at normal size (1440 logical pixels wide) and approximately 850 × 580 confirmed usable controls, scrollable details, and automatic graph fit. The first minimum-window check revealed offscreen nodes; ResizeObserver-based automatic fitting fixed this before closure.

## Implementation decisions and limits

- Rust returns saved documents and scan issues; the frontend uses a real Markdown AST. Additional target checks avoid confusing incomplete scans or symlinks with missing files and resolve filesystem case aliases.
- Traversal bounds: 500 document/issue entries, 32 MiB content, 10,000 raw directory entries, 64 nested levels; 8 MiB per file remains unchanged. No benchmark claim is made for maximum-size workspaces. A directory or file can change during a scan; refresh rebuilds the best-effort snapshot.
- SVG nodes use a stable layout, selectable references, keyboard activation, automatic fit, and zoom. The full-path document list remains available for dense graphs and truncated labels.
- Editor instances stay mounted while the connections view is visible. Refreshes run through existing serialized actions. Index failures do not turn successful saves into failures.
- Vite still reports chunks above 500 kB, including the existing editor/Mermaid bundle. No bundle-size optimization was included.
- An online npm audit reported five advisories in the existing Vitest/mocker/tinypool and Mermaid/KaTeX dependency chains. Their versions match the original lockfile (Vitest/mocker 3.2.7, tinypool 1.1.1, Mermaid 11.17.2, KaTeX 0.16.47). The added test/parser dependencies were not listed. Major-version remediation is a separate dependency-maintenance task; no forced upgrade was applied.

## Closure

Final native check after documentation updates: the repository showed 13 documents, 37 references, and 0 broken targets. The release app was left open on SPEC.md in Connections, showing 2 outgoing references and 4 backlinks.

All planned steps completed. SPEC 001 is Implemented; SPEC, ARCHITECTURE, README, PROJECT_STATUS, and both indexes are current. No publication, deployment, commit, or semantic-traceability expansion was performed.
