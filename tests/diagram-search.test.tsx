// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import DOMPurify from 'dompurify';
import { renderPeleDiagram } from '../src/pele-renderer';
import {
  focusNode,
  matchingNodes,
  readDiagramNodes,
} from '../src/diagram-search';
import { DiagramFocusView } from '../src/DiagramFocusView';

const mocks = vi.hoisted(() => ({
  png: vi.fn().mockResolvedValue([1, 2, 3]),
  invoke: vi.fn().mockResolvedValue(true),
}));
vi.mock('../src/diagram-image', () => ({ diagramPng: mocks.png }));
vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => true,
  invoke: mocks.invoke,
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function fixture(
  source = 'flowchart LR\n A[Billing]-->B[Billing]\n C["Multi<br/>line"]-->D',
) {
  const result = await renderPeleDiagram(source, 'search-test');
  const host = document.createElement('div');
  host.innerHTML = DOMPurify.sanitize(result.svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['a', 'image', 'foreignObject'],
  });
  return {
    svg: host.querySelector('svg')!,
    nodeIds: result.nodeIds!,
    edges: result.edges!,
  };
}
it('maps sanitized duplicate, multiline and implicit labels by source identity', async () => {
  const { svg, nodeIds } = await fixture();
  const nodes = readDiagramNodes(svg, nodeIds)!;
  expect(matchingNodes(nodes, '  BILL ')).toEqual([
    { id: 'A', label: 'Billing' },
    { id: 'B', label: 'Billing' },
  ]);
  expect(matchingNodes(nodes, 'multi   line')).toEqual([
    { id: 'C', label: 'Multi line' },
  ]);
  expect(nodes.at(-1)).toEqual({ id: 'D', label: 'D' });
  expect(matchingNodes(nodes, ' ')).toEqual([]);
  expect(matchingNodes(nodes, 'missing')).toEqual([]);
});
it('excludes nested containers and edges and fails closed for an incomplete mapping', async () => {
  const { svg, nodeIds } = await fixture(
    'flowchart LR\n subgraph outer[Outside]\n subgraph inner[Inside]\n A[Node]-->B\n end\n end\n B-->|edge word|C\n style A fill:#f9f',
  );
  const nodes = readDiagramNodes(svg, nodeIds)!;
  expect(nodes.map((n) => n.id)).toEqual(['A', 'B', 'C']);
  expect(matchingNodes(nodes, 'Inside')).toEqual([]);
  expect(matchingNodes(nodes, 'edge word')).toEqual([]);
  svg.querySelector('.pele-node')!.remove();
  expect(readDiagramNodes(svg, nodeIds)).toBeNull();
});
it('isolates identical IDs across diagrams and changed source revisions', async () => {
  const first = await fixture('flowchart LR\n A[Before]-->B');
  const second = await fixture('flowchart LR\n A[After]-->C');
  expect(readDiagramNodes(first.svg, first.nodeIds)![0].label).toBe('Before');
  expect(readDiagramNodes(second.svg, second.nodeIds)![0].label).toBe('After');
  expect(readDiagramNodes(first.svg, second.nodeIds)).toBeNull();
});
it('centers a target without zooming in and fits an oversized node', () => {
  const small = focusNode(
    { x: 300, y: 50, width: 40, height: 20 },
    { width: 600, height: 400 },
    0.8,
  );
  expect(small).toEqual({ scale: 0.8, x: -256, y: -48 });
  const large = focusNode(
    { x: -100, y: 0, width: 1200, height: 500 },
    { width: 600, height: 400 },
    1,
  );
  expect(large.scale).toBeLessThan(1);
  expect((1200 + 16) * large.scale).toBeLessThanOrEqual(536);
  expect(large.x + (-100 + 600) * large.scale).toBe(0);
});
it('classifies edge direction only from explicit endpoint styles', async () => {
  const { classifyEdge, inspectConnections } =
    await import('../src/diagram-search');
  const edge = (id: string, type: string, start: string, end: string) => ({
    id,
    type,
    start,
    end,
    label: '',
    kind: classifyEdge(type, start, end),
  });
  const edges = [
    edge('in', 'arrow_point', 'A', 'B'),
    edge('out', 'arrow_point', 'B', 'C'),
    edge('both', 'double_arrow_point', 'C', 'B'),
    edge('line', 'arrow_open', 'D', 'B'),
    edge('unknown', 'dotted', 'B', 'E'),
    edge('loop', 'arrow_point', 'B', 'B'),
  ];
  expect(
    inspectConnections(edges, 'B').map(({ id, kind }) => [id, kind]),
  ).toEqual([
    ['in', 'incoming'],
    ['out', 'outgoing'],
    ['both', 'two-way'],
    ['line', 'undirected'],
    ['unknown', 'other'],
    ['loop', 'self'],
  ]);
});
it('selects clicked nodes and preserves the selection through the captured click', async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const box = this.classList.contains('pele-node')
        ? { x: 100, y: 80, width: 70, height: 40 }
        : { x: 0, y: 0, width: 700, height: 450 };
      return {
        ...box,
        left: box.x,
        top: box.y,
        right: box.x + box.width,
        bottom: box.y + box.height,
        toJSON: () => box,
      } as DOMRect;
    },
  );
  const props = await fixture();
  render(<DiagramFocusView {...props} title="Diagram" onClose={() => {}} />);
  const stage = screen.getByLabelText('Diagram canvas');
  const group = stage.querySelector<SVGGElement>('g.pele-node[data-id="A"]')!;
  const art = stage.querySelector<HTMLElement>('.diagram-focus-art')!;
  const fittedTransform = art.style.transform;
  fireEvent.pointerDown(group, {
    button: 0,
    pointerId: 1,
    clientX: 120,
    clientY: 100,
  });
  fireEvent.pointerUp(stage, {
    button: 0,
    pointerId: 1,
    clientX: 120,
    clientY: 100,
  });
  fireEvent.click(stage);
  expect(screen.getAllByText('Billing').length).toBeGreaterThan(0);
  expect(screen.getByText('A')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Node details' })).toBeTruthy();
  expect(art.style.transform).toBe(fittedTransform);
});
it('inspects connected C4 containers and follows their relationships', async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const box = this.classList.contains('pele-node')
        ? { x: 100, y: 80, width: 70, height: 40 }
        : { x: 0, y: 0, width: 700, height: 450 };
      return {
        ...box,
        left: box.x,
        top: box.y,
        right: box.x + box.width,
        bottom: box.y + box.height,
        toJSON: () => box,
      } as DOMRect;
    },
  );
  const props = await fixture(
    'C4Container\nPerson(user, "User", "A person")\nContainer(api, "API", "Node", "Service")\nContainerDb(db, "Database", "Postgres", "Storage")\nRel(user, api, "calls")\nBiRel(api, db, "reads and writes")',
  );
  render(<DiagramFocusView {...props} title="C4 diagram" onClose={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Node details' }));

  const stage = screen.getByLabelText('Diagram canvas');
  const node = stage.querySelector<SVGGElement>('g.pele-node[data-id="api"]')!;
  fireEvent.pointerDown(node, {
    button: 0,
    pointerId: 2,
    clientX: 120,
    clientY: 100,
  });
  fireEvent.pointerUp(stage, {
    button: 0,
    pointerId: 2,
    clientX: 120,
    clientY: 100,
  });
  fireEvent.click(stage);

  expect(screen.getByText('Incoming · 1')).toBeTruthy();
  expect(screen.getByText('Two-way · 1')).toBeTruthy();
  expect(screen.getByRole('button', { name: /User.*calls/ })).toBeTruthy();
  expect(
    screen.getByRole('button', { name: /Database.*reads and writes/ }),
  ).toBeTruthy();
  expect(document.querySelectorAll('.inspection-edge').length).toBeGreaterThan(
    0,
  );
  fireEvent.click(
    screen.getByRole('button', { name: /Database.*reads and writes/ }),
  );
  expect(screen.getAllByText('Two-way · 1').length).toBeGreaterThan(0);
  expect(
    document.querySelector('.inspection-selected')?.getAttribute('data-id'),
  ).toBe('db');
});
it('search keyboard activates only on Enter, clears highlighting, and exports pristine SVG', async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const box = this.classList.contains('pele-node')
        ? { x: 100, y: 80, width: 70, height: 40 }
        : { x: 0, y: 0, width: 700, height: 450 };
      return {
        ...box,
        left: box.x,
        top: box.y,
        right: box.x + box.width,
        bottom: box.y + box.height,
        toJSON: () => box,
      } as DOMRect;
    },
  );
  const props = await fixture();
  const original = props.svg.outerHTML;
  const close = vi.fn();
  render(
    <DiagramFocusView
      {...props}
      title="design.md · Diagram 1"
      onClose={close}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Find node' }));
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'Billing' } });
  expect(screen.getAllByRole('option')).toHaveLength(2);
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  expect(document.querySelector('.diagram-node-highlight')).toBeNull();
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(screen.getByRole('region', { name: 'Node details' })).toBeTruthy();
  expect(document.querySelector('.inspection-selected')).not.toBeNull();
  expect(screen.getByText('Outgoing · 1')).toBeTruthy();
  const connectedNode = screen.getByRole('button', {
    name: /Billing.*B · No label/,
  });
  fireEvent.click(connectedNode);
  expect(screen.getByText('Incoming · 1')).toBeTruthy();
  expect(
    document.querySelector('.inspection-selected')?.getAttribute('data-id'),
  ).toBe('B');
  fireEvent.click(
    screen.getByRole('button', { name: 'Copy diagram as image' }),
  );
  await screen.findByText('Image copied');
  expect(mocks.png).toHaveBeenCalledWith(props.svg);
  expect(props.svg.outerHTML).toBe(original);
  fireEvent.click(screen.getByRole('button', { name: 'Find node' }));
  expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe(
    'Billing',
  );
  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: 'Nothing' },
  });
  expect(document.querySelector('.inspection-selected')).toBeNull();
  expect(screen.getByText('No matching nodes')).toBeTruthy();
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { cancelable: true }),
  );
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(close).not.toHaveBeenCalled();
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { cancelable: true }),
  );
  expect(close).toHaveBeenCalledOnce();
});
it('keeps unsupported diagram viewing available without search', async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  const { svg } = await fixture('sequenceDiagram\n Alice->>Bob: Hello');
  render(<DiagramFocusView svg={svg} title="Sequence" onClose={() => {}} />);
  expect(screen.queryByRole('button', { name: 'Find node' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Fit diagram' })).toBeTruthy();
});
