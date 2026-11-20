// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ReactNode } from 'react';
import ArchitectureExplorer from '../src/c4/ArchitectureExplorer';
import { parseArchitecture } from '../src/c4/adapter';
import { layoutView } from '../src/c4/layout';

const canvas = vi.hoisted(() => ({
  fitView: vi.fn(),
  setViewport: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  getViewport: () => ({ x: 10, y: 20, zoom: 0.7 }),
}));
vi.mock('@xyflow/react', async (original) => ({
  ...(await original<typeof import('@xyflow/react')>()),
  ReactFlowProvider: ({ children }: { children: ReactNode }) => children,
  useReactFlow: () => canvas,
  ReactFlow: ({
    nodes,
    onMoveEnd,
  }: {
    nodes: { id: string; selected: boolean }[];
    onMoveEnd: (
      event: null,
      viewport: { x: number; y: number; zoom: number },
    ) => void;
  }) => (
    <div data-testid="canvas">
      {nodes.map((node) => (
        <span key={node.id} data-selected={node.selected}>
          {node.id}
        </span>
      ))}
      <button
        aria-label="Pan canvas left"
        onClick={() => onMoveEnd(null, { x: 11, y: 12, zoom: 0.6 })}
      />
      <button
        aria-label="Pan canvas right"
        onClick={() => onMoveEnd(null, { x: 21, y: 22, zoom: 0.8 })}
      />
    </div>
  ),
}));

class ParserWorker {
  static instances: ParserWorker[] = [];
  onmessage?: (event: { data: unknown }) => void;
  onerror?: () => void;
  requests: { type: string; version: number; source?: string; key?: string }[] =
    [];
  terminate = vi.fn();
  constructor() {
    ParserWorker.instances.push(this);
  }
  postMessage(request: ParserWorker['requests'][number]) {
    this.requests.push(request);
  }
  emit(data: unknown) {
    act(() => this.onmessage?.({ data }));
  }
  parsed(
    source: string,
    version = [...this.requests]
      .reverse()
      .find((request) => request.type === 'parse')!.version,
  ) {
    this.emit({ type: 'parsed', version, outcome: parseArchitecture(source) });
  }
  layout(
    source: string,
    key: string,
    version = [...this.requests]
      .reverse()
      .find((request) => request.type === 'parse')!.version,
  ) {
    const model = parseArchitecture(source).model!;
    this.emit({
      type: 'layout',
      version,
      key,
      layout: layoutView(
        model,
        model.views.find((view) => view.key === key)!,
      ),
    });
  }
}
const source = readFileSync('examples/architecture.dsl', 'utf8');
beforeEach(() => {
  vi.useFakeTimers();
  ParserWorker.instances = [];
  vi.clearAllMocks();
  vi.stubGlobal('Worker', ParserWorker);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function settle(worker: ParserWorker, content = source, key = 'landscape') {
  act(() => vi.advanceTimersByTime(180));
  worker.parsed(content);
  worker.layout(content, key);
}

it('searches distinct identities, inspects off-view endpoints, and follows child/back navigation', () => {
  const content = source
    .replace('"Reader"', '"Duplicate"')
    .replace('"Authoring agent"', '"Duplicate"');
  render(<ArchitectureExplorer content={content} visible />);
  const worker = ParserWorker.instances[0];
  settle(worker, content);
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Search architecture elements' }),
    { target: { value: 'Duplicate' } },
  );
  const search = screen.getByLabelText('Element search results');
  expect(within(search).getAllByRole('button')).toHaveLength(2);
  fireEvent.click(
    within(search).getByRole('button', { name: /softwareSystem · agent/ }),
  );
  expect(screen.getByRole('heading', { name: 'Duplicate' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /SpecSpace product/ }));
  expect(screen.getByRole('heading', { name: 'SpecSpace' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'context' }));
  worker.layout(content, 'context');
  expect(
    (
      screen.getByRole('combobox', {
        name: 'Architecture view',
      }) as HTMLSelectElement
    ).value,
  ).toBe('context');
  fireEvent.click(
    screen.getByRole('button', { name: /SpecSpace softwareSystem · product/ }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'containers' }));
  worker.layout(content, 'containers');
  fireEvent.click(
    screen.getByRole('button', { name: 'Back to previous architecture view' }),
  );
  worker.layout(content, 'context');
  expect(
    (
      screen.getByRole('combobox', {
        name: 'Architecture view',
      }) as HTMLSelectElement
    ).value,
  ).toBe('context');
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Architecture view' }),
    { target: { value: 'components' } },
  );
  worker.layout(content, 'components');
  fireEvent.click(
    screen.getByRole('button', { name: /Source editor component · editor/ }),
  );
  expect(
    screen
      .getByRole('button', { name: /Architecture explorer explorer/ })
      .hasAttribute('disabled'),
  ).toBe(false);
});

