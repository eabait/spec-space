import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  Network,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  ListTree,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Save,
  Search,
  X,
} from 'lucide-react';
import type { RefObject } from 'react';
import { Editor, type EditorHandle } from './Editor';
import { Preview, type PreviewHandle } from './Preview';
import { extractOutline, type OutlineSection } from './outline';
import { relativeLink } from './text';
import { useConnections } from './useConnections';
import { ConnectionsView } from './ConnectionsView';
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
interface SessionRecord {
  workspace: string;
  tabs: string[];
  active: number | null;
}
interface LoadedSession {
  record: SessionRecord;
  skipped: number;
}
type Choice = 'save' | 'discard' | 'cancel';
const sample =
  '# A clearer space for your specifications\n\nOpen a local folder to start working. Your Markdown stays yours.\n\n## Built for technical thinking\n\n- Edit source without changing its format\n- Keep architecture and requirements side by side\n- Preview diagrams as you write\n\n```mermaid\nflowchart LR\n  A[Local files] --> B[Markdown editor]\n  B --> C[Live preview]\n```\n\n> Local files. Focused editing. No account required.\n';
function BlueprintMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
    >
      <path
        d="M16 5h8v8h-8zM5 25h9v9H5zM26 25h9v9h-9z"
        fill="currentColor"
        opacity=".96"
      />
      <path
        d="M18 13 11 24m11-11 7 11"
        stroke="#d99a61"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12V3h9m16 0h9v9m0 16v9h-9M12 37H3v-9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".62"
      />
    </svg>
  );
}

