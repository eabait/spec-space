import { describe, expect, it } from 'vitest';
import {
  buildConnections,
  resolveTargets,
  uncheckedTargets,
  type Snapshot,
} from '../src/connections';
const snapshot = (
  files: Record<string, string>,
  complete = true,
): Snapshot => ({
  documents: Object.entries(files).map(([path, content]) => ({
    path,
    content,
    revision: 'disk',
  })),
  unavailable: [],
  complete,
});
describe('saved Markdown connections', () => {
  it('resolves inline/reference links, nested paths, fragments and duplicates', () => {
    const result = buildConnections(
      snapshot({
        'docs/a.md':
          '# **Architecture**\n[B](../B%20file.markdown#design)\n[again][b]\n\n[b]: ../B%20file.markdown\n\n[self](a.md)\n[shortcut]\n\n[shortcut]: ../README.md',
        'B file.markdown': '[back](docs/a.md)',
        'README.md': '# Read me',
      }),
    );
    expect(result.documents[0].title).toBe('Architecture');
    expect(result.references).toEqual([
      { source: 'docs/a.md', target: 'B file.markdown', status: 'resolved' },
      { source: 'docs/a.md', target: 'docs/a.md', status: 'resolved' },
      { source: 'docs/a.md', target: 'README.md', status: 'resolved' },
      { source: 'B file.markdown', target: 'docs/a.md', status: 'resolved' },
    ]);
  });
  it('ignores code, frontmatter, HTML, images, unused definitions and unsupported destinations', () => {
    const result = buildConnections(
      snapshot({
        'a.md':
          '\uFEFF---\ntitle: "[yaml](no.md)"\n---\n`[inline](no.md)`\n\n```md\n[code](no.md)\n```\n\n<!-- [comment](no.md) -->\n<img src="no.md">\n![image](no.md)\n[unused]: no.md\n\n[web](https://example.com/no.md) [escape](../no.md) [absolute](/no.md) [heading](#top) [asset](a.png) [invalid](%ZZ.md)',
      }),
    );
    expect(result.references).toEqual([]);
  });
  it('does not infer missing targets from an incomplete scan', () => {
    const index = buildConnections(
      snapshot(
        {
          'a.md':
            '[B](b.md) [C](c.md) [hidden](.hidden.md) [unreadable](bad.md)',
        },
        false,
      ),
    );
    expect(index.references.every((r) => r.status === 'unavailable')).toBe(
      true,
    );
    expect(uncheckedTargets(index)).toEqual([
      'b.md',
      'c.md',
      '.hidden.md',
      'bad.md',
    ]);
    const checked = resolveTargets(index, [
      { path: 'b.md', status: 'missing', canonical: null },
      { path: 'c.md', status: 'unavailable', canonical: 'c.md' },
      { path: '.hidden.md', status: 'excluded', canonical: null },
    ]);
    expect(checked.references.map((r) => r.status)).toEqual([
      'missing',
      'unavailable',
      'excluded',
      'unavailable',
    ]);
  });
  it('canonicalizes case aliases returned by the filesystem and deduplicates them', () => {
    const index = buildConnections(
      snapshot({ 'a.md': '[A](B.md) [B](b.md)', 'B.md': '# B' }),
    );
    expect(
      resolveTargets(index, [
        { path: 'b.md', canonical: 'B.md', status: 'unavailable' },
      ]).references,
    ).toEqual([{ source: 'a.md', target: 'B.md', status: 'resolved' }]);
  });
  it('rebuilds removed links and handles an empty workspace', () => {
    expect(buildConnections(snapshot({})).references).toEqual([]);
    expect(
      buildConnections(snapshot({ 'a.md': 'no links' })).references,
    ).toEqual([]);
  });
});