it('identifies relationship endpoints outside the declared view without navigating to them', () => {
  const content = source.replace('include *', 'include reader product');
  render(<ArchitectureExplorer content={content} visible />);
  settle(ParserWorker.instances[0], content);
  fireEvent.click(
    screen.getByRole('button', { name: /SpecSpace softwareSystem · product/ }),
  );
  const outside = screen.getByRole('button', {
    name: /Authoring agent agent · Outside this view/,
  });
  expect(outside.hasAttribute('disabled')).toBe(true);
});

it('retains invalid source as a stale diagram and ignores outdated parse and layout responses', () => {
  const ui = render(<ArchitectureExplorer content={source} visible />);
  const worker = ParserWorker.instances[0];
  settle(worker);
  const oldVersion = worker.requests[0].version;
  ui.rerender(<ArchitectureExplorer content="workspace {" visible />);
  act(() => vi.advanceTimersByTime(180));
  worker.parsed('workspace {');
  expect(screen.getByText(/Stale diagram/)).toBeTruthy();
  expect(screen.getByTestId('canvas')).toBeTruthy();
  worker.parsed(source, oldVersion);
  worker.layout(source, 'landscape', oldVersion);
  expect(screen.getByText(/Stale diagram/)).toBeTruthy();
  ui.rerender(<ArchitectureExplorer content="workspace {}" visible />);
  act(() => vi.advanceTimersByTime(180));
  worker.parsed('workspace {}');
  expect(screen.queryByTestId('canvas')).toBeNull();
  expect(
    screen.getByText('No supported architecture views are available.'),
  ).toBeTruthy();
});

it('keeps independent document selection and viewport state mounted across tab visibility changes', () => {
  const ui = render(
    <>
      <div data-testid="first">
        <ArchitectureExplorer content={source} visible />
      </div>
      <div data-testid="second">
        <ArchitectureExplorer content={source} visible={false} />
      </div>
    </>,
  );
  const [first, second] = ParserWorker.instances;
  settle(first);
  settle(second);
  fireEvent.click(
    within(screen.getByTestId('first')).getByRole('button', {
      name: /SpecSpace softwareSystem · product/,
    }),
  );
  expect(
    within(screen.getByTestId('first')).getByRole('heading', {
      name: 'SpecSpace',
    }),
  ).toBeTruthy();
  expect(
    within(screen.getByTestId('second')).queryByRole('heading', {
      name: 'SpecSpace',
    }),
  ).toBeNull();
  fireEvent.click(
    within(screen.getByTestId('first')).getByRole('button', {
      name: 'Pan canvas left',
    }),
  );
  fireEvent.click(
    within(screen.getByTestId('second')).getByRole('button', {
      name: 'Pan canvas right',
    }),
  );
  canvas.setViewport.mockClear();
  ui.rerender(
    <>
      <div data-testid="first">
        <ArchitectureExplorer content={source} visible={false} />
      </div>
      <div data-testid="second">
        <ArchitectureExplorer content={source} visible />
      </div>
    </>,
  );
  expect(ParserWorker.instances).toHaveLength(2);
  expect(first.terminate).not.toHaveBeenCalled();
  expect(
    within(screen.getByTestId('first')).getByRole('heading', {
      name: 'SpecSpace',
    }),
  ).toBeTruthy();
  act(() => vi.advanceTimersByTime(20));
  expect(canvas.setViewport).toHaveBeenLastCalledWith({
    x: 21,
    y: 22,
    zoom: 0.8,
  });
  ui.rerender(
    <>
      <div data-testid="first">
        <ArchitectureExplorer content={source} visible />
      </div>
      <div data-testid="second">
        <ArchitectureExplorer content={source} visible={false} />
      </div>
    </>,
  );
  act(() => vi.advanceTimersByTime(20));
  expect(canvas.setViewport).toHaveBeenLastCalledWith({
    x: 11,
    y: 12,
    zoom: 0.6,
  });
});