function OutlineList({
  sections,
  onNavigate,
  firstItemRef,
  depth = 0,
}: {
  sections: OutlineSection[];
  onNavigate: (section: OutlineSection) => void;
  firstItemRef: RefObject<HTMLButtonElement | null>;
  depth?: number;
}) {
  return (
    <ul className="outline-list">
      {sections.map((section, index) => (
        <li key={section.offset}>
          <button
            ref={depth === 0 && index === 0 ? firstItemRef : undefined}
            aria-label={`Heading level ${section.level}: ${section.title || 'Untitled heading'}`}
            onClick={() => onNavigate(section)}
          >
            <span aria-hidden="true" className="outline-level">
              H{section.level}
            </span>
            <span>{section.title || 'Untitled heading'}</span>
          </button>
          {section.children.length > 0 && (
            <OutlineList
              sections={section.children}
              onNavigate={onNavigate}
              firstItemRef={firstItemRef}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function App() {
  const [workspace, setWorkspace] = useState('');
  const connections = useConnections();
  const [showConnections, setShowConnections] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [tree, setTree] = useState<Record<string, Entry[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [tabs, setTabs] = useState<Tab[]>([]);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const [active, setActive] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const sessionWrite = useRef(Promise.resolve());
  const refreshConnections = useRef(connections.refresh);
  refreshConnections.current = connections.refresh;
  const [mode, setMode] = useState<'source' | 'split' | 'preview'>('split');
  const [compactLayout, setCompactLayout] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Local-first workspace');
  const [tabMenu, setTabMenu] = useState<{
    x: number;
    y: number;
    path: string;
  } | null>(null);
  const [prompt, setPrompt] = useState<{
    message: string;
    resolve: (choice: Choice) => void;
    save: boolean;
    paths?: string[];
  } | null>(null);
  const outlineButtonRef = useRef<HTMLButtonElement>(null);
  const outlineCloseRef = useRef<HTMLButtonElement>(null);
  const outlineFirstItemRef = useRef<HTMLButtonElement>(null);
  const editorRefs = useRef(new Map<string, EditorHandle>());
  const editorRefCallbacks = useRef(
    new Map<string, (handle: EditorHandle | null) => void>(),
  );
  const previewRef = useRef<PreviewHandle>(null);
  const selected = tabs.find((t) => t.path === active);
  const outline = useMemo(
    () => (selected ? extractOutline(selected.content) : []),
    [selected?.content],
  );
  const visibleMode = compactLayout && mode === 'split' ? 'preview' : mode;
  function editorRefFor(path: string) {
    let callback = editorRefCallbacks.current.get(path);
    if (!callback) {
      callback = (handle) => {
        if (handle) editorRefs.current.set(path, handle);
        else editorRefs.current.delete(path);
      };
      editorRefCallbacks.current.set(path, callback);
    }
    return callback;
  }
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
  function closeOutline() {
    setShowOutline(false);
    requestAnimationFrame(() => outlineButtonRef.current?.focus());
  }
  function navigateToSection(section: OutlineSection) {
    if (visibleMode === 'source' || visibleMode === 'split')
      editorRefs.current.get(active)?.navigateToLine(section.line);
    if (visibleMode === 'preview' || visibleMode === 'split')
      previewRef.current?.scrollToOffset(section.offset);
  }
  useEffect(() => {
    if (!showOutline) return;
    const focusFrame = requestAnimationFrame(() => {
      (outlineFirstItemRef.current ?? outlineCloseRef.current)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeOutline();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showOutline]);
  useEffect(() => {
    const updateLayout = () => setCompactLayout(window.innerWidth <= 1100);
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);
  useEffect(() => {
    if (!isTauri()) {
      setSessionReady(true);
      return;
    }
    setBusy(true);
    setStatus('Restoring previous session…');
    let disposed = false;
    void (async () => {
      try {
        const loaded = await invoke<LoadedSession | null>('load_session');
        if (disposed) return;
        if (!loaded) return;
        const record = loaded.record;
        let root: string;
        try {
          root = await invoke<string>('restore_workspace', {
            path: record.workspace,
          });
        } catch {
          setStatus('The previous workspace is unavailable. Open it again.');
          return;
        }
        const entries = await invoke<Entry[]>('list_directory', { path: '' });
        if (disposed) return;
        setWorkspace(root);
        setTree({ '': entries });
        const opened: Tab[] = [];
        let skipped = loaded.skipped;
        for (const path of record.tabs) {
          try {
            const document = await invoke<Document>('open_document', { path });
            opened.push({
              ...document,
              saved: document.content,
              generation: 0,
            });
          } catch {
            skipped += 1;
          }
        }
        if (disposed) return;
        setTabs(opened);
        const requestedActive =
          record.active === null ? undefined : record.tabs[record.active];
        setActive(
          opened.find((tab) => tab.path === requestedActive)?.path ??
            opened[0]?.path ??
            '',
        );
        await refreshConnections.current();
        setStatus(
          skipped
            ? `Session restored; ${skipped} unavailable document${skipped === 1 ? '' : 's'} skipped.`
            : 'Session restored',
        );
      } catch (e) {
        if (!disposed)
          setStatus(`Could not restore the previous session: ${String(e)}`);
      } finally {
        if (!disposed) {
          setSessionReady(true);
          setBusy(false);
        }
      }
    })();
    return () => {
      disposed = true;
    };
  }, []);
  useEffect(() => {
    if (!sessionReady || !isTauri() || !workspace) return;
    const record: SessionRecord = {
      workspace,
      tabs: tabs.map((tab) => tab.path),
      active:
        tabs.findIndex((tab) => tab.path === active) >= 0
          ? tabs.findIndex((tab) => tab.path === active)
          : null,
    };
    sessionWrite.current = sessionWrite.current
      .catch(() => undefined)
      .then(() => invoke<void>('save_session', { record }))
      .catch((e) => setStatus(`Could not save session: ${String(e)}`));
  }, [workspace, tabs, active, sessionReady]);
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
    await connections.refresh();
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
      connections.reset();
      setWorkspace(root);
      setTabs([]);
      setActive('');
      setTree({});
      setExpanded(new Set());
      setFilter('');
      setTree({ '': await invoke<Entry[]>('list_directory', { path: '' }) });
      setStatus('Workspace opened');
      await connections.refresh();
    });
  async function open(path: string, keepConnections = false) {
    setShowConnections(keepConnections);
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
  async function createDocument() {
    if (!isTauri()) {
      setError(
        'Run the desktop app to create documents inside a local workspace.',
      );
      return;
    }
    if (!workspace) {
      setError('Open a workspace first.');
      return;
    }
    await invoke('create_markdown_document');
  }
  async function handleCreated(result: {
    kind: 'Created' | 'ExistingMarkdown';
    path: string;
  }) {
    if (result.kind === 'ExistingMarkdown') {
      if (window.confirm(`${result.path} already exists. Open it?`))
        await open(result.path);
      return;
    }
    const parent = result.path.includes('/')
      ? result.path.slice(0, result.path.lastIndexOf('/'))
      : '';
    const refreshPaths = ['', ...expanded].filter(
      (path) => path === '' || path === parent,
    );
    const refreshed = await Promise.allSettled(
      refreshPaths.map(
        async (path) =>
          [path, await invoke<Entry[]>('list_directory', { path })] as const,
      ),
    );
    setTree((current) => ({
      ...current,
      ...Object.fromEntries(
        refreshed.flatMap((item) =>
          item.status === 'fulfilled' ? [item.value] : [],
        ),
      ),
    }));
    if (parent) setExpanded((current) => new Set([...current, parent]));
    await open(result.path);
    await connections.refresh();
    setStatus(`Created ${result.path}`);
  }
  async function closeTabs(scope: 'all' | 'others', keepPath = active) {
    const current = tabsRef.current;
    if (scope === 'others' && !current.some((tab) => tab.path === keepPath))
      return;
    const targets = current.filter(
      (tab) => scope === 'all' || tab.path !== keepPath,
    );
    if (!targets.length) return;
    const changed = targets.filter(dirty);
    if (changed.length) {
      const choice = await new Promise<Choice>((resolve) =>
        setPrompt({
          message: 'These documents have unsaved changes.',
          paths: changed.map((tab) => tab.path),
          save: true,
          resolve,
        }),
      );
      if (choice === 'cancel') return;
      if (choice === 'save') {
        for (const tab of changed) {
          try {
            await save(tab);
          } catch (error) {
            throw new Error(
              `Could not save ${tab.path}: ${String(error)}. All tabs remain open; any earlier successful saves are kept.`,
            );
          }
        }
      }
    }
    const paths = new Set(targets.map((tab) => tab.path));
    setTabs((current) => current.filter((tab) => !paths.has(tab.path)));
    if (scope === 'all') setActive('');
    else setActive(keepPath);
    setStatus(scope === 'all' ? 'All tabs closed' : 'Other tabs closed');
  }
  const bulkCloseHandler = useRef(closeTabs);
  bulkCloseHandler.current = closeTabs;
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    getCurrentWindow()
      .listen<'all' | 'others'>('close-tabs-requested', (event) => {
        if (event.payload === 'all' || event.payload === 'others')
          void perform(() => bulkCloseHandler.current(event.payload));
      })
      .then((unlisten) => {
        if (disposed) unlisten();
        else cleanup = unlisten;
      })
      .catch((error) => setError(String(error)));
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [perform]);
  const menuUpdates = useRef(Promise.resolve());
  useEffect(() => {
    if (!isTauri()) return;
    const all = !busy && tabs.length > 0;
    const others =
      all && tabs.length > 1 && tabs.some((tab) => tab.path === active);
    menuUpdates.current = menuUpdates.current
      .then(() => invoke<void>('set_tab_menu_state', { all, others }))
      .catch((error) =>
        setError(`Could not update tab menu: ${String(error)}`),
      );
  }, [busy, tabs.length, active]);
  useEffect(() => {
    const dismiss = () => setTabMenu(null);
    window.addEventListener('click', dismiss);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('click', dismiss);
      window.removeEventListener('resize', dismiss);
    };
  }, []);
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
    await connections.refresh();
  }
  const openFolderHandler = useRef(choose);
  openFolderHandler.current = choose;
  const newDocumentHandler = useRef(createDocument);
  newDocumentHandler.current = createDocument;
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
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    getCurrentWindow()
      .listen('new-document-requested', () => {
        void perform(() => newDocumentHandler.current());
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
  }, [perform]);
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    getCurrentWindow()
      .listen<{
        result: { kind: 'Created' | 'ExistingMarkdown'; path: string } | null;
        error: string | null;
      }>('new-document-result', (event) => {
        if (event.payload.error) {
          setError(event.payload.error);
          return;
        }
        if (event.payload.result)
          void perform(() => handleCreated(event.payload.result!));
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
  }, [perform]);
  const closeHandler = useRef<() => void>(() => {});
  closeHandler.current = () =>
    void perform(async () => {
      if (!(await protect(tabsRef.current))) return;
      if (workspace) {
        const currentTabs = tabsRef.current;
        const record: SessionRecord = {
          workspace,
          tabs: currentTabs.map((tab) => tab.path),
          active:
            currentTabs.findIndex((tab) => tab.path === active) >= 0
              ? currentTabs.findIndex((tab) => tab.path === active)
              : null,
        };
        sessionWrite.current = sessionWrite.current
          .catch(() => undefined)
          .then(() => invoke<void>('save_session', { record }))
          .catch((e) => setStatus(`Could not save session: ${String(e)}`));
        await sessionWrite.current;
      }
      await getCurrentWindow().destroy();
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
      <header className="titlebar" inert={busy}>
        <div className="brand">
          <span className="brand-icon">
            <BlueprintMark size={22} />
          </span>
          SpecSpace<span className="desktop-label">DESKTOP</span>
        </div>
        <div className="workspace-title">
          {workspace
            ? workspace.split('/').at(-1)
            : 'Your ideas, clearly specified'}
        </div>
        <button
          className="workspace-action"
          aria-label="Open workspace"
          title="Open workspace"
          disabled={busy}
          onClick={() => void choose()}
        >
          <FolderOpen size={16} />
          Open workspace
        </button>
        <button
          className={`connections-toggle ${showConnections ? 'active' : ''}`}
          disabled={!workspace || busy}
          aria-pressed={showConnections}
          onClick={() => {
            setShowOutline(false);
            setShowConnections((value) => !value);
          }}
        >
          <Network size={16} />
          {showConnections ? 'Back to editor' : 'Connections'}
        </button>
      </header>
      <div className="workspace" inert={busy}>
        {sidebar && (
          <aside>
            <div className="sidebar-heading">
              <span>WORKSPACE</span>
              <button
                className="new-document-button"
                title="New Markdown document"
                aria-label="New Markdown document"
                disabled={!workspace || busy}
                onClick={() => void perform(createDocument)}
              >
                <Plus size={14} />
                <span>New</span>
              </button>
              <button
                title="Refresh workspace"
                aria-label="Refresh workspace"
                disabled={!workspace || busy}
                onClick={() =>
                  void perform(async () => {
                    await connections.refresh();
                    const paths = ['', ...expanded];
                    const results = await Promise.allSettled(
                      paths.map(
                        async (path) =>
                          [
                            path,
                            await invoke<Entry[]>('list_directory', { path }),
                          ] as const,
                      ),
                    );
                    setTree(
                      Object.fromEntries(
                        results.flatMap((result) =>
                          result.status === 'fulfilled' ? [result.value] : [],
                        ),
                      ),
                    );
                    const failure = results.find(
                      (result) => result.status === 'rejected',
                    );
                    if (failure?.status === 'rejected')
                      setError(String(failure.reason));
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
                    onMouseDown={(event) => {
                      if (event.button !== 2) return;
                      event.preventDefault();
                      event.stopPropagation();
                      setTabMenu({
                        x: event.clientX,
                        y: event.clientY,
                        path: tab.path,
                      });
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setTabMenu({
                        x: event.clientX,
                        y: event.clientY,
                        path: tab.path,
                      });
                    }}
                    onAuxClick={(event) => {
                      if (event.button !== 2) return;
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={() => {
                      setActive(tab.path);
                      setShowConnections(false);
                    }}
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
          </div>
          <div className="document-toolbar" hidden={showConnections}>
            <div className="breadcrumb">
              <FileText size={15} />
              {selected ? selected.path : 'A space for clear thinking'}
            </div>
            <button
              ref={outlineButtonRef}
              className={`outline-toggle ${showOutline ? 'active' : ''}`}
              aria-label="Outline"
              aria-expanded={showOutline}
              aria-controls="document-outline"
              disabled={!selected || busy}
              onClick={() => setShowOutline((value) => !value)}
            >
              <ListTree size={15} />
              Outline
            </button>
            <div className="view-modes" aria-label="Editor mode">
              {(['source', 'split', 'preview'] as const)
                .filter((item) => !compactLayout || item !== 'split')
                .map((item) => (
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
          {showConnections && (
            <ConnectionsView
              index={connections.index}
              selected={active}
              dirty={!!selected && dirty(selected)}
              loading={connections.loading}
              error={connections.error}
              onRefresh={() => void perform(connections.refresh)}
              onOpen={(path) => void perform(() => open(path, true))}
              onEdit={() => setShowConnections(false)}
            />
          )}
          <div className="editor-workspace" hidden={showConnections}>
            {selected ? (
              <div className={`document-panes ${visibleMode}`}>
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
                        ref={editorRefFor(tab.path)}
                        content={tab.content}
                        canEdit={() => !lock.current}
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
                    ref={previewRef}
                    content={selected.content}
                    filename={selected.path.split('/').at(-1)}
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
                  <div className="eyebrow">
                    THE LOCAL SPECIFICATION WORKSPACE
                  </div>
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
            {selected && showOutline && (
              <section
                id="document-outline"
                className="outline-panel"
                role="dialog"
                aria-labelledby="outline-title"
              >
                <header>
                  <h2 id="outline-title">On this page</h2>
                  <button
                    ref={outlineCloseRef}
                    aria-label="Close outline"
                    onClick={closeOutline}
                  >
                    <X size={15} />
                  </button>
                </header>
                {outline.length ? (
                  <nav aria-label="Document sections">
                    <OutlineList
                      sections={outline}
                      onNavigate={navigateToSection}
                      firstItemRef={outlineFirstItemRef}
                    />
                  </nav>
                ) : (
                  <p className="outline-empty">No headings in this document.</p>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
      {tabMenu && (
        <div
          className="tab-context-menu"
          role="menu"
          style={{ left: tabMenu.x, top: tabMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            role="menuitem"
            disabled={busy || tabs.length === 0}
            onClick={() => {
              setTabMenu(null);
              void perform(() => closeTabs('all'));
            }}
          >
            Close All Tabs
          </button>
          <button
            role="menuitem"
            disabled={busy || tabs.length < 2}
            onClick={() => {
              setTabMenu(null);
              void perform(() => closeTabs('others', tabMenu.path));
            }}
          >
            Close Other Tabs
          </button>
        </div>
      )}
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
            {prompt.paths && (
              <ul
                className="pending-paths"
                aria-label="Documents with unsaved changes"
              >
                {prompt.paths.map((path) => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
            )}
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
                {prompt.paths ? 'Discard Changes' : 'Discard changes'}
              </button>
              {prompt.save && (
                <button
                  className="primary"
                  onClick={() => {
                    prompt.resolve('save');
                    setPrompt(null);
                  }}
                >
                  {prompt.paths ? 'Save All' : 'Save changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
