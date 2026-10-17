# SpecSpace — contributor and agent entry point

## Resuming a task

1. Read [PROJECT_STATUS.md](PROJECT_STATUS.md): current status, evidence, and next steps.
2. Inspect `git status --short --branch` and local changes; preserve existing work.
3. Read [VISION.md](VISION.md), [SPEC.md](SPEC.md), and [ARCHITECTURE.md](ARCHITECTURE.md).
4. Find the relevant increment in [specs/](specs/README.md) and its [plan](plans/README.md).
5. Follow the [SDD workflow](SDD.md); the repository takes precedence over chat history.

## Sources of truth

- VISION: revisable direction, not implementation promises.
- SPEC: current product, not future proposals.
- ARCHITECTURE: current implementation and component boundaries.
- specs/: incremental contracts and acceptance decisions.
- plans/: steps and implementation evidence for each increment.
- PROJECT_STATUS: entry point for a new task; keep it concise and current.
- [README](README.md): setup, usage, and validation commands.

## Core conventions

- All code and documentation must be written in English.
- Do not implement an increment without an accepted SPEC and a recorded plan.
- The user must accept the SPEC; never infer acceptance from the code.
- Do not ask again for authorization already explicit in the task; record the evidence.
- Do not discard, overwrite, or consolidate existing work without authorization.
- Do not publish, notarize, or deploy by default. Validate locally.
- Use strict TypeScript, functional React, Prettier, and `cargo fmt`.
- React handles interaction; Rust validates filesystem access and saving.
- Preserve Markdown source; never save a conversion of the preview.
- Do not expand webview permissions or load remote resources without an explicit contract.
- Prefer small responsibilities and extract modules when a change warrants it.
- Test real behavior and risks, not implementation details.
- Verify which executable is open before macOS validation; debug and release builds can coexist.
- Do not close sessions containing user work to test a build.

## Progressive disclosure

Keep this file under 100 lines. Read task-specific documents instead of indiscriminately reading the entire repository. Create `CODING_CONVENTIONS.md`, `BEST_PRACTICES.md`, or other guides only when concrete rules warrant them; link them here and avoid duplication.
