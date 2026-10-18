import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import type { Root, RootContent } from 'mdast';
import { relativeLink } from './text';

export interface Snapshot {
  documents: { path: string; content: string; revision: string }[];
  unavailable: { path: string; message: string }[];
  complete: boolean;
}
export interface Reference {
  source: string;
  target: string;
  status: 'resolved' | 'missing' | 'unavailable' | 'excluded';
}
export interface IndexedDocument {
  path: string;
  title: string;
}
export interface ConnectionIndex {
  documents: IndexedDocument[];
  references: Reference[];
  unavailable: Snapshot['unavailable'];
  complete: boolean;
}
export interface TargetCheck {
  path: string;
  status: 'missing' | 'unavailable' | 'excluded';
  canonical: string | null;
}
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter);
function walk(node: Root | RootContent, visit: (node: RootContent) => void) {
  if (node.type !== 'root') visit(node);
  if ('children' in node) for (const child of node.children) walk(child, visit);
}
function plainText(node: RootContent): string {
  if ('value' in node) return node.value;
  if ('children' in node) return node.children.map(plainText).join('');
  return '';
}
function identifier(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}
export function buildConnections(snapshot: Snapshot): ConnectionIndex {
  const paths = new Set(snapshot.documents.map((d) => d.path));
  const documents: IndexedDocument[] = [];
  const references: Reference[] = [];
  for (const doc of snapshot.documents) {
    const tree = parser.parse(doc.content.replace(/^\uFEFF/, ''));
    const definitions = new Map<string, string>();
    walk(tree, (node) => {
      if (
        node.type === 'definition' &&
        !definitions.has(identifier(node.identifier))
      )
        definitions.set(identifier(node.identifier), node.url);
    });
    const heading = tree.children.find((n) => n.type === 'heading');
    documents.push({
      path: doc.path,
      title: heading ? plainText(heading) : doc.path.split('/').at(-1)!,
    });
    const targets = new Set<string>();
    walk(tree, (node) => {
      const url =
        node.type === 'link'
          ? node.url
          : node.type === 'linkReference'
            ? definitions.get(identifier(node.identifier))
            : undefined;
      if (!url) return;
      const target = relativeLink(doc.path, url);
      if (target) targets.add(target);
    });
    for (const target of targets)
      references.push({
        source: doc.path,
        target,
        status: paths.has(target) ? 'resolved' : 'unavailable',
      });
  }
  return {
    documents,
    references,
    unavailable: snapshot.unavailable,
    complete: snapshot.complete,
  };
}
export function uncheckedTargets(index: ConnectionIndex): string[] {
  return [
    ...new Set(
      index.references
        .filter((r) => r.status !== 'resolved')
        .map((r) => r.target),
    ),
  ];
}
export function resolveTargets(
  index: ConnectionIndex,
  checks: TargetCheck[],
): ConnectionIndex {
  const byPath = new Map(checks.map((c) => [c.path, c]));
  const paths = new Set(index.documents.map((d) => d.path));
  const seen = new Set<string>();
  return {
    ...index,
    references: index.references
      .map((reference) => {
        const check = byPath.get(reference.target);
        if (!check || reference.status === 'resolved') return reference;
        return check.canonical && paths.has(check.canonical)
          ? {
              ...reference,
              target: check.canonical,
              status: 'resolved' as const,
            }
          : { ...reference, status: check.status };
      })
      .filter((r) => {
        const key = JSON.stringify([r.source, r.target]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
  };
}
