import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, RootContent } from 'mdast';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import DOMPurify from 'dompurify';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { diagramPng } from './diagram-image';
import { renderPeleDiagram } from './pele-renderer';
import { outlineTargetId } from './outline';
import { Copy, Download, Maximize2 } from 'lucide-react';
let renderQueue = Promise.resolve();
function Diagram({
  source,
  filename,
  ordinal,
  onExplore,
}: {
  source: string;
  filename: string;
  ordinal: number;
  onExplore: (svg: SVGSVGElement, title: string, nodeIds?: string[]) => void;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const host = useRef<HTMLDivElement>(null);
  const nodeIds = useRef<string[] | undefined>(undefined);
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
          const result = await renderPeleDiagram(source, `diagram${id}`);
          if (!cancelled && host.current) {
            host.current.innerHTML = DOMPurify.sanitize(result.svg, {
              USE_PROFILES: { svg: true, svgFilters: true },
              FORBID_TAGS: ['a', 'image', 'foreignObject'],
            });
            nodeIds.current = result.nodeIds;
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
          disabled={rendered !== source}
          aria-label={`Explore diagram ${ordinal}`}
          title="Explore diagram"
          onClick={() => {
            const svg = host.current?.querySelector('svg');
            if (svg)
              onExplore(
                svg,
                `${filename} · Diagram ${ordinal}`,
                nodeIds.current,
              );
          }}
        >
          <Maximize2 size={15} />
        </button>
        <button
          disabled={exporting || rendered !== source}
          aria-label={`Save diagram ${ordinal} as PNG`}
          title="Save diagram as PNG"
          onClick={() => void exportImage(false)}
        >
          <Download size={15} />
        </button>
        <button
          disabled={exporting || rendered !== source}
          aria-label={`Copy diagram ${ordinal} as image`}
          title="Copy diagram as image"
          onClick={() => void exportImage(true)}
        >
          <Copy size={15} />
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
export interface PreviewHandle {
  scrollToOffset(offset: number): void;
}

const headingComponents: Components = {
  h1: ({ node, children, ...props }) => (
    <h1
      {...props}
      id={outlineTargetId(node?.position?.start.offset ?? 0)}
      tabIndex={-1}
    >
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }) => (
    <h2
      {...props}
      id={outlineTargetId(node?.position?.start.offset ?? 0)}
      tabIndex={-1}
    >
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }) => (
    <h3
      {...props}
      id={outlineTargetId(node?.position?.start.offset ?? 0)}
      tabIndex={-1}
    >
      {children}
    </h3>
  ),
  h4: ({ node, children, ...props }) => (
    <h4
      {...props}
      id={outlineTargetId(node?.position?.start.offset ?? 0)}
      tabIndex={-1}
    >
      {children}
    </h4>
  ),
  h5: ({ node, children, ...props }) => (
    <h5
      {...props}
      id={outlineTargetId(node?.position?.start.offset ?? 0)}
      tabIndex={-1}
    >
      {children}
    </h5>
  ),
  h6: ({ node, children, ...props }) => (
    <h6
      {...props}
      id={outlineTargetId(node?.position?.start.offset ?? 0)}
      tabIndex={-1}
    >
      {children}
    </h6>
  ),
};

function MarkdownTable({ children }: { children?: ReactNode }) {
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="Scrollable table"
      tabIndex={0}
    >
      <table>{children}</table>
    </div>
  );
}

export const Preview = forwardRef<
  PreviewHandle,
  {
    content: string;
    onLink: (href: string) => void;
    filename?: string;
    onExplore?: (svg: SVGSVGElement, title: string, nodeIds?: string[]) => void;
  }
>(function Preview(
  { content, onLink, filename = 'document', onExplore = () => {} },
  ref,
) {
  const article = useRef<HTMLElement>(null);
  useImperativeHandle(
    ref,
    () => ({
      scrollToOffset(offset) {
        const heading = article.current?.querySelector<HTMLElement>(
          `#${outlineTargetId(offset)}`,
        );
        heading?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        heading?.focus({ preventScroll: true });
      },
    }),
    [],
  );
  const ordinals = useMemo(() => {
    const result = new Map<number, number>();
    const tree = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkFrontmatter)
      .parse(content.replace(/^\uFEFF/, ''));
    function walk(node: Root | RootContent) {
      if (node.type === 'code' && node.lang === 'mermaid')
        result.set(node?.position?.start.offset ?? 0, result.size + 1);
      if ('children' in node)
        node.children.forEach((child) => walk(child as RootContent));
    }
    walk(tree);
    return result;
  }, [content]);
  return (
    <article className="markdown" ref={article}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkFrontmatter]}
        skipHtml
        components={{
          ...headingComponents,
          table: ({ children }) => <MarkdownTable>{children}</MarkdownTable>,
          th: ({ children, node: _node, style, ...props }) => (
            <th {...props} style={{ ...style, textAlign: 'left' }}>
              {children}
            </th>
          ),
          td: ({ children, node: _node, style, ...props }) => (
            <td {...props} style={{ ...style, textAlign: 'left' }}>
              {children}
            </td>
          ),
          pre: ({ children }) => <div className="code-block">{children}</div>,
          code: ({ className, children, node, ...props }) =>
            /language-mermaid/.test(className ?? '') ? (
              <Diagram
                source={String(children).replace(/\n$/, '')}
                filename={filename}
                ordinal={ordinals.get(node?.position?.start.offset ?? 0) ?? 1}
                onExplore={onExplore}
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
});
