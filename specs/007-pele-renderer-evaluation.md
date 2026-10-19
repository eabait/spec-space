# 007 — Evaluate Pele as a Mermaid renderer

Status: Implemented (evaluation complete; production renderer unchanged). Date: 2026-10-19.

## Problem and intended outcome

Pele is a newer local library that renders Mermaid syntax to SVG. Its maintainers report lower rendering cost and a smaller dependency footprint, but it uses its own layout and visual style. SpecSpace currently uses Mermaid 11.17.2, strict security settings, DOMPurify sanitization, and SVG-to-PNG export. Decide whether Pele is a suitable replacement based on compatibility and measured behavior in SpecSpace's actual rendering path.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace by evaluating preview performance and maintainability without changing the Markdown authoring contract.

## Scope and behavior

- Compare the current Mermaid renderer and Pele using the same representative Mermaid sources and a browser environment.
- Record supported syntax, rendering failures, material layout or style differences, cold and warm render time, and browser bundle contribution.
- Verify that Pele output can pass through SpecSpace's SVG sanitizer and existing PNG rasterization path with links and external images disabled.
- Recommend keeping Mermaid, adopting Pele, or deferring the choice, with evidence and remaining risks.
- Keep the comparison isolated; production continues to use Mermaid until a separate implementation increment is explicitly accepted.

## Exclusions

Replacing the production renderer, changing diagram output or themes, changing the Markdown contract, adding renderer controls, remote rendering, or changing PNG export behavior.

## Acceptance criteria

1. Record the exact renderer versions and compare common diagrams, including flowchart, sequence, class/state, entity relationship, and at least one chart or planning diagram, plus invalid syntax and a wide diagram.
2. Record which sources both render, which render differently, and whether SVG sanitization and existing PNG export remain viable for Pele output.
3. Measure renderer contribution to the production frontend bundle and repeated render timings under the same local conditions; label these as local measurements rather than vendor claims.
4. Make a recommendation grounded in compatibility, fidelity, security, performance, and bundle results. Do not modify the production renderer as part of this evaluation.

## Risks and open questions

- Pele targets Mermaid 12.1.0 syntax while SpecSpace currently resolves Mermaid 11.17.2; syntax support does not imply identical layout or output.
- Pele's SVG must retain the existing DOMPurify boundary and the product's restrictions on links, images, and foreign content.
- Timing and bundle comparisons depend on the same browser, build mode, and measured entry points.

## Acceptance and plan

Accepted for comparison by the user with “hagamos la comparación” on 2026-10-19. The evaluation recommends proceeding to a separate, controlled integration increment; it does not authorize changing the production renderer. See [plan 007](../plans/007-pele-renderer-evaluation.md) for results and limitations.
