// @vitest-environment jsdom
import { expect, it } from 'vitest';
import DOMPurify from 'dompurify';
import { renderPeleDiagram } from '../src/pele-renderer';
import { readDiagramNodes } from '../src/diagram-search';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('renders the checked-in Architecture example to responsive SVG', async () => {
  const markdown = readFileSync(
    resolve(process.cwd(), 'examples/Architecture.md'),
    'utf8',
  );
  const source = markdown.match(/```mermaid\s*([\s\S]*?)```/)?.[1];
  expect(source).toBeDefined();
  const rendered = await renderPeleDiagram(source!, 'architecture-example');

  expect(rendered.type).toBe('flowchart');
  expect(rendered.svg).toContain('viewBox=');
  expect(rendered.svg).toContain('Local folder');
  expect(rendered.svg).toContain('Markdown preview');
});

it.each([
  [
    'sequence',
    'sequenceDiagram\n Alice->>Bob: Hello\n Bob-->>Alice: Hi',
    'sequence',
  ],
  ['class', 'classDiagram\n Animal : +move()', 'class'],
  ['state', 'stateDiagram-v2\n [*] --> Ready\n Ready --> [*]', 'state'],
  ['entity relationship', 'erDiagram\n CUSTOMER ||--o{ ORDER : places', 'er'],
  [
    'Gantt',
    'gantt\n title Plan\n dateFormat YYYY-MM-DD\n section Work\n Draft :a1, 2026-01-01, 2d',
    'gantt',
  ],
  ['pie', 'pie title Votes\n "A" : 3\n "B" : 2', 'pie'],
  [
    'architecture',
    'architecture-beta\n service api(server)[API]\n service db(database)[DB]\n api:R --> L:db',
    'architecture',
  ],
  [
    'C4 container',
    'C4Container\nPerson(user, "User", "A person")\nContainer(api, "API", "Node", "Service")\nContainerDb(db, "Database", "Postgres", "Storage")\nRel(user, api, "calls")\nBiRel(api, db, "reads and writes")\nRel_U(db, user, "observes")',
    'c4',
  ],
  [
    'style and init directive',
    '%%{init: {"theme":"neutral"}}%%\nflowchart LR\n A[Start] --> B[Finish]\n style A fill:#f9f,stroke:#333,stroke-width:2px',
    'flowchart',
  ],
])('supports the %s diagram syntax', async (_name, source, type) => {
  const rendered = await renderPeleDiagram(source, 'compatibility-case');
  expect(rendered.type).toBe(type);
  expect(rendered.svg).toContain('<svg');
});

it('maps C4 aliases and relationships to exact sanitized SVG identities', async () => {
  const source =
    'C4Container\nPerson(user, "User", "A person")\nContainer(api, "API", "Node", "Service")\nContainerDb(db, "Database", "Postgres", "Storage")\nRel(user, api, "calls")\nBiRel(api, db, "reads and writes")\nRel_U(db, user, "observes")';
  const rendered = await renderPeleDiagram(source, 'c4-inspection');
  const host = document.createElement('div');
  host.innerHTML = DOMPurify.sanitize(rendered.svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['a', 'image', 'foreignObject'],
  });
  const svg = host.querySelector('svg')!;

  expect(rendered.nodeIds).toEqual(['user', 'api', 'db']);
  expect(rendered.edges).toEqual([
    expect.objectContaining({
      id: 'user-api',
      start: 'user',
      end: 'api',
      label: 'calls',
      kind: 'arrow',
    }),
    expect.objectContaining({
      id: 'api-db',
      start: 'api',
      end: 'db',
      label: 'reads and writes',
      kind: 'two-way',
    }),
    expect.objectContaining({
      id: 'db-user',
      start: 'db',
      end: 'user',
      label: 'observes',
      kind: 'undirected',
    }),
  ]);
  expect(readDiagramNodes(svg, rendered.nodeIds!)).toEqual([
    { id: 'user', label: 'User' },
    { id: 'api', label: 'API' },
    { id: 'db', label: 'Database' },
  ]);
  expect(
    Array.from(svg.querySelectorAll('.pele-edge[data-id]')).map((edge) =>
      edge.getAttribute('data-id'),
    ),
  ).toEqual(rendered.edges!.map((edge) => edge.id));
});

it('keeps generated SVG safe and interactive resources disabled', async () => {
  const rendered = await renderPeleDiagram(
    'flowchart LR\n  A@{ img: "https://example.com/image.png", label: "Photo", w: 40, h: 40 } --> B[Finish]\n  click B "https://example.com"',
    'untrusted-diagram',
  );
  const safeSvg = DOMPurify.sanitize(rendered.svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['a', 'image', 'foreignObject'],
  });
  const container = document.createElement('div');
  container.innerHTML = safeSvg;

  expect(container.querySelector('a, image, foreignObject, script')).toBeNull();
  for (const element of container.querySelectorAll('*'))
    for (const attribute of element.attributes)
      expect(attribute.name.toLowerCase()).not.toMatch(/^on/);
  expect(rendered.svg).not.toContain('https://example.com');
  expect(container.querySelector('svg')).not.toBeNull();
});

it('rejects unsupported syntax with a text-safe error', async () => {
  await expect(
    renderPeleDiagram('<img src=x onerror=alert(1)>', 'invalid-diagram'),
  ).rejects.toThrow();
});
