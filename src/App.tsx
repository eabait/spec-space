import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Save,
  Search,
  X,
} from 'lucide-react';
import { Editor } from './Editor';
import { Preview } from './Preview';
import { relativeLink } from './text';
interface Entry {
  name: string;
  path: string;
  directory: boolean;
}
interface Document {
  path: string;
  content: string;
  revision: string;
}
interface Tab extends Document {
  saved: string;
  generation: number;
}
type Choice = 'save' | 'discard' | 'cancel';
const sample =
  '# A clearer space for your specifications\n\nOpen a local folder to start working. Your Markdown stays yours.\n\n## Built for technical thinking\n\n- Edit source without changing its format\n- Keep architecture and requirements side by side\n- Preview diagrams as you write\n\n```mermaid\nflowchart LR\n  A[Local files] --> B[Markdown editor]\n  B --> C[Live preview]\n```\n\n> Local files. Focused editing. No account required.\n';
export function App() {
  const [workspace, setWorkspace] = useState('');
  const [tree, setTree] = useState<Record<string, Entry[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [tabs, setTabs] = useState<Tab[]>([]);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const [active, setActive] = useState('');
  const [mode, setMode] = useState<'source' | 'split' | 'preview'>('split');
  const [sidebar, setSidebar] = useState(true);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Local-first workspace');
  const [prompt, setPrompt] = useState<{
    message: string;
    resolve: (choice: Choice) => void;
    save: boolean;
  } | null>(null);
  const selected = tabs.find((t) => t.path === active);
  const dirty = (tab: Tab) => tab.content !== tab.saved;
  const ask = (message: string, save = true) =>
    new Promise<Choice>((resolve) => setPrompt({ message, resolve, save }));
  const perform = useCallback(async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(String(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, []);
  async function save(tab: Tab) {
    const revision = await invoke<string>('write_document', {
      path: tab.path,
      content: tab.content,
      expectedRevision: tab.revision,
    });
    setTabs((current) =>
      current.map((t) =>
        t.path === tab.path ? { ...t, revision, saved: tab.content } : t,
      ),
    );
    setStatus(`Saved ${tab.path}`);
  }
  async function protect(list: Tab[]) {
    const changed = list.filter(dirty);
    if (!changed.length) return true;
    const choice = await ask(
      `${changed.length === 1 ? changed[0].path : `${changed.length} documents`} has unsaved changes.`,
    );
    if (choice === 'cancel') return false;
    if (choice === 'save') for (const tab of changed) await save(tab);
    return true;
  }
  const choose = () =>
    perform(async () => {
      if (!isTauri()) {
        setError(
          'Run the desktop app with npm run tauri dev to open local folders. This browser view is a preview.',
        );
        return;
      }
      if (!(await protect(tabsRef.current))) return;
      const root = await invoke<string | null>('choose_workspace');
      if (!root) return;
      setWorkspace(root);
      setTabs([]);
      setActive('');
      setTree({});
      setExpanded(new Set());
      setFilter('');
      setTree({ '': await invoke<Entry[]>('list_directory', { path: '' }) });
      setStatus('Workspace opened');
    });
  async function open(path: string) {
    if (tabsRef.current.some((t) => t.path === path)) {
      setActive(path);
      return;
    }
    const doc = await invoke<Document>('open_document', { path });
    setTabs((current) => [
      ...current,
      { ...doc, saved: doc.content, generation: 0 },
    ]);
    setActive(path);
  }
  async function close(path: string) {
    const tab = tabsRef.current.find((t) => t.path === path);
    if (!tab || !(await protect([tab]))) return;
    const next = tabsRef.current.filter((t) => t.path !== path);
    setTabs(next);
    if (active === path) setActive(next.at(-1)?.path ?? '');
  }
  async function reload() {
    if (!selected) return;
    if (
      dirty(selected) &&
      (await ask('Reload from disk and discard your local edits?', false)) !==
        'discard'
    )
      return;
    const doc = await invoke<Document>('open_document', { path: active });
    setTabs((current) =>
      current.map((t) =>
        t.path === active
          ? { ...doc, saved: doc.content, generation: t.generation + 1 }
          : t,
      ),
    );
    setStatus('Reloaded from disk');
  }
  const openFolderHandler = useRef(choose);
  openFolderHandler.current = choose;
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    getCurrentWindow()
      .listen('open-folder-requested', () => {
        void openFolderHandler.current();
      })
      .then((unlisten) => {
        if (disposed) unlisten();
        else cleanup = unlisten;
      })
      .catch((e) => setError(String(e)));
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  const closeHandler = useRef<() => void>(() => {});
  closeHandler.current = () =>
    void perform(async () => {
      if (await protect(tabsRef.current)) await getCurrentWindow().destroy();
    });
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    getCurrentWindow()
      .onCloseRequested((event) => {
        event.preventDefault();
        closeHandler.current();
      })
      .then((unlisten) => {
        if (disposed) unlisten();
        else cleanup = unlisten;
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [perform]);
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => {
      if (tabsRef.current.some(dirty)) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (selected) void perform(() => save(selected));
      }
      if (event.key.toLowerCase() === 'o' && !isTauri()) {
        event.preventDefault();
        void choose();
      }
      if (event.key.toLowerCase() === 'w' && selected) {
        event.preventDefault();
        void perform(() => close(active));
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  async function toggle(entry: Entry) {
    if (expanded.has(entry.path))
      setExpanded((current) => {
        const next = new Set(current);
        next.delete(entry.path);
        return next;
      });
    else {
      const entries = await invoke<Entry[]>('list_directory', {
        path: entry.path,
      });
      setTree((current) => ({ ...current, [entry.path]: entries }));
      setExpanded((current) => new Set([...current, entry.path]));
    }
  }
  function renderTree(path: string, depth = 0): React.ReactNode {
    return (tree[path] ?? [])
      .filter(
        (entry) =>
          entry.directory ||
          entry.name.toLowerCase().includes(filter.toLowerCase()),
      )
      .map((entry) => (
        <div key={entry.path}>
          <button
            disabled={busy}
            className={`tree-entry ${active === entry.path ? 'selected' : ''}`}
            style={{ paddingLeft: 16 + depth * 16 }}
            onClick={() =>
              void perform(() =>
                entry.directory ? toggle(entry) : open(entry.path),
              )
            }
            title={entry.path}
          >
            {entry.directory ? (
              expanded.has(entry.path) ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )
            ) : (
              <span className="tree-spacer" />
            )}
            {entry.directory ? <Folder size={15} /> : <FileText size={15} />}
            <span>{entry.name}</span>
            {tabs.find((t) => t.path === entry.path && dirty(t)) && (
              <i className="dirty-dot" />
            )}
          </button>
          {entry.directory &&
            expanded.has(entry.path) &&
            renderTree(entry.path, depth + 1)}
        </div>
      ));
  }
  return (
    <div className="app">
      <header className="titlebar">
        <div className="brand">
          <span className="brand-icon">
            <BookOpen size={18} />
          </span>
          SpecSpace<span className="desktop-label">DESKTOP</span>
        </div>
        <div className="workspace-title">
          {workspace
            ? workspace.split('/').at(-1)
            : 'Your ideas, clearly specified'}
        </div>
      </header>
      <div className="workspace">
        {sidebar && (
          <aside>
            <div className="sidebar-heading">
              <span>WORKSPACE</span>
              <button
                title="Refresh explorer"
                aria-label="Refresh explorer"
                disabled={!workspace || busy}
                onClick={() =>
                  void perform(async () => {
                    const paths = ['', ...expanded];
                    const results = await Promise.all(
                      paths.map(
                        async (path) =>
                          [
                            path,
                            await invoke<Entry[]>('list_directory', { path }),
                          ] as const,
                      ),
                    );
                    setTree(Object.fromEntries(results));
                  })
                }
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="folder-name">
              <FolderOpen size={17} />
              {workspace ? workspace.split('/').at(-1) : 'No folder open'}
            </div>
            <label className="filter">
              <Search size={14} />
              <input
                aria-label="Filter expanded files"
                placeholder="Filter expanded files…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </label>
            <nav className="file-tree" aria-label="Workspace files">
              {renderTree('')}
              {workspace && tree['']?.length === 0 && (
                <p className="sidebar-note">
                  No Markdown files yet. Add .md files to this folder, then
                  refresh.
                </p>
              )}
              {!workspace && (
                <p className="sidebar-note">
                  Open a folder of Markdown files to bring your project into
                  focus.
                </p>
              )}
            </nav>
            <div className="sidebar-footer">
              <span className="local-dot" /> On your Mac
              <br />
              <small>Your files stay in your folder.</small>
            </div>
          </aside>
        )}
        <main inert={busy}>
          <div className="tabbar">
            <button
              className="sidebar-toggle"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
              onClick={() => setSidebar(!sidebar)}
            >
              {sidebar ? (
                <PanelLeftClose size={17} />
              ) : (
                <PanelLeftOpen size={17} />
              )}
            </button>
            <div className="tabs" role="tablist" aria-label="Open documents">
              {tabs.map((tab) => (
                <div
                  className={`tab ${active === tab.path ? 'active' : ''}`}
                  key={tab.path}
                >
                  <button
                    role="tab"
                    aria-selected={active === tab.path}
                    onClick={() => setActive(tab.path)}
                    title={tab.path}
                  >
                    <FileText size={14} />
                    {tab.path.split('/').at(-1)}
                    {dirty(tab) && <i className="dirty-dot" />}
                  </button>
                  <button
                    disabled={busy}
                    aria-label={`Close ${tab.path}`}
                    onClick={() => void perform(() => close(tab.path))}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {!tabs.length && (
                <span className="welcome-tab">Welcome to SpecSpace</span>
              )}
            </div>
            <button
              aria-label="Open workspace"
              title="Open workspace"
              disabled={busy}
              onClick={() => void choose()}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="document-toolbar">
            <div className="breadcrumb">
              <FileText size={15} />
              {selected ? selected.path : 'A space for clear thinking'}
            </div>
            <div className="view-modes" aria-label="Editor mode">
              {(['source', 'split', 'preview'] as const).map((item) => (
                <button
                  key={item}
                  aria-pressed={mode === item}
                  className={mode === item ? 'active' : ''}
                  onClick={() => setMode(item)}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
            <button
              title="Reload from disk"
              aria-label="Reload from disk"
              disabled={!selected || busy}
              onClick={() => void perform(reload)}
            >
              <RefreshCw size={15} />
            </button>
            <button
              className="save-button"
              disabled={!selected || busy || !dirty(selected)}
              onClick={() => selected && void perform(() => save(selected))}
            >
              <Save size={15} />
              Save
            </button>
          </div>
          {error && (
            <div role="alert" className="error-banner">
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError('')}>
                <X size={15} />
              </button>
            </div>
          )}
          {selected ? (
            <div className={`document-panes ${mode}`}>
              <section className="source-pane" aria-label="Markdown source">
                <div className="pane-label">
                  MARKDOWN <span>Source of truth</span>
                </div>
                {tabs.map((tab) => (
                  <div
                    key={`${tab.path}-${tab.generation}`}
                    className="editor-container"
                    hidden={tab.path !== active}
                  >
                    <Editor
                      content={tab.content}
                      onChange={(content) =>
                        setTabs((current) =>
                          current.map((t) =>
                            t.path === tab.path ? { ...t, content } : t,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </section>
              <section className="preview-pane" aria-label="Markdown preview">
                <div className="pane-label">
                  PREVIEW <span>Live</span>
                </div>
                <Preview
                  content={selected.content}
                  onLink={(href) => {
                    const path = relativeLink(active, href);
                    if (path) void perform(() => open(path));
                    else
                      setStatus(
                        'Only workspace Markdown links are opened in this MVP.',
                      );
                  }}
                />
              </section>
            </div>
          ) : (
            <div className="welcome">
              <div className="welcome-copy">
                <div className="eyebrow">THE LOCAL SPECIFICATION WORKSPACE</div>
                <h1>
                  Make room for
                  <br />
                  clear thinking.
                </h1>
                <p>
                  Requirements, architecture, and the ideas in between.
                  <br />
                  One focused space for your Markdown.
                </p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void choose()}
                >
                  <FolderOpen size={17} />
                  Open a local folder <span>↗</span>
                </button>
                <div className="welcome-details">
                  No account. No cloud. Just your files.
                </div>
              </div>
              <div className="sample-card">
                <div className="sample-heading">
                  <FileText size={14} />
                  getting-started.md<span>PREVIEW</span>
                </div>
                <Preview content={sample} onLink={() => {}} />
              </div>
            </div>
          )}
        </main>
      </div>
      <footer className="statusbar">
        <span className="status-left">
          <span className="local-dot" />
          {busy
            ? 'Working…'
            : selected && dirty(selected)
              ? 'Unsaved changes'
              : status}
        </span>
        <span title={workspace}>{workspace || 'No workspace selected'}</span>
        <span>
          {selected
            ? `${selected.content.split(/\r\n|\r|\n/).length} lines · `
            : ''}
          Markdown · UTF-8
        </span>
      </footer>
      {prompt && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                prompt.resolve('cancel');
                setPrompt(null);
              }
              if (e.key === 'Tab') {
                const buttons = Array.from(
                  e.currentTarget.querySelectorAll('button'),
                );
                const first = buttons[0],
                  last = buttons.at(-1);
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <h2 id="dialog-title">Keep your changes?</h2>
            <p>{prompt.message}</p>
            <div className="modal-actions">
              <button
                autoFocus
                onClick={() => {
                  prompt.resolve('cancel');
                  setPrompt(null);
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  prompt.resolve('discard');
                  setPrompt(null);
                }}
              >
                Discard changes
              </button>
              {prompt.save && (
                <button
                  className="primary"
                  onClick={() => {
                    prompt.resolve('save');
                    setPrompt(null);
                  }}
                >
                  Save changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
