import { describe, expect, it } from 'vitest';
import { applyEditorChanges, editorText, relativeLink } from '../src/text';
describe('lossless source edits', () => {
  it('preserves BOM, CRLF, mixed endings, frontmatter and comments in untouched text', () => {
    const raw = '\uFEFF---\r\ntitle: A\r\n---\n<!-- keep -->\r\n';
    const position = editorText(raw).indexOf('A');
    expect(
      applyEditorChanges(raw, [
        { from: position, to: position + 1, insert: 'B' },
      ]),
    ).toBe(raw.replace('A', 'B'));
    expect(applyEditorChanges(raw, [])).toBe(raw);
  });
  it('handles multiple changes and inserts with original line endings', () => {
    expect(
      applyEditorChanges('ab\r\ncd', [
        { from: 1, to: 2, insert: 'X\nY' },
        { from: 3, to: 5, insert: 'Z' },
      ]),
    ).toBe('aX\r\nY\r\nZ');
  });
  it('keeps emoji offsets and CR line endings', () => {
    expect(
      applyEditorChanges('😀\rtext', [{ from: 3, to: 7, insert: 'new\nline' }]),
    ).toBe('😀\rnew\rline');
  });
});
describe('workspace links', () => {
  it('resolves sibling and parent documents', () => {
    expect(relativeLink('docs/architecture.md', '../README.md#top')).toBe(
      'README.md',
    );
    expect(relativeLink('docs/architecture.md', './Other%20File.md')).toBe(
      'docs/Other File.md',
    );
  });
  it('rejects escapes and external schemes', () => {
    for (const href of [
      '../../outside.md',
      'https://site/file.md',
      '/root/file.md',
      'javascript:alert(1)',
      '%ZZ',
      'file:///etc/passwd',
      '\\evil.md',
    ])
      expect(relativeLink('docs/a.md', href)).toBeNull();
  });
});
