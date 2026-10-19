// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  act,
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
  listeners: {} as Record<string, (event: { payload: string }) => void>,
  menus: [] as { all: boolean; others: boolean }[],
  requestClose: (_event: { preventDefault: () => void }) => {},
  destroyed: false,
  failPath: '',
  writes: [] as string[],
  failScan: false,
  failSave: false,
  nextRoot: '/workspace',
  calls: [] as string[],
}));
vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => true,
  invoke: async (command: string, args: Record<string, string>) => {
    backend.calls.push(command);
    if (command === 'set_tab_menu_state') {
      backend.menus.push(args as unknown as { all: boolean; others: boolean });
      return;
    }
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
    if (command === 'open_document')
      return {
        path: args.path,
        content: backend.files[args.path],
        revision: backend.files[args.path],
      };
    if (command === 'write_document') {
      backend.writes.push(args.path);
      if (args.path === backend.failPath || backend.failSave)
        throw new Error('File changed on disk');
      backend.files[args.path] = args.content;
      return args.content;
    }
    throw new Error(command);
  },
}));
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    listen: async (
      event: string,
      handler: (event: { payload: string }) => void,
    ) => {
      backend.listeners[event] = handler;
      return () => {
        delete backend.listeners[event];
      };
    },
    onCloseRequested: async (
      handler: (event: { preventDefault: () => void }) => void,
    ) => {
      backend.requestClose = handler;
      return () => {};
    },
    destroy: async () => {
      backend.destroyed = true;
    },
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
  backend.destroyed = false;
  backend.menus = [];
  backend.writes = [];
  backend.failPath = '';
  backend.failScan = false;
  backend.failSave = false;
  backend.calls = [];
  backend.nextRoot = '/workspace';
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

