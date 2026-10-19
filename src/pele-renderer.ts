export async function renderPeleDiagram(source: string, idPrefix: string) {
  const { renderAsync } = await import('pele/lazy');
  return renderAsync(source, {
    idPrefix,
    links: false,
    images: false,
  });
}
