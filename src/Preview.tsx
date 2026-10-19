import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, RootContent } from 'mdast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import DOMPurify from 'dompurify';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { diagramPng } from './diagram-image';
let renderQueue = Promise.resolve();
function Diagram({
  source,
  filename,
  ordinal,
}: {
  source: string;
  filename: string;
  ordinal: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [rendered, setRendered] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(source);
  latest.current = source;
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );
  function showFeedback(message: string) {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current = setTimeout(() => setFeedback(''), 1800);
  }
  async function exportImage(copy: boolean) {
    if (exporting || rendered !== source) return;
    setExporting(true);
    setFeedback('');
    try {
      if (!isTauri())
        throw new Error('Image export requires the desktop application.');
      const svg = host.current?.querySelector('svg');
      if (!svg) throw new Error('Render the diagram before exporting.');
      const bytes = await diagramPng(svg);
      if (latest.current !== source)
        throw new Error('Diagram changed. Wait for rendering and retry.');
      if (copy) {
        await invoke('copy_diagram_image', { bytes });
        showFeedback('Image copied');
      } else {
        const saved = await invoke<boolean>('save_diagram_png', {
          bytes,
          filename: `${filename.replace(/\.(md|markdown)$/i, '')}-diagram-${ordinal}.png`,
        });
        if (saved) showFeedback('PNG saved');
      }
    } catch (error) {
      setFeedback(String(error));
    } finally {
      setExporting(false);
    }
  }
  useEffect(() => {
    setRendered(null);
    setFeedback('');
    let cancelled = false;
    const timer = setTimeout(() => {
      renderQueue = renderQueue.then(async () => {
        if (cancelled) return;
        try {
          const { default: mermaid } = await import('mermaid');
          mermaid.initialize({
            startOnLoad: false,
            htmlLabels: false,
            securityLevel: 'strict',
            theme: 'neutral',
            suppressErrorRendering: true,
            flowchart: { htmlLabels: false },
          });
          const { svg } = await mermaid.render(`diagram${id}`, source);
          if (!cancelled && host.current) {
            host.current.innerHTML = DOMPurify.sanitize(svg, {
              USE_PROFILES: { svg: true, svgFilters: true },
              FORBID_TAGS: ['a', 'image', 'foreignObject'],
            });
            setError('');
            setRendered(source);
          }
        } catch (e) {
          if (!cancelled) {
            if (host.current) host.current.innerHTML = '';
            setError(String(e));
          }
        }
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source, id]);
  return (
    <div className="diagram">
      <div className="diagram-label">MERMAID</div>
      <div className="diagram-actions">
        <button
          disabled={exporting || rendered !== source}
          aria-label={`Save diagram ${ordinal} as PNG`}
          onClick={() => void exportImage(false)}
        >
          Save PNG…
        </button>
        <button
          disabled={exporting || rendered !== source}
          aria-label={`Copy diagram ${ordinal} as image`}
          onClick={() => void exportImage(true)}
        >
          Copy Image
        </button>
      </div>
      {feedback && (
        <span role="status" className="diagram-toast">
          {feedback}
        </span>
      )}
      <div ref={host} />
      {error && (
        <pre role="alert" className="diagram-error">
          {error}
        </pre>
      )}
    </div>
  );
}
export function Preview({
  content,
  onLink,
  filename = 'document',
}: {
  content: string;
  onLink: (href: string) => void;
  filename?: string;
}) {
  const ordinals = useMemo(() => {
    const result = new Map<number, number>();
    const tree = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkFrontmatter)
      .parse(content.replace(/^\uFEFF/, ''));
    function walk(node: Root | RootContent) {
      if (node.type === 'code' && node.lang === 'mermaid')
        result.set(node.position?.start.offset ?? 0, result.size + 1);
      if ('children' in node)
        node.children.forEach((child) => walk(child as RootContent));
    }
    walk(tree);
    return result;
  }, [content]);
  return (
    <article className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkFrontmatter]}
        skipHtml
        components={{
          pre: ({ children }) => <div className="code-block">{children}</div>,
          code: ({ className, children, node, ...props }) =>
            /language-mermaid/.test(className ?? '') ? (
              <Diagram
                source={String(children).replace(/\n$/, '')}
                filename={filename}
                ordinal={ordinals.get(node?.position?.start.offset ?? 0) ?? 1}
              />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            ),
          a: ({ href, children }) => (
            <a
              href={href}
              onClick={(event) => {
                event.preventDefault();
                if (href) onLink(href);
              }}
            >
              {children}
            </a>
          ),
          img: ({ alt }) => (
            <span className="image-placeholder">
              Image: {alt || 'untitled'} (external resources disabled)
            </span>
          ),
        }}
      >
        {content.replace(/^\uFEFF/, '')}
      </ReactMarkdown>
    </article>
  );
}