async function bulk(scope: 'all' | 'others') {
  await act(async () =>
    backend.listeners['close-tabs-requested']({ payload: scope }),
  );
}
async function openB() {
  fireEvent.click(
    within(screen.getByRole('navigation')).getByRole('button', {
      name: 'b.md',
    }),
  );
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(2));
  await waitFor(() => expect(backend.menus.at(-1)?.others).toBe(true));
}
function edit(value: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Test editor' }), {
    target: { value },
  });
}
it('synchronizes zero/one/multiple menu states and keeps the dirty active tab from Connections', async () => {
  await start();
  expect(backend.menus).toContainEqual({ all: false, others: false });
  await waitFor(() =>
    expect(backend.menus.at(-1)).toEqual({ all: true, others: false }),
  );
  await bulk('others');
  expect(screen.getAllByRole('tab')).toHaveLength(1);
  await openB();
  edit('pending B');
  const editor = screen.getByRole('textbox', { name: 'Test editor' });
  await connections();
  await bulk('others');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getAllByRole('tab')).toHaveLength(1);
  expect(backend.writes).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Go to editor' }));
  expect(screen.getByRole('textbox', { name: 'Test editor' })).toBe(editor);
  expect((editor as HTMLTextAreaElement).value).toBe('pending B');
});
it('closes clean tabs without writes, keeps workspace available, and rejects repeated empty commands', async () => {
  await start();
  await openB();
  await bulk('all');
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
  expect(backend.writes).toEqual([]);
  expect(screen.getByRole('navigation')).toBeTruthy();
  await waitFor(() =>
    expect(backend.menus.at(-1)).toEqual({ all: false, others: false }),
  );
  await bulk('all');
  await bulk('others');
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('lists only dirty targets, cancels without remounting, and ignores competing commands', async () => {
  await start();
  edit('pending A');
  await openB();
  const editor = screen.getByRole('textbox', { name: 'Test editor' });
  await bulk('others');
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('a.md')).toBeTruthy();
  expect(within(dialog).queryByText('b.md')).toBeNull();
  expect(document.querySelector('.workspace')?.hasAttribute('inert')).toBe(
    true,
  );
  await bulk('all');
  fireEvent.keyDown(window, { key: 'w', metaKey: true });
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  await waitFor(() =>
    expect(document.querySelector('.workspace')?.hasAttribute('inert')).toBe(
      false,
    ),
  );
  expect(screen.getAllByRole('tab')).toHaveLength(2);
  expect(screen.getByRole('textbox', { name: 'Test editor' })).toBe(editor);
  expect(backend.writes).toEqual([]);
});
it('discards only targeted edits without writing and retains a dirty active tab', async () => {
  await start();
  edit('pending A');
  await openB();
  edit('pending B');
  await bulk('others');
  fireEvent.click(screen.getByRole('button', { name: 'Discard Changes' }));
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(1));
  expect(backend.writes).toEqual([]);
  expect(
    (
      screen.getByRole('textbox', {
        name: 'Test editor',
      }) as HTMLTextAreaElement
    ).value,
  ).toBe('pending B');
});
it('saves only dirty targets before closing the full set', async () => {
  await start();
  edit('pending A');
  await openB();
  await bulk('all');
  fireEvent.click(screen.getByRole('button', { name: 'Save All' }));
  await waitFor(() => expect(screen.queryAllByRole('tab')).toHaveLength(0));
  expect(backend.writes).toEqual(['a.md']);
  expect(backend.files['a.md']).toBe('pending A');
});
it('retains all editors after a later conflict and accurately keeps an earlier successful save', async () => {
  await start();
  edit('pending A');
  await openB();
  edit('pending B');
  const editor = screen.getByRole('textbox', { name: 'Test editor' });
  backend.failPath = 'b.md';
  await bulk('all');
  fireEvent.click(screen.getByRole('button', { name: 'Save All' }));
  await screen.findByText(/Could not save b.md/);
  expect(screen.getAllByRole('tab')).toHaveLength(2);
  expect(screen.getByRole('textbox', { name: 'Test editor' })).toBe(editor);
  expect(backend.files['a.md']).toBe('pending A');
  expect(backend.files['b.md']).toBe('# B');
  await bulk('all');
  expect(within(screen.getByRole('dialog')).queryByText('a.md')).toBeNull();
  expect(within(screen.getByRole('dialog')).getByText('b.md')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
});

it('retains existing dirty-document protection for single close, workspace switching, and normal window close', async () => {
  await start();
  edit('pending A');
  fireEvent.click(screen.getByRole('button', { name: 'Close a.md' }));
  expect(
    await screen.findByRole('button', { name: 'Save changes' }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() =>
    expect(document.querySelector('.workspace')?.hasAttribute('inert')).toBe(
      false,
    ),
  );
  const openings = backend.calls.filter(
    (command) => command === 'choose_workspace',
  ).length;
  fireEvent.click(screen.getByRole('button', { name: 'Open workspace' }));
  await screen.findByRole('dialog');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() =>
    expect(document.querySelector('.workspace')?.hasAttribute('inert')).toBe(
      false,
    ),
  );
  expect(
    backend.calls.filter((command) => command === 'choose_workspace'),
  ).toHaveLength(openings);
  const preventDefault = vi.fn();
  await act(async () => backend.requestClose({ preventDefault }));
  expect(preventDefault).toHaveBeenCalled();
  await screen.findByRole('dialog');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() =>
    expect(document.querySelector('.workspace')?.hasAttribute('inert')).toBe(
      false,
    ),
  );
  expect(backend.destroyed).toBe(false);
  expect(screen.getAllByRole('tab')).toHaveLength(1);
  expect(
    (
      screen.getByRole('textbox', {
        name: 'Test editor',
      }) as HTMLTextAreaElement
    ).value,
  ).toBe('pending A');
});

it('shows bulk close actions in the tab context menu and preserves the clicked tab', async () => {
  await start();
  await openB();
  const beta = screen.getByRole('tab', { name: 'b.md' });
  fireEvent.click(screen.getByRole('tab', { name: 'a.md' }));
  fireEvent.contextMenu(beta);
  expect(screen.getByRole('menu')).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: 'Close All Tabs' })).toBeTruthy();
  expect(
    screen.getByRole('menuitem', { name: 'Close Other Tabs' }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Close Other Tabs' }));
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(1));
  expect(screen.getByRole('tab', { name: 'b.md' })).toBeTruthy();
});
