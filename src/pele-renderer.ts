export async function renderPeleDiagram(source: string, idPrefix: string) {
  const { renderAsync, parse } = await import('pele/lazy');
  const result = await renderAsync(source, {
    idPrefix,
    links: false,
    images: false,
  });
  let nodeIds: string[] | undefined;
  if (result.type === 'flowchart') {
    const model = parse(source);
    if (model.type === 'flowchart') {
      const containers = new Set(model.subgraphs.map((group) => group.id));
      nodeIds = Array.from(model.nodes.keys()).filter(
        (id) => !containers.has(id),
      );
    }
  }
  return { ...result, nodeIds };
}
