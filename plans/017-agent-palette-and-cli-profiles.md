# Plan 017 — Agent palette and configurable CLI profiles

Status: Pending. Prepared: 2026-10-21.
Contract: [SPEC 017](../specs/017-agent-palette-and-cli-profiles.md).

## Acceptance and initial state

The user explicitly accepted the written SPEC with “si acepto” on 2026-10-21, in response to the request to accept SPEC 017 and prepare its plan. This includes Codex as the first adapter, the proposed execution limits, session-only results, and no workspace writes or apply step. The feasibility checkpoint remains mandatory; it is not a new request to approve the already accepted scope.

The application has no integrated agent runtime. React owns document interaction; Rust owns filesystem boundaries, session metadata, native menus, and guarded saving. Long-running agent work must not hold the existing UI-wide action lock. The saved Connections index is not an index of unsaved buffers. Existing preview security and editor state must remain intact.

Local preparation found Codex CLI 0.163.0 at `/usr/local/bin/codex`. Version/help inspection succeeded with a PATH-alias permission warning; no authentication, skill invocation, or isolation claim has been validated. Recheck the installed version before implementation. Preserve all pre-existing local documentation and the rejected SPEC 016.

## Sequence and deliverables

### 1. Prove the execution contract before production UI

- Inspect the installed CLI's version/help and matching configuration behaviour. Resolve native profile precedence, model override, events/final-response transport, and noninteractive error handling.
- Establish an effective configuration policy covering inherited settings, rules, hooks, tools, skills, and permissions. Enumerate supported advanced settings and reserved semantics; do not rely on a blacklist of obvious bypass flags.
- Use a disposable workspace and fixture skills to verify skill discovery, explicit invocation, unavailable/duplicate identities, and inherited implicit discovery. Do not modify the user's installed skills or CLI settings.
- Prove workspace write protection under the actual execution policy, including attempts made through tools/skills. Verify process-tree cancellation, time/output limits, and errors. Confirm what additional read/network access remains and how it will be shown.
- Verify explicit executable resolution in a minimal GUI-like environment, then repeat in the packaged app during native validation.

**Deliverable:** a capability/evidence matrix with exact CLI version, supported configuration, observed access boundary, fixture outcomes, and limitations. Gate all production execution on that result. If the accepted contract cannot be enforced, record the concrete blocker and propose only the necessary contract adjustment; do not silently reduce safeguards or remove accepted features.

### 2. Implement Rust-owned profiles and the adapter

- Extract agent responsibilities into focused modules under `src-tauri/src/agents/`: configuration/profile persistence, adapter argument construction, skill inventory, and process lifecycle. Keep `lib.rs` as command/menu integration rather than accumulating the whole runtime there.
- Define versioned typed profile, capability, invocation-preview, execution-request, event, and final-result records. A run resolves a stored profile and freezes its validated effective configuration; the frontend cannot submit an arbitrary command line.
- Implement atomic profile storage separate from session metadata, profile/default management, malformed-version recovery, and read-only executable/skill inspection. Never overwrite an unreadable configuration with defaults.
- Construct argument vectors directly, send prompt/context as data over standard input, bound stdout/stderr, and parse supported events. Reject conflicting or reserved options with field-specific errors. Do not persist prompt text or raw argument values in diagnostics.
- Use a run ID, workspace identity, and an owned process group/tree. Ensure cancellation, timeout, output overflow, normal quit, and launch failures all release resources exactly once. A late final response cannot reverse cancellation.

**Deliverable:** IPC operations restricted to the accepted agent/profile capabilities, plus deterministic fixture tests. No general shell permission in the webview.

### 3. Implement settings and the centered prompt palette

- Add focused frontend modules/components for agent settings, the palette/composer, context capture, and a task controller. Reuse shared UI tokens and accessible dialog patterns.
- Settings support profile creation/editing/duplication/deletion/default choice, explicit executable selection, model or CLI default, native profile, skill selection/refresh, typed options, and ordered advanced argument tokens.
- Capture text selection before opening the palette; support Source and Preview only where selection capture is demonstrably reliable. Otherwise explicitly offer Active document or No document. A diagram node is not silently converted into selected source text.
- Capture the active buffer and provenance without saving it. Preserve the draft during settings navigation; changing tabs cannot silently replace context. Provide refresh/remove actions and the effective invocation/context preview.
- Wire a labelled workspace entry and the native Agent actions menu, without registering a keyboard shortcut. Make the entire workflow usable through visible controls. Exactly one built-in action appears: Ask agent…. No action editor or extra built-in tasks.

**Deliverable:** keyboard-operable settings and composer with stable focus, no prompt execution during configuration validation, and profile persistence across normal relaunch.

### 4. Integrate results and application lifecycle

