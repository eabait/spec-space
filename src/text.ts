export type Change = { from: number; to: number; insert: string };
export function editorText(raw: string) {
  return raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}
export function applyEditorChanges(raw: string, changes: Change[]): string {
  const bom = raw.startsWith('\uFEFF') ? '\uFEFF' : '';
  const body = raw.slice(bom.length);
  const eol = body.match(/\r\n|\r|\n/)?.[0] ?? '\n';
  const offsets: number[] = [0];
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\r' && body[i + 1] === '\n') i++;
    offsets.push(i + 1);
  }
  let result = body;
  for (const change of [...changes].reverse()) {
    result =
      result.slice(0, offsets[change.from]) +
      change.insert.replace(/\r\n?|\n/g, eol) +
      result.slice(offsets[change.to]);
  }
  return bom + result;
}
export function relativeLink(current: string, href: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(href.split('#')[0]);
  } catch {
    return null;
  }
  if (
    !decoded ||
    /^[a-z][a-z\d+.-]*:/i.test(decoded) ||
    decoded.startsWith('/') ||
    decoded.includes('\\')
  )
    return null;
  const parts = current.split('/').slice(0, -1);
  for (const part of decoded.split('/')) {
    if (part === '..') {
      if (!parts.length) return null;
      parts.pop();
    } else if (part && part !== '.') parts.push(part);
  }
  const result = parts.join('/');
  return /\.(md|markdown)$/i.test(result) ? result : null;
}
