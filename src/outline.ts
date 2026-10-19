import type { Root, RootContent, PhrasingContent } from 'mdast';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';

export interface OutlineSection {
  offset: number;
  line: number;
  level: number;
  title: string;
  children: OutlineSection[];
}

function phrasingText(node: PhrasingContent): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  if (node.type === 'image' || node.type === 'imageReference')
    return node.alt ?? '';
  if (node.type === 'break') return ' ';
  if ('children' in node)
    return node.children.map((child) => phrasingText(child)).join('');
  return '';
}

export function outlineTargetId(offset: number) {
  return `outline-heading-${offset}`;
}

export function extractOutline(content: string): OutlineSection[] {
  const source = content.replace(/^\uFEFF/, '');
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .parse(source);
  const sections: OutlineSection[] = [];
  const stack: OutlineSection[] = [];

  function walk(node: Root | RootContent) {
    if (node.type === 'heading' && node.position) {
      const title = node.children.map((child) => phrasingText(child)).join('');
      const section: OutlineSection = {
        offset: node.position.start.offset ?? 0,
        line: node.position.start.line,
        level: node.depth,
        title: title.replace(/\s+/g, ' ').trim(),
        children: [],
      };
      while (stack.length && stack.at(-1)!.level >= section.level) stack.pop();
      if (stack.length) stack.at(-1)!.children.push(section);
      else sections.push(section);
      stack.push(section);
    }
    if ('children' in node)
      node.children.forEach((child) => walk(child as RootContent));
  }

  walk(tree as Root);
  return sections;
}
