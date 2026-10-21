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
  return { svg: host.querySelector('svg')!, nodeIds: result.nodeIds! };
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
  expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe(
    'true',
  );
  expect(document.querySelector('.diagram-node-highlight')).not.toBeNull();
  fireEvent.click(
    screen.getByRole('button', { name: 'Copy diagram as image' }),
  );
  await screen.findByText('Image copied');
  expect(mocks.png).toHaveBeenCalledWith(props.svg);
  expect(props.svg.outerHTML).toBe(original);
  fireEvent.change(input, { target: { value: 'Nothing' } });
  expect(document.querySelector('.diagram-node-highlight')).toBeNull();
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
