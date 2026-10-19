import { describe, expect, it } from 'vitest';
import { extractOutline, outlineTargetId } from '../src/outline';

describe('document outline', () => {
  it('extracts ATX, Setext and nested headings with source positions', () => {
    const outline = extractOutline(
      '# Architecture\n\nDesign\n======\n\n### Storage\n',
    );
    expect(outline).toEqual([
      {
        offset: 0,
        line: 1,
        level: 1,
        title: 'Architecture',
        children: [],
      },
      {
        offset: 16,
        line: 3,
        level: 1,
        title: 'Design',
        children: [
          {
            offset: 31,
            line: 6,
            level: 3,
            title: 'Storage',
            children: [],
          },
        ],
      },
    ]);
  });

  it('keeps duplicate titles distinct and extracts formatted heading text', () => {
    const outline = extractOutline('# **Overview**\n\n# Overview\n');
    expect(outline.map(({ title, level }) => ({ title, level }))).toEqual([
      { title: 'Overview', level: 1 },
      { title: 'Overview', level: 1 },
    ]);
    expect(outline[0].offset).not.toBe(outline[1].offset);
    expect(outlineTargetId(outline[0].offset)).not.toBe(
      outlineTargetId(outline[1].offset),
    );
    expect(outline[0].children).toEqual([]);
  });

  it('ignores frontmatter and headings inside fenced code', () => {
    expect(
      extractOutline(
        '---\ntitle: Example\n---\n\n```md\n# Not a heading\n```\n\n# Actual heading\n',
      ).map(({ title }) => title),
    ).toEqual(['Actual heading']);
  });

  it('normalizes a BOM and extracts GFM heading content', () => {
    const outline = extractOutline('\uFEFF## Design ~~legacy~~ `v2`\n');
    expect(outline).toMatchObject([
      { offset: 0, line: 1, level: 2, title: 'Design legacy v2' },
    ]);
  });
});
