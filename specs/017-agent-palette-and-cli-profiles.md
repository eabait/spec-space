# 017 — Agent palette and configurable CLI profiles

Status: Accepted on 2026-10-21. Implementation pending.

## Problem and intended outcome

People need a direct way to ask an agent about the specifications they are reading, using their own installed agent configuration. They should not need to leave the reading context, assemble a terminal command, or adopt a predefined catalogue of assistant tasks.

Provide a centered floating palette with exactly one built-in action, **Ask agent…**, opening a free-form prompt. A dedicated agent configuration section manages reusable execution profiles, including model, installed skills, and supported advanced CLI arguments. Results remain beside the specification.

## Relationship to VISION and user direction

**Aligns** with [Understanding and Review Workspace](../VISION.md): humans direct and understand; agents perform the intended authoring work. This increment establishes the execution entry point. Applying agent-authored changes remains a subsequent reviewed increment, not an implicit capability of free-form prompting.

The user requested a configurable centered floating action bar, then narrowed its built-in behaviour to one free-prompt action with other actions configurable. The user requested configuration for agent, model, installed skills, and CLI parameters, and replied “dale” to proceeding with one CLI, configurable profiles, and the prompt palette. This authorizes preparing this concrete proposal; it is not evidence of acceptance of newly specified limits or the recommended provider below.

## Scope

- One supported CLI adapter; recommend **Codex CLI**, installed locally at `/usr/local/bin/codex` and reporting `0.163.0` during preparation. This is a recommended provider selection, not an inferred user selection.
- Multiple named execution profiles for that adapter; one default profile.
- One built-in action: Ask agent… with a multiline free prompt.
- Explicit context selection, execution preview, progress, cancellation, and a session result panel.
- Agent configuration through a form with advanced options, backed by a versioned local configuration record.

Exclude custom action creation in this increment; it follows using these same profiles and execution lifecycle. Do not ship additional built-in review/explain/generate actions. Also exclude a second adapter, skill installation, model installation, authentication management, persistent chat sessions, task history, automatic retries, MCP servers, direct workspace modification, and applying proposed changes.

## Palette and reading experience

1. Open **Agent actions…** through a clearly labelled workspace control or the native menu. Do not add a keyboard shortcut; all workflow actions must be available through visible controls. The palette floats centered in the application window, not the desktop.
2. Show Ask agent… as the only initial action. Opening it presents the prompt, current profile, context summary, and Run. Empty prompts cannot run. Missing configuration leads to Agent settings without losing the draft.
3. Context choices are No document, Active document, or Selected text. Default to a captured nonempty text selection when supported, otherwise the active document; show the choice before execution. Selected text is literal visible/editor text, not a claim of an exact semantic source range. Diagram-node selection alone does not provide a text selection.
4. Capture context when opening the composer; retain document identity and whether it contains unsaved edits. The user can remove or refresh it. Changing the active tab does not silently replace captured context.
5. Show a collapsible invocation/context preview: executable, argument boundaries, effective model/profile/skills, included text, and access policy. Keep routine interaction simple. Never present the preview as a command users must understand to proceed.
6. Run freezes the submitted prompt, context, and profile for that execution. Close the composer and show progress/result alongside the reading view. Opening or closing this panel preserves document/tab identity, scroll position, dirty state, and undo history.
7. Escape closes the palette and returns focus to its origin; it does not cancel a running task. Provide an explicit Cancel control. Keep the unsent draft for the current workspace/session; a new workspace clears it after any active execution is resolved.
8. At 850 × 580, use a compact result view with a clear return to the document. Never make reading or results unreachable through a clipped dialog.

## Agent settings and execution profiles

Profiles are separate from actions. Each has a stable ID, display name, adapter ID, executable location, optional provider-native profile, model override or CLI default, selected skills, supported typed settings, and an ordered list of additional argument tokens. Users can create, edit, duplicate, delete, and choose a default. Profile changes affect subsequent runs only.

