# 013 — Explore a diagram in a focused view

Status: Implemented. Created, accepted, and validated: 2026-10-21.

## Problem and intended outcome

Wide or tall Mermaid diagrams become difficult to read within the Markdown preview. Let users expand one rendered diagram, inspect its details with zoom and pan, and return to the same document context without changing source or losing pending work.

## Relationship to VISION

**Aligns** with Horizon 1 — Authoring Workspace. This is the first bounded step toward the Architecture Explorer direction discussed by the user, without introducing a component or dependency model.

## Scope and behavior

### Open and return

- Each successfully rendered, current Mermaid diagram offers an explicitly labelled **Explore diagram** action beside its existing image actions in Preview and Split modes.
- Open an application-level modal focus view occupying the available app window. This is not a separate window or a macOS fullscreen transition. Identify the source filename and diagram ordinal in its header.
- Initially fit and center the complete diagram with padding. Only one focused diagram can be open at a time. All currently renderable diagram types receive the same visual navigation; no node identification is required.
- Keep the underlying document and editor mounted. The modal blocks background interaction and document navigation, traps keyboard focus, and prevents background scrolling.
- **Back to document** and Escape close the view and restore focus to its opening control without scrolling the document. Preserve active tab, pane mode, source and preview positions, pending text, and undo history.
- Opening or closing the view never saves or changes a document. Existing native save and quit safeguards remain authoritative; the focus view must not obscure or interfere with a pending-change prompt.

### Navigate

- Provide icon-only zoom-out, zoom-in, **Fit**, and **Reset to 100%** buttons with accessible names and hover/focus tooltips. Show the current zoom percentage as text. Here 100% means the SVG's natural rendered dimensions, not its preview-scaled size.
- Fit shows the whole diagram with padding, including diagrams that require a scale below the ordinary minimum. Button and gesture zoom are bounded between the smaller of fit scale and 10%, and 400%; Fit never enlarges beyond 100%.
- Reset centers the diagram at 100%. Fit and Reset are distinct actions and always provide a way to recover orientation.
- Drag the canvas to pan; use ordinary wheel or trackpad scrolling to pan. Use Command + wheel or trackpad scroll to zoom around the pointer. These interactions affect only the focused canvas and never browser/page zoom or the underlying document.
- When the canvas has keyboard focus, arrow keys pan, + and - zoom, and 0 fits the diagram. The same actions remain available through keyboard-accessible toolbar controls; arrow shortcuts do not intercept toolbar navigation.
- Zoom buttons and keyboard zoom use the canvas center as their anchor. Navigation changes only the viewport transform and never invokes Pele again.
- On resize, a fitted view refits. A manually adjusted view preserves its zoom and the diagram point at the viewport center. The toolbar and return action remain usable at the existing minimum window size of 850 × 580.
- Viewport state lasts only while the focus view is open. Reopening starts fitted. No preferences, document metadata, or session-persistence fields are added.

### Rendering, source changes, and export

- Reuse the current sanitized rendering. Opening the view does not introduce another rendering request or another renderer. Pending, invalid, or obsolete diagram output cannot be opened.
- The focus view is read-only. Background editing is unavailable while it is open. If its owning document, source block, or current rendered revision changes or disappears through an application action, close the view safely rather than showing an obsolete diagram. Restore focus to the document area if the original opening control no longer exists.
- Retain **Save PNG…** and **Copy Image** in the focus view using the existing export behavior and size limits. Export the complete untransformed diagram, regardless of zoom, pan, or clipping. Disable duplicate export operations and expose success, cancellation, and failure behavior consistently with Preview.
- Keep Pele's disabled links/images and the SVG sanitizer unchanged. No authored scripts, diagram links, external resources, or additional webview permissions are enabled.

## Exclusions

Node or edge selection; label search; inspectors; semantic dependencies; minimaps; graph traversal; visual editing; cross-diagram or document links; SVG export; persistent viewport state; interactive pan/zoom inside ordinary Preview; renderer replacement; guarantees for arbitrary diagram sizes.

## Acceptance criteria and planned validation

1. Open the intended diagram from a document containing multiple Mermaid blocks in Preview and Split. Its header identifies the correct document and ordinal; opening and viewport navigation do not call the renderer again.
2. Explore wide and tall fixtures using mouse drag, trackpad/wheel pan, modified-scroll zoom, toolbar actions, and keyboard actions. Verify zoom anchors, bounds, Fit, Reset, and resize behavior. Background document scroll stays unchanged.
3. Open and close the view while the document contains unsaved edits. Verify exact source preservation, dirty state, source/preview positions, active tab, pane mode, and undo/redo continuity.
4. Verify focus trapping, labelled controls, Escape, focus restoration, and usability at normal and 850 × 580 window sizes. Check native quit with pending changes from inside the view without closing a user-owned session.
5. Pending or failed rendering cannot open the view. A source/document revision change or removal dismisses it without stale content or a stranded focus trap. Older asynchronous renders cannot replace newer content.
6. Save a PNG and paste a copied image after zooming and panning. Both contain the whole diagram and preserve existing export limits and error handling. SVG security restrictions remain effective.
7. Run relevant frontend behavior tests, production build, formatting, and diff checks. Validate real gestures, layout, return context, and native image operations in an isolated packaged macOS app, recording observed results and any limitations. Use representative wide, tall, small, and multi-diagram documents; report fixture sizes when assessing responsiveness.

## Decisions, risks, and alternatives

- A dedicated modal avoids gesture conflicts in ordinary Markdown reading. Native fullscreen and inline exploration can be evaluated separately if needed.
- This increment requires SVG dimensions and a viewport, not stable node IDs. A Pele semantic capability investigation is a prerequisite for future component interaction, not for this proposal.
- Reusing SVG output must preserve unique element identifiers and export dimensions; avoid duplicate IDs or exporting a clipped/transformed viewport.
- Rendering speed alone does not prove gesture responsiveness. Validate interaction in the packaged app with representative fixtures before claiming smooth navigation.
- Native menu actions and pending-edit dialogs must coexist with modal focus. The implementation plan must identify their integration before coding.

## Acceptance and plan

The user selected this increment and directed on 2026-10-21: “Put focus on UI and use icons instead of labels. Then start implementing.” The scope and icon-toolbar direction are accepted for implementation.

See [plan 013](../plans/013-focused-diagram-view.md).
