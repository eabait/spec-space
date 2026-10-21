import { classifyEdge } from './diagram-search';

export async function renderPeleDiagram(source: string, idPrefix: string) {
  const { renderAsync, parse } = await import('pele/lazy');
  const result = await renderAsync(source, {
    idPrefix,
    links: false,
    images: false,
  });
  let nodeIds: string[] | undefined;
  let edges:
    | Array<{
        id: string;
        start: string;
        end: string;
        type: string;
        label: string;
        kind: 'arrow' | 'two-way' | 'undirected' | 'other' | 'self';
      }>
    | undefined;
  if (result.type === 'flowchart') {
    const model = parse(source);
    if (model.type === 'flowchart') {
      const containers = new Set(model.subgraphs.map((group) => group.id));
      nodeIds = Array.from(model.nodes.keys()).filter(
        (id) => !containers.has(id),
      );
      edges = model.edges.map((edge) => ({
        id: edge.id ?? '',
        start: edge.start,
        end: edge.end,
        type: edge.type ?? '',
        label: edge.text || '',
        kind: classifyEdge(edge.type ?? '', edge.start, edge.end),
      }));
    }
  } else if (result.type === 'c4') {
    // C4 is not registered with Pele's generic parser. Use its diagram parser
    // so aliases and relationship endpoints come from the same source revision.
    const { default: c4 } = await import('pele/diagrams/c4');
    const model = c4.parse(source, {}, undefined, 0, { maxEdges: 20_000 });
    nodeIds = model.shapes.map((shape) => shape.alias);
    edges = model.rels.map((relation) => ({
      id: `${relation.from}-${relation.to}`,
      start: relation.from,
      end: relation.to,
      type: relation.type,
      label: relation.label,
      kind:
        relation.from === relation.to
          ? 'self'
          : relation.type === 'birel'
            ? 'two-way'
            : relation.type === 'rel_u'
              ? 'undirected'
              : 'arrow',
    }));
  }
  return { ...result, nodeIds, edges };
}
