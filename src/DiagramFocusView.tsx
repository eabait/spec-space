import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Search,
  Copy,
  Download,
  Network,
} from 'lucide-react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { diagramPng } from './diagram-image';
import { focusNode, matchingNodes, readDiagramNodes } from './diagram-search';
import type { Box, Viewport } from './diagram-search';
import { inspectConnections } from './diagram-search';
import type { DiagramEdge } from './diagram-search';

export function DiagramFocusView({
  svg,
  title,
  nodeIds,
  edges = [],
  onClose,
}: {
  svg: SVGSVGElement;
  title: string;
  nodeIds?: string[];
  edges?: DiagramEdge[];
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const resultsId = useId();
  const close = useRef(onClose);
  close.current = onClose;
  const fitting = useRef(true);
  const suppressBackgroundClick = useRef(false);
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    nodeId?: string;
    moved: boolean;
  } | null>(null);
  const [view, setView] = useState<Viewport>({ scale: 1, x: 0, y: 0 });
  const currentView = useRef(view);
  currentView.current = view;
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [choice, setChoice] = useState(-1);
  const [selection, setSelection] = useState<{ id: string; box: Box } | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const dimensions = useMemo(() => {
    const box = (svg.getAttribute('viewBox') ?? '')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    return {
      width: Number(svg.getAttribute('width')) || box[2] || 800,
      height: Number(svg.getAttribute('height')) || box[3] || 600,
    };
  }, [svg]);
  const nodes = useMemo(
    () => (nodeIds ? readDiagramNodes(svg, nodeIds) : null),
    [svg, nodeIds],
  );
  const matches = useMemo(
    () => matchingNodes(nodes ?? [], query),
    [nodes, query],
  );
  const connections = selection ? inspectConnections(edges, selection.id) : [];
  const visibleConnections = connections.filter(
    (edge) => nodeIds?.includes(edge.start) && nodeIds.includes(edge.end),
  );
  const excludedConnections = connections.length - visibleConnections.length;
  const neighbors = new Set(
    visibleConnections
      .flatMap((e) => [e.start, e.end])
      .filter((id) => id !== selection?.id),
  );
  const nodeMap = new Map((nodes ?? []).map((node) => [node.id, node]));
  const markup = useMemo(() => {
    const copy = svg.cloneNode(true) as SVGSVGElement;
    // Namespace only SVG infrastructure IDs; authored node data-id stays intact.
    const ids = new Map<string, string>();
    for (const element of copy.querySelectorAll('[id]')) {
      const old = element.id;
      const next = `focus-${resultsId.replace(/\W/g, '')}-${ids.size}`;
      ids.set(old, next);
      element.id = next;
    }
    for (const element of [copy, ...copy.querySelectorAll('*')])
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name === 'id') continue;
        let value = attribute.value;
        for (const [old, next] of ids) {
          value = value.replaceAll(`url(#${old})`, `url(#${next})`);
          if (value === `#${old}`) value = `#${next}`;
          if (
            attribute.name === 'aria-labelledby' ||
            attribute.name === 'aria-describedby'
          )
            value = value
              .split(' ')
              .map((id) => (id === old ? next : id))
              .join(' ');
        }
        element.setAttribute(attribute.name, value);
      }
    for (const group of copy.querySelectorAll<SVGGElement>(
      'g.pele-node[data-id]',
    )) {
      if (group.dataset.id === selection?.id)
        group.classList.add('inspection-selected');
      else if (neighbors.has(group.dataset.id ?? ''))
        group.classList.add('inspection-neighbor');
    }
    for (const group of copy.querySelectorAll<SVGGElement>(
      'g.pele-edge[data-id]',
    ))
      if (visibleConnections.some((edge) => edge.id === group.dataset.id))
        group.classList.add('inspection-edge');
    copy.setAttribute('width', String(dimensions.width));
    copy.setAttribute('height', String(dimensions.height));
    copy.style.width = `${dimensions.width}px`;
    copy.style.height = `${dimensions.height}px`;
    copy.style.maxWidth = 'none';
    return copy.outerHTML;
  }, [svg, dimensions, resultsId, selection?.id, edges, nodeIds]);
  function fitScale() {
    const box = stage.current?.getBoundingClientRect();
    return box
      ? Math.max(
          0.00001,
          Math.min(
            1,
            (box.width - 64) / dimensions.width,
            (box.height - 64) / dimensions.height,
          ),
        )
      : 1;
  }
  function fit() {
    fitting.current = true;
    setView({ scale: fitScale(), x: 0, y: 0 });
  }
  function zoom(factor: number, anchor = { x: 0, y: 0 }) {
    fitting.current = false;
    setView((v) => {
      const scale = Math.max(
        Math.min(0.1, fitScale()),
        Math.min(4, v.scale * factor),
      );
      return {
        scale,
        x: anchor.x - ((anchor.x - v.x) * scale) / v.scale,
        y: anchor.y - ((anchor.y - v.y) * scale) / v.scale,
      };
    });
  }
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const observer = new ResizeObserver(() => {
      if (fitting.current) fit();
    });
    if (stage.current) observer.observe(stage.current);
    fit();
    return () => {
      observer.disconnect();
      dialog.current?.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [svg]);
  useEffect(() => {
    const canvas = stage.current;
    if (!canvas) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? canvas.clientHeight
            : 1;
      if (event.metaKey || event.ctrlKey) {
        const box = canvas.getBoundingClientRect();
        zoom(
          Math.exp(-Math.max(-100, Math.min(100, event.deltaY * unit)) * 0.01),
          {
            x: event.clientX - box.left - box.width / 2,
            y: event.clientY - box.top - box.height / 2,
          },
        );
      } else {
        fitting.current = false;
        setView((v) => ({
          ...v,
          x: v.x - event.deltaX * unit,
          y: v.y - event.deltaY * unit,
        }));
      }
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => canvas.removeEventListener('wheel', wheel);
  }, [dimensions]);
  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);
  useEffect(() => {
    if (choice >= 0)
      document
        .getElementById(`${resultsId}-${choice}`)
        ?.scrollIntoView({ block: 'nearest' });
  }, [choice, resultsId]);
  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
    setChoice(-1);
    setSelection(null);
    searchButton.current?.focus();
  }
  function selectNode(id: string, center = false) {
    const drawing = art.current,
      canvas = stage.current;
    const group = Array.from(
      drawing?.querySelectorAll<SVGGElement>('g.pele-node[data-id]') ?? [],
    ).find((g) => g.dataset.id === id);
    if (!group || !drawing || !canvas) return;
    const r = group.getBoundingClientRect(),
      a = drawing.getBoundingClientRect(),
      s = currentView.current.scale;
    const box = {
      x: (r.left - a.left) / s - dimensions.width / 2,
      y: (r.top - a.top) / s - dimensions.height / 2,
      width: r.width / s,
      height: r.height / s,
    };
    if (center && id !== selection?.id) {
      fitting.current = false;
      setView(focusNode(box, canvas.getBoundingClientRect(), s));
    }
    setSelection({ id, box });
    setDetailsOpen(true);
  }
  function activate(index: number) {
    const node = matches[index];
    const canvas = stage.current;
    const drawing = art.current;
    if (!node || !canvas || !drawing) return;
    const group = Array.from(
      drawing.querySelectorAll<SVGGElement>('g.pele-node[data-id]'),
    ).find((element) => element.getAttribute('data-id') === node.id);
    if (!group) return;
    const r = group.getBoundingClientRect(),
      a = drawing.getBoundingClientRect();
    const s = currentView.current.scale;
    if (!r.width || !r.height || !s) {
      setFeedback('Could not locate this node.');
      return;
    }
    const box = {
      x: (r.left - a.left) / s - dimensions.width / 2,
      y: (r.top - a.top) / s - dimensions.height / 2,
      width: r.width / s,
      height: r.height / s,
    };
    fitting.current = false;
    setView(focusNode(box, canvas.getBoundingClientRect(), s));
    setChoice(index);
    setSelection({ id: node.id, box });
    setSearchOpen(false);
    setDetailsOpen(true);
  }
  async function exportImage(copy: boolean) {
    if (exporting) return;
    setExporting(true);
    setFeedback('');
    try {
      if (!isTauri())
        throw Error('Image export requires the desktop application.');
      const bytes = await diagramPng(svg);
      if (copy) {
        await invoke('copy_diagram_image', { bytes });
        setFeedback('Image copied');
      } else {
        const filename =
          title
            .replace(/ · Diagram (\d+)$/, '-diagram-$1')
            .replace(/\.(md|markdown)(?=-diagram-)/i, '') + '.png';
        const saved = await invoke<boolean>('save_diagram_png', {
          bytes,
          filename,
        });
        if (saved) setFeedback('PNG saved');
      }
    } catch (error) {
      setFeedback(String(error));
    } finally {
      setExporting(false);
    }
  }
  const icon = (
    name: string,
    action: () => void,
    glyph: React.ReactNode,
    disabled = false,
  ) => (
    <button
      type="button"
      title={name}
      aria-label={name}
      onClick={action}
      disabled={disabled}
    >
      {glyph}
    </button>
  );
  return createPortal(
    <dialog
      className="diagram-focus"
      ref={dialog}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        if (searchOpen) closeSearch();
        else if (detailsOpen) {
          setDetailsOpen(false);
          setSelection(null);
          setQuery('');
          setChoice(-1);
        } else close.current();
      }}
    >
      <header>
        <strong title={title}>{title}</strong>
        <nav aria-label="Diagram controls">
          {nodes !== null && (
            <button
              ref={searchButton}
              title="Find node"
              aria-label="Find node"
              aria-expanded={searchOpen}
              onClick={() => {
                if (searchOpen) closeSearch();
                else {
                  setDetailsOpen(false);
                  setSearchOpen(true);
                }
              }}
            >
              <Search />
            </button>
          )}
          {nodes !== null && (
            <button
              title="Node details"
              aria-label="Node details"
              aria-expanded={detailsOpen}
              onClick={() => {
                if (detailsOpen) {
                  setDetailsOpen(false);
                  setSelection(null);
                  setQuery('');
                  setChoice(-1);
                } else {
                  setSearchOpen(false);
                  setDetailsOpen(true);
                }
              }}
            >
              <Network />
            </button>
          )}
          {icon(
            'Copy diagram as image',
            () => void exportImage(true),
            <Copy />,
            exporting,
          )}
          {icon(
            'Save diagram as PNG',
            () => void exportImage(false),
            <Download />,
            exporting,
          )}
          <span className="diagram-control-divider" />
          {icon('Zoom out', () => zoom(0.8), <ZoomOut />)}
          <output aria-label="Zoom">{Math.round(view.scale * 100)}%</output>
          {icon('Zoom in', () => zoom(1.25), <ZoomIn />)}
          {icon('Fit diagram', fit, <Maximize />)}
          {icon(
            'Reset to 100%',
            () => {
              fitting.current = false;
              setView({ scale: 1, x: 0, y: 0 });
            },
            <RotateCcw />,
          )}
          {icon('Back to document', () => close.current(), <X />)}
        </nav>
      </header>
      <div className="diagram-focus-body">
        {searchOpen && (
          <section className="diagram-search" aria-label="Find node">
            <div className="diagram-search-heading">
              <strong>Find node</strong>
              {icon('Close search', closeSearch, <X size={16} />)}
            </div>
            <div className="diagram-search-field">
              <Search size={16} />
              <input
                ref={searchInput}
                role="combobox"
                aria-label="Find node by name"
                placeholder="Component name…"
                autoComplete="off"
                aria-expanded={true}
                aria-controls={resultsId}
                aria-autocomplete="list"
                aria-activedescendant={
                  choice >= 0 ? `${resultsId}-${choice}` : undefined
                }
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setChoice(-1);
                  setSelection(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setChoice((v) =>
                      matches.length
                        ? Math.max(
                            0,
                            Math.min(
                              matches.length - 1,
                              v + (e.key === 'ArrowDown' ? 1 : -1),
                            ),
                          )
                        : -1,
                    );
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    activate(Math.max(0, choice));
                  }
                }}
              />
              {query &&
                icon(
                  'Clear search',
                  () => {
                    setQuery('');
                    setChoice(-1);
                    setSelection(null);
                    searchInput.current?.focus();
                  },
                  <X size={14} />,
                )}
            </div>
            <p role="status">
              {!query.trim()
                ? 'Enter a component name'
                : matches.length
                  ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`
                  : 'No matching nodes'}
            </p>
            <div
              className="diagram-search-results"
              role="listbox"
              id={resultsId}
              aria-label="Matching nodes"
            >
              {matches.map((node, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={selection?.id === node.id}
                  className={choice === index ? 'active' : ''}
                  key={node.id}
                  id={`${resultsId}-${index}`}
                  onClick={() => activate(index)}
                >
                  <span>{node.label}</span>
                  <small>{node.id}</small>
                </button>
              ))}
            </div>
          </section>
        )}
        {detailsOpen && (
          <section className="diagram-search" aria-label="Node details">
            <div className="diagram-search-heading">
              <strong>Node details</strong>
              {icon(
                'Clear selection',
                () => {
                  setDetailsOpen(false);
                  setSelection(null);
                  setQuery('');
                  setChoice(-1);
                },
                <X size={16} />,
              )}
            </div>
            {!selection ? (
              <p>Select a node or find one in Search.</p>
            ) : (
              <>
                <p>
                  <strong>
                    {nodeMap.get(selection.id)?.label ?? selection.id}
                  </strong>
                  <br />
                  <small>{selection.id}</small>
                </p>
                {(
                  [
                    'incoming',
                    'outgoing',
                    'two-way',
                    'undirected',
                    'other',
                    'self',
                  ] as const
                ).map((kind) => {
                  const list = visibleConnections.filter(
                    (edge) => edge.kind === kind,
                  );
                  if (!list.length) return null;
                  const heading =
                    kind === 'incoming'
                      ? 'Incoming'
                      : kind === 'outgoing'
                        ? 'Outgoing'
                        : kind === 'two-way'
                          ? 'Two-way'
                          : kind === 'undirected'
                            ? 'Undirected'
                            : kind === 'self'
                              ? 'Self-connections'
                              : 'Other connections';
                  return (
                    <div className="diagram-connection-group" key={kind}>
                      <h3>
                        {heading} · {list.length}
                      </h3>
                      {list.map((edge, i) => {
                        const neighbor =
                          edge.start === selection.id ? edge.end : edge.start;
                        const node = nodeMap.get(neighbor);
                        return (
                          <button
                            key={`${edge.id}-${i}`}
                            onClick={() => selectNode(neighbor, true)}
                          >
                            <span>{node?.label ?? neighbor}</span>
                            <small>
                              {neighbor} · {edge.label || 'No label'}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                {visibleConnections.length === 0 &&
                  excludedConnections === 0 && <p>No direct connections</p>}
                {excludedConnections > 0 && (
                  <p>
                    {excludedConnections} connections to groups or boundaries
                    excluded
                  </p>
                )}
              </>
            )}
          </section>
        )}
        <div
          ref={stage}
          tabIndex={0}
          className="diagram-focus-stage"
          aria-label="Diagram canvas"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            const target = (e.target as Element).closest<SVGGElement>(
              'g.pele-node[data-id]',
            );
            e.currentTarget.focus();
            fitting.current = false;
            drag.current = {
              x: e.clientX - view.x,
              y: e.clientY - view.y,
              startX: e.clientX,
              startY: e.clientY,
              nodeId: target?.dataset.id,
              moved: false,
            };
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (drag.current) {
              const start = drag.current;
              if (
                Math.hypot(e.clientX - start.startX, e.clientY - start.startY) >
                6
              )
                start.moved = true;
              if (!start.moved) return;
              setView((v) => ({
                ...v,
                x: e.clientX - start.x,
                y: e.clientY - start.y,
              }));
            }
          }}
          onPointerUp={() => {
            const point = drag.current;
            if (point?.nodeId && !point.moved) selectNode(point.nodeId);
            suppressBackgroundClick.current = Boolean(
              point?.moved || point?.nodeId,
            );
            drag.current = null;
          }}
          onClick={(e) => {
            if (suppressBackgroundClick.current) {
              suppressBackgroundClick.current = false;
              return;
            }
            if (e.target === e.currentTarget) {
              setSelection(null);
              setDetailsOpen(false);
              setQuery('');
              setChoice(-1);
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === '+' || e.key === '=') {
              e.preventDefault();
              zoom(1.25);
            } else if (e.key === '-') {
              e.preventDefault();
              zoom(0.8);
            } else if (e.key === '0') {
              e.preventDefault();
              fit();
            } else if (e.key.startsWith('Arrow')) {
              e.preventDefault();
              fitting.current = false;
              setView((v) => ({
                ...v,
                x:
                  v.x +
                  (e.key === 'ArrowLeft'
                    ? 30
                    : e.key === 'ArrowRight'
                      ? -30
                      : 0),
                y:
                  v.y +
                  (e.key === 'ArrowUp' ? 30 : e.key === 'ArrowDown' ? -30 : 0),
              }));
            }
          }}
        >
          <div
            ref={art}
            className="diagram-focus-art"
            style={{
              width: dimensions.width,
              height: dimensions.height,
              transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: markup }} />
            {selection && (
              <div
                className="diagram-node-highlight"
                aria-hidden="true"
                style={{
                  left: selection.box.x + dimensions.width / 2 - 6,
                  top: selection.box.y + dimensions.height / 2 - 6,
                  width: selection.box.width + 12,
                  height: selection.box.height + 12,
                  borderWidth: 2 / view.scale,
                  boxShadow: `0 0 0 ${2 / view.scale}px white`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      {feedback && (
        <div className="diagram-focus-feedback" role="status">
          {feedback}
        </div>
      )}
    </dialog>,
    document.body,
  );
}
