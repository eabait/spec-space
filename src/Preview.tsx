import { useEffect, useId, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import DOMPurify from 'dompurify';
let renderQueue = Promise.resolve();
function Diagram({ source }: { source: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
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
}: {
  content: string;
  onLink: (href: string) => void;
}) {
  return (
    <article className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkFrontmatter]}
        skipHtml
        components={{
          pre: ({ children }) => <div className="code-block">{children}</div>,
          code: ({ className, children, ...props }) =>
            /language-mermaid/.test(className ?? '') ? (
              <Diagram source={String(children).replace(/\n$/, '')} />
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
