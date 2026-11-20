import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  childViews,
  parseArchitecture,
  relationshipsForView,
} from '../src/c4/adapter';
import { layoutView } from '../src/c4/layout';

const fixture = readFileSync(
  new URL('../examples/architecture.dsl', import.meta.url),
  'utf8',
);

describe('native Structurizr projection', () => {
  it('renders each declared view and its scoped membership without rewriting the source', () => {
    const source = `\uFEFF${fixture.replace(/\n/g, '\r\n')}`;
    const parsed = parseArchitecture(source);
    expect(parsed.diagnostics).toEqual([]);
    const model = parsed.model!;
    expect(model.views.map((view) => view.type)).toEqual([
      'systemLandscape',
      'systemContext',
      'container',
      'component',
    ]);
    expect(model.views[0].elements.map(({ id }) => id).sort()).toEqual([
      'agent',
      'product',
      'reader',
    ]);
    expect(model.views[3].elements.map(({ id }) => id).sort()).toEqual([
      'editor',
      'explorer',
    ]);
    const layout = layoutView(model, model.views[3]);
    expect(layout.nodes.map((node) => node.id).sort()).toEqual([
      'desktop',
      'editor',
      'explorer',
      'product',
    ]);
    expect(layout.nodes.find((node) => node.id === 'desktop')?.parentId).toBe(
      'product',
    );
    expect(layout.nodes.find((node) => node.id === 'editor')?.parentId).toBe(
      'desktop',
    );
    expect(layout.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ['editor', 'explorer'],
    ]);
    expect(
      childViews(
        model,
        model.elements.find((element) => element.id === 'product')!,
      ).map((view) => view.key),
    ).toEqual(['containers']);
    expect(source).toBe(`\uFEFF${fixture.replace(/\n/g, '\r\n')}`);
  });

  it('keeps explicit view membership and excludes separate from the whole workspace graph', () => {
    const result = parseArchitecture(`workspace {
      model {
        a = person "Duplicate"
        b = person "Duplicate"
        s = softwareSystem "System"
        a -> s "Uses"
        b -> s "Also uses"
      }
      views {
        systemLandscape "one" {
          include a s
        }
        systemLandscape "two" {
          include *
          exclude b
          exclude "a -> s"
        }
      }
    }`);
    expect(
      result.diagnostics.filter(
        (diagnostic) => diagnostic.severity === 'error',
      ),
    ).toEqual([]);
    const model = result.model!;
    expect(model.views[0].elements.map(({ id }) => id).sort()).toEqual([
      'a',
      's',
    ]);
    expect(relationshipsForView(model, model.views[0])).toHaveLength(1);
    expect(model.views[1].elements.map(({ id }) => id).sort()).toEqual([
      'a',
      's',
    ]);
    expect(relationshipsForView(model, model.views[1])).toEqual([]);
    expect(
      model.elements
        .filter((element) => element.name === 'Duplicate')
        .map((element) => element.id),
    ).toEqual(['a', 'b']);
  });

  it('labels generated views as inferred and reports unresolved local and remote resources', () => {
    const generated = parseArchitecture(
      'workspace { model { a = softwareSystem "A" } }',
    );
    expect(generated.model!.views.length).toBeGreaterThan(0);
    expect(generated.model!.views.every((view) => view.autoView)).toBe(true);
    const incomplete = parseArchitecture(`workspace {
      !include https://example.com/remote.dsl
      !script arbitrary
      model { a = softwareSystem "A" }
      views {
        dynamic a "unsupported" { }
        themes "https://example.com/theme.json"
      }
    }`);
    expect(
      incomplete.diagnostics.some((diagnostic) =>
        diagnostic.message.includes('!include'),
      ),
    ).toBe(true);
    expect(
      incomplete.diagnostics.some((diagnostic) =>
        diagnostic.message.includes('!script'),
      ),
    ).toBe(true);
    expect(
      incomplete.diagnostics.some((diagnostic) =>
        diagnostic.message.includes('themes'),
      ),
    ).toBe(true);
    expect(
      incomplete.diagnostics.some(
        (diagnostic) =>
          diagnostic.message.includes('dynamic') &&
          diagnostic.message.includes('unsupported'),
      ),
    ).toBe(true);
  });

  it.each([
    '',
    '# Markdown',
    'workspace {',
    'workspace { model { }',
    'workspace { } }',
  ])('rejects malformed envelopes without losing their source %j', (source) => {
    const result = parseArchitecture(source);
    expect(result.model).toBeUndefined();
    expect(
      result.diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
    ).toBe(true);
  });

  it('lays out nested groups with long labels and cross-boundary relationships', () => {
    const parsed = parseArchitecture(`workspace {
      model {
        group "Outer" {
          group "Inner" {
            a = softwareSystem "A very long system name that wraps inside the node"
          }
          b = softwareSystem "B"
        }
        c = softwareSystem "C"
        a -> b "Calls"
        b -> c "Sends"
      }
      views { systemLandscape "groups" { include * } }
    }`);
    expect(parsed.model).toBeDefined();
    const layout = layoutView(parsed.model!, parsed.model!.views[0]);
    expect(layout.nodes.filter((node) => node.data.boundary)).toHaveLength(2);
    expect(layout.edges).toHaveLength(2);
    const byId = new Map(layout.nodes.map((node) => [node.id, node]));
    for (const node of layout.nodes) {
      expect(
        Number.isFinite(node.position.x) && Number.isFinite(node.position.y),
      ).toBe(true);
      if (node.parentId) {
        const parent = byId.get(node.parentId)!;
        expect(node.position.x).toBeGreaterThanOrEqual(0);
        expect(node.position.y).toBeGreaterThanOrEqual(0);
        expect(node.position.x + Number(node.style!.width)).toBeLessThanOrEqual(
          Number(parent.style!.width),
        );
        expect(
          node.position.y + Number(node.style!.height),
        ).toBeLessThanOrEqual(Number(parent.style!.height));
      }
    }
  });

  it('preserves equal-membership nested groups and ancestor boundaries independent of include order', () => {
    const grouped = parseArchitecture(`workspace {
      model {
        group "Outer" {
          group "Inner" {
            a = softwareSystem "A"
          }
        }
      }
    }`).model!;
    const layout = layoutView(grouped, grouped.views[0]);
    const outer = layout.nodes.find((node) => node.data.label === 'Outer')!;
    const inner = layout.nodes.find((node) => node.data.label === 'Inner')!;
    expect(inner.parentId).toBe(outer.id);
    expect(layout.nodes.find((node) => node.id === 'a')?.parentId).toBe(
      inner.id,
    );
    const explicit = parseArchitecture(`workspace {
      model {
        s = softwareSystem "S" {
          a = container "A"
        }
      }
      views {
        container s "child-first" {
          include a
          include s
        }
      }
    }`).model!;
    const childFirst = layoutView(explicit, explicit.views[0]);
    const boundary = childFirst.nodes.find((node) => node.id === 's')!;
    expect(boundary.data.boundary).toBe(true);
    expect(childFirst.nodes.find((node) => node.id === 'a')?.parentId).toBe(
      's',
    );
    expect(
      childFirst.nodes.find((node) => node.id === 'a')?.position.y,
    ).toBeGreaterThan(0);
  });

  it('applies type and ordered tag styles once, independently of declaration order', () => {
    const model = parseArchitecture(`workspace {
      model {
        a = softwareSystem "A" { tags "Highlight" }
      }
      views {
        styles {
          element "Highlight" {
            background #aabbcc
            opacity 50
            shape Circle
          }
          element "Software System" { background #112233 }
          element "Element" { background #ffffff }
        }
      }
    }`).model!;
    const node = layoutView(model, model.views[0]).nodes.find(
      (candidate) => candidate.id === 'a',
    )!;
    expect(node.data.appearance).toMatchObject({
      background: '#aabbcc',
      opacity: 0.5,
    });
    expect(node.data.shape).toBe('Circle');
    expect(node.style?.opacity).toBeUndefined();
    expect(node.style?.background).toBeUndefined();
  });
});
