# 018 — GitHub release workflow

Status: Implemented on 2026-10-24. Accepted on 2026-10-23.

## Problem and intended outcome

SpecSpace has local macOS build instructions but no GitHub Actions release workflow. Prepare versioned downloadable macOS apps from an explicit source tag, with automated checks and a draft release that a maintainer reviews before publication.

## Relationship to VISION

Aligns with the local desktop product by making tested builds available to users. This is delivery infrastructure; it does not change document handling or introduce application cloud services. SPEC 017 remains independently accepted and pending.

## Scope and behavior

- Trigger on pushed version tags in the form `vMAJOR.MINOR.PATCH`, with an optional SemVer prerelease suffix. Ordinary branch pushes and pull requests do not create releases.
- Permit a manual run for an existing version tag. Validate the input as data, resolve the tag to a commit, and build that exact revision. Never create or move a tag implicitly.
- Require the tag version to match the application versions in package.json, its lockfile, src-tauri/tauri.conf.json, Cargo.toml, and the application's Cargo.lock entry. Reject missing tags, invalid versions, and mismatches before release writes.
- Install locked frontend and Rust dependencies. Run the existing frontend tests, production build, formatting checks, Rust tests, and Rust formatting check before preparing release assets.
- Build separate macOS app bundles for Apple Silicon and Intel. Package each .app as a ZIP preserving the bundle structure and executable permissions. Name assets with the version and architecture, and include SHA-256 checksums.
- Verify executable architecture and packaged version. Cross-compilation alone is not evidence of native launch validation on the other architecture.
- Create or update a draft GitHub release only after all required checks and both builds succeed. Include the source commit, architecture descriptions, and an explicit statement that these builds are not Developer ID signed or notarized. Ad-hoc signing, if required by the toolchain, is not Developer ID signing.
- Keep releases as drafts; a maintainer publishes through GitHub after review. Mark versions with prerelease suffixes as prereleases. A workflow rerun must not publish a draft, modify a published release, move a tag, or overwrite unrelated assets or maintainer-edited notes.
- Serialize runs for the same version. Retry attachment of this workflow's assets to an existing draft safely; report incomplete upload failures without publishing. A draft can remain incomplete after a network failure.
- Use the repository GITHUB_TOKEN, with read permissions for validation/build jobs and contents-write permission only for the release job. Do not require a personal access token or Apple credentials. Pin external actions to reviewed commit hashes.
- Document version preparation, tagging, manual retry, asset selection, draft review, and the current macOS distribution limitations in README.

## Exclusions and preservation

No Windows/Linux packages, automatic updater, Apple certificate provisioning, notarization, App Store submission, automatic version bumps, automatic commits/pushes, or public publication in this increment. Do not change runtime permissions, document content, application behavior, or unrelated local work. Implementing the workflow does not authorize running it remotely or pushing a release tag during this task.

## Acceptance criteria and validation

1. The workflow and helper scripts pass YAML/action validation and formatting checks. Trigger and permission boundaries match this contract.
2. Focused validation covers valid tags, missing tags, version mismatches, malformed manual input, prerelease classification, and refusal to mutate a published release.
3. The documented local checks pass, or failures are recorded accurately with their cause. Existing unrelated failures must not be concealed or bypassed.
4. Build outputs contain the expected .app, matching version and CPU architecture; archives extract correctly and checksums match.
5. A GitHub-hosted run, when separately authorized and available after the workflow is pushed, demonstrates both architecture builds and a draft with the expected assets. Record remote execution as pending until observed; local validation is not proof of a successful hosted workflow.
6. A rerun against a draft preserves its draft state and maintainer notes. A published release is rejected before mutation. Failed builds never initiate a release upload.
7. README explains the human publication step and makes no claim of signing, notarization, or native validation that has not occurred.

## Risks and alternatives

GitHub-hosted macOS runner availability and account usage limits may affect execution. Unsigned/non-notarized downloads have macOS distribution limitations; signing is a separate future increment. Two architecture-specific ZIPs keep the initial workflow close to the existing app-only bundle configuration. DMG installers or a universal app can be considered separately.

The implementation plan will select supported runner labels and exact action revisions after acceptance. The upstream [Tauri GitHub Actions guide](https://v2.tauri.app/distribute/pipelines/github/) documents macOS targets and draft releases; its example is a reference, not a substitute for this contract's validation and publication boundaries.

## Acceptance and plan

The user explicitly accepted SPEC 018 with “aceptada” on 2026-10-23. Implementation follows the [recorded plan](../plans/018-github-release-workflow.md). Remote execution and publication remain outside this task.

Local and hosted validation results are recorded in the matching plan. GitHub Actions run 40109531800 validated the tag, completed both macOS builds, transferred both architecture artifacts, and completed the draft-release job successfully. Publication and native launch confirmation remain human steps; no release was published automatically.
