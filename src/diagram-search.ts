/** Pele 1.6.0 adapter: documented pele-node / pele-label classes and data-id. */
export interface DiagramNode {
  id: string;
  label: string;
}
export interface DiagramEdge {
  id: string;
  start: string;
  end: string;
  type: string;
  label: string;
  kind: 'arrow' | 'two-way' | 'undirected' | 'other' | 'self';
}

export function inspectConnections(edges: DiagramEdge[], nodeId: string) {
  return edges
    .filter((edge) => edge.start === nodeId || edge.end === nodeId)
    .map((edge) => ({
      ...edge,
      kind:
        edge.start === nodeId && edge.end === nodeId
          ? 'self'
          : edge.kind === 'arrow'
            ? edge.end === nodeId
              ? 'incoming'
              : 'outgoing'
            : edge.kind,
    }));
}

export function classifyEdge(
  type: string,
  start: string,
  end: string,
): DiagramEdge['kind'] {
  if (start === end) return 'self';
  if (type === 'double_arrow_point') return 'two-way';
  if (type === 'arrow_point') return 'arrow';
  if (type === 'arrow_open') return 'undirected';
  return 'other';
}

export function normalizeSearch(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function readDiagramNodes(
  svg: SVGSVGElement,
  expectedIds: string[],
): DiagramNode[] | null {
  const groups = Array.from(
    svg.querySelectorAll<SVGGElement>('g.pele-node[data-id]'),
  );
  const expected = new Set(expectedIds);
  const seen = new Set<string>();
  const nodes: DiagramNode[] = [];
  for (const group of groups) {
    const id = group.getAttribute('data-id')!;
    if (!expected.has(id) || seen.has(id)) return null;
    seen.add(id);
    const label = Array.from(group.querySelectorAll('.pele-label'))
      .map((element) => {
        // Each tspan with a y coordinate starts a rendered line; nested spans can
        // carry emphasis, so textContent alone would join separate words/lines.
        const clone = element.cloneNode(true) as Element;
        clone
          .querySelectorAll('tspan[y],tspan[dy]')
          .forEach((line) => line.prepend(' '));
        return clone.textContent ?? '';
      })
      .join(' ')
      .trim()
      .replace(/\s+/g, ' ');
    nodes.push({ id, label: label || id });
  }
  return seen.size === expected.size ? nodes : null;
}

export function matchingNodes(
  nodes: DiagramNode[],
  query: string,
): DiagramNode[] {
  const needle = normalizeSearch(query);
  return needle
    ? nodes.filter((node) => normalizeSearch(node.label).includes(needle))
    : [];
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Viewport {
  scale: number;
  x: number;
  y: number;
}

/** Geometry is in the SVG's natural pixel coordinates, relative to its center. */
export function focusNode(
  box: Box,
  canvas: { width: number; height: number },
  currentScale: number,
): Viewport {
  const scale = Math.min(
    currentScale,
    Math.max(1, canvas.width - 64) / Math.max(1, box.width + 16),
    Math.max(1, canvas.height - 64) / Math.max(1, box.height + 16),
  );
  return {
    scale,
    x: -(box.x + box.width / 2) * scale,
    y: -(box.y + box.height / 2) * scale,
  };
}