- Validate the executable and record the observed version without starting a model request. Do not assume a GUI app inherits the terminal PATH. Allow explicit executable selection; display missing/incompatible status.
- The model field accepts an identifier or CLI default. Do not invent an available-model list or guarantee account access. Expose additional controls such as reasoning settings only when verified for the supported version.
- Installed skills appear with name, description, source, and availability. Distinguish discovered, explicitly requested, disabled, and unavailable skills. Refresh is read-only. Do not scan arbitrary home directories or install/modify skills.
- Skill selection means request those skills using the adapter's supported mechanism; it is not an exclusive tool allowlist. Show whether provider discovery can make additional skills available implicitly. Ambiguous names need a verified identity; unavailable selected skills block launch rather than silently disappearing.
- Advanced arguments are ordered tokens, not a shell command string. Preserve whitespace within each token. Show version-specific unsupported/conflicting options before launch where detectable; CLI rejection must remain an actionable error, not silent fallback.
- Typed settings and advanced arguments cannot ambiguously define the same option. The effective configuration preview must match what is executed. Arguments controlling SpecSpace-owned input/output transport, process lifecycle, working directory, and required execution restrictions are reserved; report conflicts instead of silently overriding them.
- Configurability includes all parameters compatible with this supported execution contract, not a promise to expose every command, subcommand, or unsafe bypass. A new capability can extend that contract in a later increment.
- Reuse the CLI's existing authentication. No credential fields, credential copying, arbitrary environment editor, or secrets stored in profiles. Reject known credential argument forms; the advanced editor states that credential configuration belongs in the CLI. Do not log raw prompts or argument values by default.
- Persist profiles atomically in application-local storage, separate from workspace Markdown and the existing session metadata. Malformed configuration shows an error without overwriting it; an unsupported version is not silently migrated. No automatic import of workspace-provided executable settings.

## Execution and data boundaries

Rust resolves a saved profile, validates input, constructs an argument vector, and launches the registered executable directly. React receives bounded status/result events; it has no generic shell or filesystem access. Shell expansion, command substitution, and concatenated command strings are not used.

The first adapter operates without write access to the user's workspace. It may return explanations or proposed text, but cannot apply them. The exact enforcement mechanism must pass the checkpoint below; a prompt saying “do not edit” or a temporary working directory is not sufficient. Do not silently switch to a less restricted mode on failure.

Explicit context contains the current captured buffer/selection, not an automatic disk reread or save. Include provenance (workspace identity, relative document path where applicable, content hash, and saved/unsaved label). Do not supply unrelated documents or the entire graph automatically. Context sent by SpecSpace must be distinguished from any additional filesystem access, user instructions, skills, tools, or remote services available to the CLI.

Local execution does not imply local inference. Show the provider boundary and additional effective access honestly before Run; do not claim the selected snippet is the agent's exclusive access unless that is enforced. Webview resource permissions remain unchanged; external processing happens through the explicit CLI invocation.

Proposed bounds: one active run; 64 KiB prompt; 1 MiB explicit context; 4 MiB combined captured process output; ten-minute timeout. Oversized input is rejected with an explanation; reaching the output/time limit ends the run with a clear limit status. No silent truncation followed by a success claim.

States: starting, running, completed, failed, cancelled, timed out, and output limit reached. Distinguish process output from a final response; a successful process exit without a valid final response is an error. Render results with the existing safe Markdown rules and label agent output as generated content, not verified fact.

Cancellation terminates the process tree, drains/closes resources, and ignores late success events. An execution ID and workspace identity gate all events. Normal quit or workspace switching offers Cancel task and continue, or Stay; existing unsaved-work guards still apply. Closing the result panel does not stop a run. The long-running task does not hold the existing UI-wide action lock.

## Required feasibility checkpoint

Before production integration, use disposable fixtures and the exact supported CLI version to prove:

- Packaged-app executable resolution and noninteractive launch with existing authentication; no login or model invocation during mere settings validation.
- Model/profile/advanced argument precedence, structured events/final response extraction, malformed output, missing authentication, and unsupported settings.
- Actual skill discovery and explicit invocation under the chosen working directory/configuration, including workspace skills and duplicate names. Record any inherited instructions, hooks, or tools that affect the effective execution policy.
- Enforced workspace write protection, including attempts through skills/tools; cancellation of descendants; timeout/output caps; normal app quit; no orphan process or stale event updates.
- Literal handling of quotes, spaces, newlines, and shell-looking prompt/argument text.

