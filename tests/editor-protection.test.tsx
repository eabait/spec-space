// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { EditorView } from '@codemirror/view';
import { undo } from '@codemirror/commands';
import { Editor } from '../src/Editor';

afterEach(cleanup);
it('blocks edits and undo while guarded, then preserves history and selection when unlocked', () => {
  let locked = false;
  let content = 'original';
  const { container, rerender } = render(
    <Editor
      content={content}
      canEdit={() => !locked}
      onChange={(value) => {
        content = value;
      }}
    />,
  );
  const view = EditorView.findFromDOM(
    container.querySelector('.cm-editor') as HTMLElement,
  )!;
  act(() =>
    view.dispatch({
      changes: { from: 8, insert: ' edit' },
      selection: { anchor: 13 },
    }),
  );
  expect(content).toBe('original edit');
  locked = true;
  act(() => view.dispatch({ changes: { from: 0, insert: 'blocked' } }));
  act(() => {
    undo(view);
  });
  expect(content).toBe('original edit');
  expect(view.state.selection.main.anchor).toBe(13);
  rerender(
    <Editor
      content={content}
      canEdit={() => !locked}
      onChange={(value) => {
        content = value;
      }}
    />,
  );
  expect(
    EditorView.findFromDOM(
      container.querySelector('.cm-editor') as HTMLElement,
    ),
  ).toBe(view);
  locked = false;
  act(() => {
    undo(view);
  });
  expect(content).toBe('original');
});
