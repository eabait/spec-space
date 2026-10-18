import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConnectionIndex } from './connections';

// A deterministic layout keeps the map stable between selections. Large maps
// use a larger scrollable surface; selection highlights only adjacent edges.
function layout(index: ConnectionIndex) {
  const count = index.documents.length;
  const width =
    count <= 4
      ? Math.max(420, count * 180)
      : Math.max(820, Math.ceil(Math.sqrt(count)) * 220);
  const height =
    count <= 4 ? 300 : Math.max(540, Math.ceil(Math.sqrt(count)) * 150);
  const nodes = index.documents.map((doc, i) => ({
    ...doc,
    x:
      width / 2 +
      Math.cos(i * 2.39996) * Math.sqrt((i + 1) / count) * width * 0.4,
    y:
      height / 2 +
      Math.sin(i * 2.39996) * Math.sqrt((i + 1) / count) * height * 0.4,
  }));
  // Repulsion avoids overlapping labels without adding a graph runtime.
  for (let pass = 0; pass < 90; pass++) {
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i],
          b = nodes[j];
        const dx = a.x - b.x,
          dy = a.y - b.y;
        if (Math.abs(dx) < 195 && Math.abs(dy) < 80) {
          const pushX = (195 - Math.abs(dx)) * 0.15 * (dx >= 0 ? 1 : -1);
          const pushY = (80 - Math.abs(dy)) * 0.15 * (dy >= 0 ? 1 : -1);
          a.x += pushX;
          b.x -= pushX;
          a.y += pushY;
          b.y -= pushY;
        }
      }
    for (const node of nodes) {
      node.x = Math.max(100, Math.min(width - 100, node.x));
      node.y = Math.max(45, Math.min(height - 45, node.y));
    }
  }
  return {
    nodes,
    width,
    height,
    byPath: new Map(nodes.map((n) => [n.path, n])),
  };
}
export function ConnectionGraph({
  index,
  selected,
  onOpen,
}: {
  index: ConnectionIndex;
  selected: string;
  onOpen: (path: string) => void;
}) {
  const graph = useMemo(() => layout(index), [index]);
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({
    width: graph.width,
    height: graph.height,
  });
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const zoom =
    manualZoom ??
    Math.min(
      1,
      Math.max(
        0.1,
        Math.min(size.width / graph.width, size.height / graph.height),
      ),
    );
  const setZoom = (change: number) =>
    setManualZoom(Math.max(0.1, Math.min(2, zoom + change)));
  return (
    <div className="graph-area">
      <div className="graph-tools">
        <span>Arrow: source → referenced document</span>
        <button
          aria-label="Zoom out"
          disabled={zoom <= 0.1}
          onClick={() => setZoom(-0.25)}
        >
          −
        </button>
        <button
          aria-label="Fit graph to window"
          onClick={() => setManualZoom(null)}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          aria-label="Zoom in"
          disabled={zoom >= 2}
          onClick={() => setZoom(0.25)}
        >
          +
        </button>
      </div>
      <div
        ref={viewport}
        className="graph-scroll"
        tabIndex={0}
        aria-label="Scrollable document graph"
      >
        <svg
          width={graph.width * zoom}
          height={graph.height * zoom}
          viewBox={`0 0 ${graph.width} ${graph.height}`}
          aria-label="Document references graph"
        >
          <defs>
            <marker
              id="reference-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#718aa7" />
            </marker>
          </defs>
          {index.references
            .filter((r) => r.status === 'resolved')
            .map((r) => {
              const a = graph.byPath.get(r.source)!,
                b = graph.byPath.get(r.target)!;
              const highlighted =
                r.source === selected || r.target === selected;
              const dx = b.x - a.x,
                dy = b.y - a.y;
              const scale = Math.min(
                88 / (Math.abs(dx) || 1),
                28 / (Math.abs(dy) || 1),
              );
              const self = a === b;
              return (
                <path
                  key={JSON.stringify([r.source, r.target])}
                  d={
                    self
                      ? `M ${a.x - 35} ${a.y - 28} C ${a.x - 80} ${a.y - 75}, ${a.x + 80} ${a.y - 75}, ${a.x + 35} ${a.y - 28}`
                      : `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2 - dy * 0.08} ${(a.y + b.y) / 2 + dx * 0.08} ${b.x - dx * scale} ${b.y - dy * scale}`
                  }
                  className={`graph-edge ${highlighted ? 'highlighted' : ''}`}
                  markerEnd="url(#reference-arrow)"
                >
                  <title>
                    {r.source} references {r.target}
                  </title>
                </path>
              );
            })}
          {graph.nodes.map((node) => (
            <g
              key={node.path}
              role="button"
              tabIndex={0}
              aria-label={`Open ${node.path} from graph`}
              aria-pressed={selected === node.path}
              className={`graph-node ${node.path === selected ? 'selected' : ''}`}
              transform={`translate(${node.x},${node.y})`}
              onClick={() => onOpen(node.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(node.path);
                }
              }}
            >
              <title>
                {node.title} — {node.path}
              </title>
              <rect x="-88" y="-28" width="176" height="56" rx="8" />
              <text textAnchor="middle" y="-3">
                {short(node.path.split('/').at(-1)!, 23)}
              </text>
              <text className="graph-folder" textAnchor="middle" y="15">
                {short(
                  node.path.includes('/')
                    ? node.path.slice(0, node.path.lastIndexOf('/'))
                    : 'Workspace',
                  27,
                )}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
function short(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
