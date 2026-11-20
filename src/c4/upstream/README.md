# C4 Hero parser provenance

The files in this directory are derived from [C4 Hero](https://github.com/c4hero/c4hero) at immutable commit `207b357d5ebdb9cd8523053ad4fb7d67154822e4`. The upstream Apache-2.0 license and NOTICE are retained alongside the source.

The same license and NOTICE are copied into `public/third-party/c4hero` so they are retained in the packaged frontend. Update those copies with any upstream revision change.

The parser dependency closure includes the lexer, parser and parser modules, wildcard and implied-relationship semantics, default-view generation, view keys, encoding, deployment model helpers, model types, and the pure status-validation subset of `elementStatus.ts`. The application store, Canvas, bootstrap, routing, persistence, serializer, include resolver, providers, telemetry, and network integration are outside this closure.

## Local modifications

- Rewrite upstream `@/` imports to local relative imports and flatten the original `src/lib` and `src/types` directories.
- Extract only `MAX_STATUS_LENGTH`, `isElementStatusValue`, and `normalizeElementStatus` from the upstream status module. Its store dependencies are excluded.
- Add visible warnings when the parser skips unknown directives or workspace syntax. SpecSpace preserves the source buffer independently of all derived model data.
- Apply the repository's formatting conventions.

The upstream parser and lexer regression tests are retained in `tests/c4-upstream-*.test.ts`. Their test-only shim invokes `parse` and `generateDefaultViews` without importing the upstream serializer. SpecSpace's adapter, layout, UI, document-lifecycle tests, and example provide additional compatibility evidence.

## Updating

Choose and record an immutable upstream revision. Inspect the parser import closure again, including transitive imports and runtime effects. Preserve the license and NOTICE. Reapply and review the local modifications above. Run the copied parser/lexer tests, SpecSpace compatibility and interaction tests, frontend build and formatting checks, Rust boundary tests, and isolated native validation at normal and minimum window sizes. Review view membership, inferred relationships, diagnostics, and offline behavior before adopting the revision.