- Present bounded status and the final generated response alongside the reading view, with safe Markdown rendering and explicit Cancel. Distinguish received output from a valid completed result.
- Keep reading, tab navigation, and editing responsive. Preserve editor identity, undo history, dirty flags, and reading position when opening/closing agent surfaces.
- Resolve active work before workspace switching/normal quit through Cancel task and continue or Stay, composing with the existing unsaved-document guards. Dismissing the panel or palette does not cancel execution.
- Provide a compact result view at 850 × 580 with clear return navigation. Results and drafts remain session-only as specified; disclose provider-owned persistence separately.

**Deliverable:** an end-to-end free-prompt workflow with meaningful failure states and no document writes or changes to Connections.

### 5. Validate and close

- Run focused tests during implementation, then `npm test`, `npm run build`, `npm run format:check`, Rust tests, `cargo fmt --check`, and `git diff --check`.
- Build with the normal documented Tauri release command. Verify the exact executable used for QA; use an isolated application identity and disposable workspace. Do not close or replace the user's working session to validate this increment.
- Exercise the full keyboard/pointer flow, settings relaunch, selection/context handling, cancellation, errors, dirty-editor preservation, normal quit/workspace switching, and normal/minimum window layouts.
- Repeat relevant real CLI checks in the packaged environment. Record actual output/behaviour separately from fixture-test evidence and list anything unverified.
- Update SPEC.md and ARCHITECTURE.md only for delivered behaviour; update status and indices with accurate implementation/validation state. No implicit commit, publication, or deployment.

## Expected affected areas

| Area                                               | Intended responsibility                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src-tauri/src/agents/` (new)                      | Profiles, capabilities, skill inventory, adapter, execution lifecycle           |
| `src-tauri/src/lib.rs`                             | Validated IPC registration, menu action, quit/workspace coordination            |
| `src-tauri/Cargo.toml` / lockfile if needed        | Only dependencies justified by process and storage implementation               |
| `src/agents/` (new)                                | Typed client contracts, profile UI, palette, context capture, result/task state |
| `src/App.tsx`, `src/Editor.tsx`, `src/Preview.tsx` | Minimal integration and reliable selection/context handoff                      |
| `src/styles.css`                                   | Centered palette, settings, result panel, compact layout                        |
| `tests/` and Rust agent-module tests               | Behavioural, state, process, configuration, and preservation coverage           |
| Product/status documentation                       | Delivered behaviour and evidence at closure                                     |

Names may change as responsibilities become concrete; that is an implementation decision, not a scope change. Prefer reusing safe rendering components to copying sanitization policy. Do not add broad Tauri shell capabilities or remote webview resources.

## Validation mapping

| SPEC criteria                 | Required evidence                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1–2: palette and reading flow | Interaction tests and native keyboard/pointer checks at normal and 850 × 580 sizes                             |
| 3: profiles                   | Persistence/default/duplicate/delete tests, malformed/version errors, native relaunch                          |
| 4: exact invocation           | Fake CLI captures literal arguments/stdin; conflicts and shell-looking text tested; real version compatibility |
| 5: context and preservation   | Dirty buffer/selection provenance, tab-switch capture, no document writes, unchanged undo and Connections      |
| 6: skills                     | Controlled inventory fixtures plus actual supported-CLI discovery/invocation evidence                          |
| 7–8: failures and lifecycle   | Fake CLI failure matrix, descendants and late events; real cancellation and native quit/switch checks          |
| 9: rendering and data         | Unsafe Markdown tests, bounded output, profile/log inspection without leaking user secrets                     |
| 10: delivery                  | Frontend/Rust checks, normal release build, isolated packaged QA and explicit outstanding limits               |

Model responses are nondeterministic. Validate transport, boundaries, and usable output rather than exact wording. Do not treat a model's claim that it respected permissions as proof of isolation; verify filesystem/process evidence.

## Risks and rollback

CLI configuration inheritance and skills can expand effective behaviour; the first checkpoint must establish enforceable restrictions. A minimal working directory alone is insufficient. Advanced parameters require semantic validation and a truthful supported-options boundary.

Process descendants, app shutdown, late events, and output buffering can leak resources or block the UI. Keep execution state independent of serialized document actions and validate termination explicitly.

Profile files are new, versioned, and outside user Markdown. On failure, retain existing settings and source content. Rollback removes only new agent integration and its registrations after terminating owned tasks; do not reset pre-existing files, erase user configuration, or modify the user's CLI installation/settings.

## Actual evidence and progress

- 2026-10-21: Written SPEC accepted with “si acepto”; this plan recorded. No application code changed and no execution checkpoint run during plan preparation.
- 2026-10-22: The user explicitly requested no shortcuts. Removed shortcut registration from the plan; validate the complete pointer-driven flow. Standard focus and text-entry accessibility remain supported.
- Steps 1–5: pending. Historical version/help inspection is recorded in SPEC 017; it is not evidence of working skills, authentication, isolation, or end-to-end execution.

No step is complete until its observed evidence is recorded here. Implementation outcome and closure remain pending.
