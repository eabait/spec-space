import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { basicSetup } from 'codemirror';
import { applyEditorChanges, editorText, type Change } from './text';
export interface EditorHandle {
  navigateToLine(line: number): void;
}

export const Editor = forwardRef<
  EditorHandle,
  {
    content: string;
    canEdit?: () => boolean;
    onChange: (content: string) => void;
  }
>(function Editor({ content, onChange, canEdit }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const editing = useRef(canEdit);
  editing.current = canEdit;
  const raw = useRef(content);
  useImperativeHandle(
    ref,
    () => ({
      navigateToLine(line) {
        const view = viewRef.current;
        if (!view) return;
        const number = Math.max(1, Math.min(line, view.state.doc.lines));
        const position = view.state.doc.line(number).from;
        view.dispatch({
          effects: EditorView.scrollIntoView(position, { y: 'start' }),
        });
        view.focus();
      },
    }),
    [],
  );
  useEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      dispatchTransactions: (transactions, view) => {
        if (
          editing.current?.() === false &&
          transactions.some((transaction) => transaction.docChanged)
        )
          return;
        view.update(transactions);
      },
      state: EditorState.create({
        doc: editorText(raw.current),
        extensions: [
          basicSetup,
          markdown(),
          EditorView.lineWrapping,
          EditorView.theme({
            '&': {
              height: '100%',
              fontSize: '13px',
              backgroundColor: '#f6f3eb',
              color: '#213746',
            },
            '.cm-scroller': {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              lineHeight: '1.8',
            },
            '.cm-content': { padding: '24px 0' },
            '.cm-line': { padding: '0 20px' },
            '.cm-gutters': {
              backgroundColor: '#f2efe6',
              color: '#8a928f',
              border: 'none',
            },
            '.cm-activeLine': { backgroundColor: '#e9eee8' },
            '.cm-activeLineGutter': { color: '#2c7775' },
            '.cm-cursor': { borderLeftColor: '#277b78' },
            '.cm-selectionBackground': { backgroundColor: '#cfe3de' },
            '&.cm-focused .cm-selectionBackground': {
              backgroundColor: '#cfe3de',
            },
            '&.cm-focused': { outline: 'none' },
          }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const changes: Change[] = [];
            update.changes.iterChanges((from, to, _a, _b, insert) =>
              changes.push({ from, to, insert: insert.toString() }),
            );
            raw.current = applyEditorChanges(raw.current, changes);
            callback.current(raw.current);
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      viewRef.current = null;
      view.destroy();
    };
  }, []);
  return <div className="editor-host" ref={host} />;
});
