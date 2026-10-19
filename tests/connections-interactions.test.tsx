// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { App } from '../src/App';

const backend = vi.hoisted(() => ({
  files: {} as Record<string, string>,
  failScan: false,
  failSave: false,
  nextRoot: '/workspace',
  session: null as {
    record: { workspace: string; tabs: string[]; active: number | null };
    skipped: number;
  } | null,
  savedSessions: [] as unknown[],
  calls: [] as string[],
}));
vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => true,
  invoke: async (command: string, args: Record<string, any>) => {
    backend.calls.push(command);
    if (command === 'set_tab_menu_state') return;
    if (command === 'load_session') return backend.session;
    if (command === 'save_session') {
      backend.savedSessions.push(args.record);
      return;
    }
    if (command === 'restore_workspace') return args.path;
    if (command === 'choose_workspace') return backend.nextRoot;
    if (command === 'list_directory')
      return Object.keys(backend.files).map((path) => ({
        name: path,
        path,
        directory: false,
      }));
    if (command === 'workspace_snapshot') {
      if (backend.failScan) throw new Error('Scan unavailable');
      return {
        documents: Object.entries(backend.files).map(([path, content]) => ({
          path,
          content,
          revision: content,
        })),
        unavailable: [],
        complete: true,
      };
    }
    if (command === 'check_reference_targets')
      return (args.paths as unknown as string[]).map((path) => ({
        path,
        status: 'missing',
        canonical: null,
      }));
    if (command === 'open_document') {
      if (!(args.path in backend.files)) throw new Error('Missing document');
      return {
        path: args.path,
        content: backend.files[args.path],
        revision: backend.files[args.path],
      };
    }
    if (command === 'write_document') {
      if (backend.failSave) throw new Error('File changed on disk');
      backend.files[args.path] = args.content;
      return args.content;
    }
    throw new Error(command);
  },
}));
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    listen: async () => () => {},
    onCloseRequested: async () => () => {},
  }),
}));
vi.mock('../src/Editor', () => ({
  Editor: ({
    content,
    onChange,
  }: {
    content: string;
    onChange: (text: string) => void;
  }) => (
    <textarea
      aria-label="Test editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock('../src/Preview', () => ({ Preview: () => <div>Preview</div> }));
afterEach(cleanup);
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  backend.files = { 'a.md': '# A\n[B](b.md)', 'b.md': '# B' };
  backend.failScan = false;
  backend.failSave = false;
  backend.calls = [];
  backend.nextRoot = '/workspace';
  backend.session = null;
  backend.savedSessions = [];
});
async function start() {
  render(<App />);
  await waitFor(() =>
    expect(
      screen
        .getByRole('button', { name: /Open a local folder/ })
        .hasAttribute('disabled'),
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole('button', { name: /Open a local folder/ }));
  await waitFor(() =>
    expect(
      screen
        .getByRole('button', { name: 'Connections' })
        .hasAttribute('disabled'),
    ).toBe(false),
  );
  fireEvent.click(
    within(screen.getByRole('navigation')).getByRole('button', {
      name: 'a.md',
    }),
  );
  await screen.findByRole('textbox', { name: 'Test editor' });
}
async function connections() {
  fireEvent.click(screen.getByRole('button', { name: 'Connections' }));
  await screen.findByRole('heading', { name: 'Explore your documents' });
}
it('keeps dirty editor buffers mounted across graph navigation and external refresh, then updates after save', async () => {
  await start();
  const editor = screen.getByRole('textbox', { name: 'Test editor' });
  fireEvent.change(editor, { target: { value: '# A\n[Missing](missing.md)' } });
  await connections();
  expect(screen.getByText(/This document has unsaved edits/)).toBeTruthy();
  fireEvent.keyDown(
    screen.getByRole('button', { name: 'Open b.md from graph' }),
    { key: 'Enter' },
  );
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(2));
  expect(
    within(
      screen.getByRole('region', { name: 'Connected specifications' }),
    ).getByRole('heading', { name: 'Backlinks 1' }),
  ).toBeTruthy();
  backend.files['b.md'] = '# B\n[A](a.md)';
  fireEvent.click(screen.getByRole('button', { name: 'Refresh connections' }));
  await screen.findByText('2 documents · 2 references · 0 broken');
  fireEvent.click(screen.getByRole('button', { name: 'Open a.md from graph' }));
  await waitFor(() =>
    expect(screen.getByText(/This document has unsaved edits/)).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Go to editor' }));
  expect(screen.getByRole('textbox', { name: 'Test editor' })).toBe(editor);
  expect((editor as HTMLTextAreaElement).value).toContain('missing.md');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(backend.files['a.md']).toContain('missing.md'));
  await waitFor(() =>
    expect(
      screen
        .getByRole('button', { name: 'Connections' })
        .hasAttribute('disabled'),
    ).toBe(false),
  );
  await connections();
  expect(
    screen.getByText('2 documents · 1 references · 1 broken'),
  ).toBeTruthy();
  expect(screen.getByText('Missing: missing.md')).toBeTruthy();
});
it('does not refresh after a failed save and labels a failed scan as stale without undoing a successful save', async () => {
  await start();
  fireEvent.change(screen.getByRole('textbox', { name: 'Test editor' }), {
    target: { value: 'new saved content' },
  });
  const scanCount = backend.calls.filter(
    (c) => c === 'workspace_snapshot',
  ).length;
  backend.failSave = true;
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText(/File changed on disk/);
  expect(backend.calls.filter((c) => c === 'workspace_snapshot')).toHaveLength(
    scanCount,
  );
  expect(backend.files['a.md']).toContain('[B]');
  backend.failSave = false;
  backend.failScan = true;
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(
      screen
        .getByRole('button', { name: 'Connections' })
        .hasAttribute('disabled'),
    ).toBe(false),
  );
  await connections();
  expect(screen.getByText(/Connections are stale/)).toBeTruthy();
  expect(backend.files['a.md']).toBe('new saved content');
  backend.failScan = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('2 documents · 0 references · 0 broken');
});
it('clears connections when switching workspaces and rebuilds when reopening', async () => {
  await start();
  await connections();
  backend.files = {};
  backend.nextRoot = '/empty';
  fireEvent.click(screen.getByRole('button', { name: 'Open workspace' }));
  await screen.findByRole('heading', {
    name: 'No Markdown documents to connect',
  });
  expect(
    screen.queryByRole('button', { name: 'Open a.md from graph' }),
  ).toBeNull();
  backend.files = { 'new.md': '# New' };
  backend.nextRoot = '/new';
  fireEvent.click(screen.getByRole('button', { name: 'Open workspace' }));
  await screen.findByRole('button', { name: 'Open new.md from graph' });
  expect(
    screen.queryByRole('button', { name: 'Open a.md from graph' }),
  ).toBeNull();
});

it('restores valid session tabs from current disk content in order and saves navigation metadata only', async () => {
  backend.session = {
    record: {
      workspace: '/workspace',
      tabs: ['b.md', 'missing.md', 'a.md'],
      active: 2,
    },
    skipped: 1,
  };
  backend.files = { 'a.md': '# A current', 'b.md': '# B current' };
  render(<App />);

  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(2));
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
    'b.md',
    'a.md',
  ]);
  expect(
    (
      screen.getByRole('textbox', {
        name: 'Test editor',
      }) as HTMLTextAreaElement
    ).value,
  ).toBe('# A current');
  expect(screen.getByText(/2 unavailable documents skipped/)).toBeTruthy();
  await waitFor(() => expect(backend.savedSessions.length).toBeGreaterThan(0));
  expect(backend.savedSessions.at(-1)).toEqual({
    workspace: '/workspace',
    tabs: ['b.md', 'a.md'],
    active: 1,
  });
  expect(JSON.stringify(backend.savedSessions)).not.toContain('# B current');
});