Failing a required boundary blocks that capability. Record evidence and return material changes to this proposal; do not describe inferred or untested restrictions as guarantees.

## Acceptance criteria and planned validation

1. A configured user can open the centered palette, write a free prompt, choose a profile, inspect context, execute, and read the result while retaining the document context.
2. Exactly one built-in action is present; no predefined task catalogue is required. Keyboard focus, Escape, multiline entry, and explicit Run/Cancel work at normal and minimum window sizes.
3. Profiles survive normal relaunch and round-trip executable, model/default, skills, native profile, and supported advanced tokens. Missing or malformed settings are recoverable without losing user configuration.
4. The launched executable and arguments match the reviewed profile; reserved/conflicting settings cannot override the execution boundary. Prompt text is passed as data, preferably standard input, not inserted into shell code.
5. Context bytes/provenance match what the user reviewed, including unsaved content. Running does not save or modify documents, dirty state, undo history, or Connections.
6. Skill discovery/selection works for the supported version with truthful availability and implicit-use descriptions. It does not imply skills share a universal CLI flag or grant extra access.
7. Missing executable, incompatible settings, authentication failure, malformed events, empty final output, timeout, output cap, and cancellation have distinct useful outcomes. No automatic provider switch or retry occurs.
8. Cancellation and normal exit leave no task descendants; late events cannot update another workspace. Browsing/editing remains responsive during execution.
9. Safe result rendering preserves existing HTML/resource restrictions. Profiles and application diagnostics do not persist prompt content or credentials by default. Results remain session-only; provider-owned persistence is disclosed separately.
10. Complete focused frontend/Rust tests, production and packaged macOS builds, formatting and diff checks, and isolated native interaction tests without closing the user's working session. Test meaningful boundaries with a controlled fake CLI; separately record real CLI feasibility evidence, never substituting one for the other.

## Alternatives and risks

- Claude Code is also installed, but supporting two adapters now doubles capability and lifecycle validation. Its availability is not evidence of equivalent parameter or skill support.
- A universal command-template runner would be flexible but cannot normalize unsupported capabilities or safely promise the same lifecycle. Start with one verified adapter while keeping profile identity independent of action definitions.
- Arbitrary raw configuration overrides can alter permissions, tools, hooks, or output transport. Validate by supported semantics, not just a small blacklist of flag names.
- A context-only execution may make existing workspace skills unavailable. Resolve this in the checkpoint rather than presenting an empty list as proof that no skills are installed.

## Evidence, open decisions, acceptance, and plan

Local inspection on 2026-10-21 found Codex CLI 0.163.0 and an installed Claude executable. `codex exec --help` exposes model, config overrides, native profile, sandbox, JSON events, and standard-input prompt handling. Version/help inspection emitted a PATH-alias permission warning but completed; no agent task or authentication check was run.

Current upstream references inspected through Context7: [skills configuration](https://github.com/openai/codex/blob/main/codex-rs/config/src/skills_config.rs), [skill discovery](https://github.com/openai/codex/blob/main/codex-rs/ext/skills/src/loader/discovery.rs), and [explicit skill invocation sample](https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/review-agent/agents/openai.yaml). Upstream main is not proof of behavior in the installed version; the checkpoint must verify it.

Accepted decisions: Codex as the first adapter; visible controls and a native menu entry without a new keyboard shortcut; the limits above; session-only results; no workspace writes/apply step in this foundation. Exact skill/configuration enforcement remains a feasibility gate, not an assumed capability.

The user explicitly accepted this written SPEC with “si acepto” on 2026-10-21, in response to the request to accept SPEC 017 and prepare its plan. The accepted scope includes the decisions above; feasibility-dependent capabilities remain subject to the recorded checkpoint. The [matching implementation plan](../plans/017-agent-palette-and-cli-profiles.md) is now recorded with status Pending. No application behaviour has been changed. Follow [SDD](../SDD.md); do not request acceptance of this same contract again.

On 2026-10-22, the user amended the accepted scope with “do not include shortcuts, I dont use them”. Removed the proposed palette shortcut. Standard text entry and focus accessibility remain supported; every action is available through visible controls. This amendment does not remove existing application shortcuts.
