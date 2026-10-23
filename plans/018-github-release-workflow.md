# 018 — GitHub release workflow

Status: In progress. Local implementation and validation complete on 2026-10-23; hosted verification pending.

## Contract and authorization

[SPEC 018](../specs/018-github-release-workflow.md) was explicitly accepted by the user with “aceptada” on 2026-10-23. This plan records implementation before code changes. No further acceptance is needed for implementation within that scope. Remote execution, commits, pushes, tags, publication, signing, and notarization remain outside this task.

## Initial state and approach

No .github workflows exist. App/package versions are 0.1.0 and Tauri bundles only .app. Preserve all existing documentation changes, including SPEC 017. Use GitHub-hosted macOS 15 Apple Silicon and Intel runners, Node 24, Python 3.13 standard-library helpers, and stable Rust with locked dependency resolution. Separate read-only validation/build jobs from the contents-write release job. Resolve action revisions against official repositories and pin full commit hashes.

## Steps

1. Record acceptance and add this plan.
2. Add a tag-triggered/manual workflow with validated tag resolution and version matching, existing checks, two macOS builds, archive verification, and artifact transfer.
3. Add a draft-only release helper with explicit ownership markers, checksum verification, published-release refusal, safe reruns, and focused tests using local fixtures/fake GitHub responses.
4. Document version preparation, tagging, retry, review, and platform/signing limits. Add workflow/helper validation to the relevant checks.
5. Run focused tests, existing frontend/Rust checks, actionlint, and local packaging checks where toolchains are available. Record hosted checks as pending rather than claiming unobserved results.
6. Update SPEC/ARCHITECTURE/status/indexes with accurate delivery and validation state.

## Risks and preservation

A human can publish a draft while uploads are running; check draft state immediately before each mutation and document that maintainers must wait for completion. GitHub APIs do not provide an atomic draft-state condition for uploads. Only replace assets bearing this workflow's ownership label; preserve unrelated assets and all existing release notes. Never retry published releases. Failures may leave an incomplete draft, repaired by rerun. No runtime application behavior changes. Rollback removes the new workflow/helpers and release documentation without touching existing work.

## Validation and closure

Local implementation is delivered in `.github/workflows/release.yml` and `scripts/release/{validate,package,draft}.py`, with tests in `test_release.py`. README includes the operator procedure; package scripts expose release tests and include workflow YAML in formatting checks. Generated archives and Python bytecode are ignored. No application runtime code or dependency version changed.

Observed on 2026-10-23:

- `npm run test:release`: 12 tests passed. Real disposable Git fixtures cover existing/missing tags, exact tagged source, version mismatch, invalid input, and SemVer prereleases. Fake API tests cover draft creation, published-release rejection, notes/unrelated asset preservation, collision refusal, moved tags, missing/corrupt assets, replacement of incomplete owned uploads, publication between mutations, network failure, and idempotent retry. These tests did not contact GitHub or create real releases.
- `npm test`: 55 frontend tests passed. Existing jsdom canvas diagnostics remain non-failing.
- `npm run build`: passed; existing large-chunk warning remains.
- `npm run format:check`, `black --check scripts/release`, and `git diff --check`: passed.
- `cargo test --locked --manifest-path src-tauri/Cargo.toml`: 9 tests passed. `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: passed.
- `actionlint` 1.7.12: passed. Its official release archive checksum was verified before use.
- Full action commit pins were resolved from official release tags and their manifests inspected. Final actions use Node 24 runtimes: checkout v7.0.1, setup-node v7.1.0, setup-python v7.1.0, upload-artifact v7.0.2, download-artifact v8.0.2. The initial Node 20 action candidates were replaced before delivery. Runner labels were verified against the [GitHub runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
- `npm run tauri -- build --target aarch64-apple-darwin --bundles app -- --locked`: passed (11.28 MiB app).
- Installed the Intel Rust target and ran `npm run tauri -- build --target x86_64-apple-darwin --bundles app -- --locked`: passed (11.51 MiB app). This was cross-compilation on an Apple Silicon Mac, not an Intel launch test.
- Ran the production packaging helper for both builds. Info.plist version 0.1.0 and `lipo` architecture checks passed; `ditto` ZIP extraction preserved executable permissions and binary hashes. The complete two-archive/two-checksum asset set passed the upload helper's validation and independent `shasum -a 256 -c` checks from the asset directory.
- Local ZIP checksums: arm64 `b8a92bda232ae13c9d7b8fd688ac10cd501795cd3d17158e82420172b385c7d0`; x86_64 `faa2cece1e1e9942e63765f9b4d9f9bf12f5f87b50e4d74c4c88cabe2437e289`. These are local working-tree validation artifacts in ignored `release-assets/`, not published or tagged release assets.

Remaining: a separately authorized GitHub-hosted run after the workflow is committed/pushed must prove runner availability, repository-token permissions, artifact transfer, and real draft creation/retry. No native app launch was performed; user app sessions were untouched. No commit, push, tag, remote workflow run, release, signing, or notarization was performed. SPEC 018 remains In progress until the required hosted evidence exists.

The release helper uses the [GitHub Releases REST API](https://docs.github.com/en/rest/releases/releases) and verifies draft state before each mutation. Concurrent human publication cannot be made atomic with an asset upload; README instructs maintainers to wait for workflow completion. This API limitation is explicit rather than hidden by a claim of absolute race protection.
