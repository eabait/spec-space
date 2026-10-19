# Plan 007 — Evaluate Pele as a Mermaid renderer

Status: Complete. Date: 2026-10-19.

Contract: [SPEC 007](../specs/007-pele-renderer-evaluation.md), accepted with “hagamos la comparación” on 2026-10-19.

## Initial state

SpecSpace renders Mermaid 11.17.2 diagrams from `src/Preview.tsx` in strict mode, disables HTML labels, sanitizes the generated SVG with DOMPurify, and uses the SVG for PNG export and clipboard copying. Pele is a separate implementation with a different layout engine and CSS-variable theming. Its documentation describes Mermaid 12.1.0 compatibility.

## Steps

1. Prepare an isolated comparison harness using the exact current Mermaid version and a pinned Pele version; do not add Pele to production dependencies.
2. Use paired Mermaid sources covering the SPEC 007 diagram types, long/wide labels, styles/directives, invalid syntax, and a wide layout.
3. Compare successful output, visual layout, sanitizer compatibility, and PNG rasterization compatibility.
4. Measure repeated render durations in the same browser and compare production bundle contributions using local build outputs.
5. Record evidence, limitations, and a recommendation. Leave production renderer and exports unchanged.

## Affected files

Expected: this plan, SPEC 007, `specs/README.md`, `plans/README.md`, and `PROJECT_STATUS.md`. Any harness and dependency installation should remain temporary or explicitly development-only and be removed after evaluation.

## Risks and preservation

- Do not trust vendor benchmark ratios as local results; measure both libraries under matched conditions.
- Keep Mermaid's current strict mode, sanitization, disabled remote images/links, and export requirements as comparison constraints.
- Pele's own layout and color system may change diagram readability even when syntax parses successfully.

## Validation and results

The local production comparison used Mermaid 11.17.2 from the project lockfile and Pele 1.6.0 installed in a disposable directory. The browser was Chrome 155 on macOS at 1280 × 720. The test harness used Vite 7.3.7 production builds; both renderers were imported lazily and rendered the same source text. Timing values measure renderer calls, including lazy module/type loading on each sample's first call, but exclude React scheduling and the product's 300 ms debounce.

The 12-case corpus included the exact flowchart in `examples/Architecture.md`, a styled flowchart with a subgraph and long labels, sequence, class, state, ER, Gantt, pie, and architecture diagrams, an external-click diagram, an intentionally over-wide graph, and invalid syntax. Pele rendered all 11 valid cases; both libraries rejected the invalid source. Every valid SVG passed through the existing DOMPurify configuration without `a`, `image`, `foreignObject`, or `script` elements. Pele rendered the external-click diagram with links disabled. The existing `diagramPng` helper successfully produced PNG bytes for the normal-size samples from both libraries. Both renderers hit the current 16-megapixel/8192-pixel export limit on the intentionally wide graph.

This checked the browser-side PNG rasterization helper, not the native macOS clipboard command or a paste into another app. The corpus used one checked-in example plus authored test diagrams; no external user workspace documents or Tauri WebView session were available for this comparison.

In the production browser harness, Pele's warm median render calls were 0.1–0.9 ms across the valid corpus; Mermaid's were 2.0–44.3 ms. The repository example flowchart measured 0.2 ms for Pele and 19.6 ms for Mermaid. These are local measurements from one browser run, not general performance guarantees.

Separate renderer-only Vite production builds used equivalent lazy entry points and included the renderer's complete diagram chunks, but not React, DOMPurify, or the application. Summed JavaScript assets were 3,409,909 bytes raw / 974,065 bytes gzip for Mermaid and 680,766 bytes raw / 279,826 bytes gzip for Pele, approximately 71% less gzip output for Pele. The current Mermaid package declares 22 direct dependencies; Pele declares none.

Visual comparison confirmed that Pele's layout and visual language differ: its boxes, spacing, SVG dimensions, and node positioning do not match Mermaid's neutral theme. The side-by-side output remained readable, and the existing sanitizer and PNG helper handled its SVG. Pele documents Mermaid 12.1.0 syntax compatibility, while this app uses Mermaid 11.17.2; passing this representative corpus does not establish compatibility with every existing document or directive.

### Recommendation

Pele is worth integrating in a separately accepted increment: the measured bundle and render reductions are substantial, the tested diagram types and export path worked, and the existing security boundary can remain in place. Before replacing Mermaid, the implementation increment should add a broader compatibility corpus, include actual user documents where available, verify theme/directive behavior, and treat the visible style change as an explicit product decision. Keep links and external images disabled and retain DOMPurify. No production renderer or dependency was changed in SPEC 007.

References: [Pele compatibility](https://pele.run/compatibility), [Pele API](https://pele.run/api), [Pele security](https://pele.run/security), [Pele repository](https://github.com/obsidianmd/pele).
