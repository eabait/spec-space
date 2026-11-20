import { useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useReactFlow,
  type NodeProps,
  type Viewport,
} from '@xyflow/react';
import { ArrowLeft, Focus, Minus, Plus, Search, X } from 'lucide-react';
import {
  childViews,
  type ArchitectureModel,
  type Diagnostic,
  type ParseOutcome,
} from './adapter';
import type { ArchitectureNode, layoutView } from './layout';
import '@xyflow/react/dist/style.css';
import './architecture.css';

function ElementNode({ data, selected }: NodeProps<ArchitectureNode>) {
  return (
    <div
      className={`architecture-node ${data.boundary ? 'is-boundary' : ''} ${selected ? 'is-selected' : ''}`}
      data-shape={data.shape}
      style={data.appearance}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <strong>{data.label}</strong>
      <span>{data.kind.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
      {data.technology && <small>{data.technology}</small>}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}

const nodeTypes = { architectureElement: ElementNode };
type Layout = ReturnType<typeof layoutView>;
type WorkerResponse =
  | { type: 'parsed'; version: number; outcome: ParseOutcome }
  | { type: 'layout'; version: number; key: string; layout: Layout }
  | { type: 'failure'; version: number; message: string };
interface Presentation {
  viewport?: Viewport;
  selected?: string;
}

function Explorer({ content, visible }: { content: string; visible: boolean }) {
  const [model, setModel] = useState<ArchitectureModel>();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [parsing, setParsing] = useState(true);
  const [stale, setStale] = useState(false);
  const [viewKey, setViewKey] = useState('');
  const [layout, setLayout] = useState<Layout>();
  const [displayedKey, setDisplayedKey] = useState('');
  const [layingOut, setLayingOut] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const presentations = useRef(new Map<string, Presentation>());
  const worker = useRef<Worker>(undefined);
  const version = useRef(0);
  const requestedKey = useRef('');
  const parseValid = useRef(false);
  const flow = useReactFlow<ArchitectureNode>();

  useEffect(() => {
    const parser = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.current = parser;
    parser.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (response.version !== version.current) return;
      if (response.type === 'parsed') {
        setParsing(false);
        setDiagnostics(response.outcome.diagnostics);
        parseValid.current = !!response.outcome.model;
        if (response.outcome.model) {
          const nextModel = response.outcome.model;
          setModel(nextModel);
          setStale(false);
          if (!nextModel.views.length) {
            setLayout(undefined);
            setSelectedId(undefined);
            setLayingOut(false);
          }
          setViewKey((current) =>
            nextModel.views.some((view) => view.key === current)
              ? current
              : (nextModel.views[0]?.key ?? ''),
          );
        } else {
          setStale(true);
          setLayingOut(false);
        }
      } else if (
        response.type === 'layout' &&
        response.key === requestedKey.current
      ) {
        setLayout(response.layout);
        setDisplayedKey(response.key);
        setLayingOut(false);
      } else if (response.type === 'failure') {
        parseValid.current = false;
        setParsing(false);
        setLayingOut(false);
        setStale(true);
        setDiagnostics([{ severity: 'error', message: response.message }]);
      }
    };
    parser.onerror = () => {
      setParsing(false);
      setLayingOut(false);
      setStale(true);
      setDiagnostics([
        {
          severity: 'error',
          message:
            'The local architecture worker failed. Reopen this document to retry. Your source is preserved.',
        },
      ]);
    };
    return () => {
      parser.terminate();
      worker.current = undefined;
    };
  }, []);

  useEffect(() => {
    const nextVersion = ++version.current;
    parseValid.current = false;
    setParsing(true);
    setStale(true);
    const timer = setTimeout(
      () =>
        worker.current?.postMessage({
          type: 'parse',
          version: nextVersion,
          source: content,
        }),
      180,
    );
    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    if (!model || !viewKey || !parseValid.current) return;
    requestedKey.current = viewKey;
    setLayingOut(true);
    worker.current?.postMessage({
      type: 'layout',
      version: version.current,
      key: viewKey,
    });
    const remembered = presentations.current.get(viewKey)?.selected;
    setSelectedId(
      model.views
        .find((view) => view.key === viewKey)
        ?.elements.some((element) => element.id === remembered)
        ? remembered
        : undefined,
    );
  }, [model, viewKey]);

  useEffect(() => {
    if (!layout || !visible || layingOut) return;
    const saved = presentations.current.get(viewKey)?.viewport;
    const timer = requestAnimationFrame(() => {
      if (saved) void flow.setViewport(saved);
      else void flow.fitView({ padding: 0.16 });
    });
    return () => cancelAnimationFrame(timer);
  }, [layout, visible, layingOut, viewKey, flow]);

  const view = model?.views.find((candidate) => candidate.key === viewKey);
  const members = new Set(view?.elements.map((element) => element.id));
  const elements =
    model?.elements.filter((element) => members.has(element.id)) ?? [];
  const selected = model?.elements.find((element) => element.id === selectedId);
  const search = query.trim().toLocaleLowerCase();
  const results = search
    ? elements.filter((element) =>
        element.name.toLocaleLowerCase().includes(search),
      )
    : [];
  const relationships =
    selected && model
      ? model.workspace.model.relationships.filter(
          (relationship) =>
            relationship.sourceId === selected.id ||
            relationship.destinationId === selected.id,
        )
      : [];
  const children = selected && model ? childViews(model, selected, view) : [];
  const disabled = parsing || stale || layingOut;

  function select(id: string) {
    if (disabled) return;
    setSelectedId(id);
    presentations.current.set(viewKey, {
      ...presentations.current.get(viewKey),
      selected: id,
    });
    void flow.fitView({ nodes: [{ id }], padding: 0.7, maxZoom: 1.15 });
  }
  function navigate(key: string, back = false) {
    if (!back) setHistory((current) => [...current, viewKey]);
    presentations.current.set(viewKey, {
      viewport: flow.getViewport(),
      selected: selectedId,
    });
    setQuery('');
    setViewKey(key);
  }

  return (
    <section
      className="architecture-explorer"
      aria-label="Structurizr architecture explorer"
    >
      <div className="architecture-toolbar">
        <button
          aria-label="Back to previous architecture view"
          title="Back to previous view"
          disabled={disabled || !history.length}
          onClick={() => {
            const previous = history.at(-1)!;
            setHistory((current) => current.slice(0, -1));
            if (model?.views.some((candidate) => candidate.key === previous))
              navigate(previous, true);
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <select
          aria-label="Architecture view"
          value={viewKey}
          disabled={disabled || !model?.views.length}
          onChange={(event) => navigate(event.target.value)}
        >
          {!model?.views.length && <option value="">No supported views</option>}
          {model?.views.map((candidate) => (
            <option key={candidate.key} value={candidate.key}>
              {candidate.title ?? candidate.key} · {candidate.type}
              {candidate.autoView ? ' · Inferred' : ''}
            </option>
          ))}
        </select>
        <button
          aria-label="Zoom out architecture"
          title="Zoom out"
          disabled={disabled}
          onClick={() => void flow.zoomOut()}
        >
          <Minus size={15} />
        </button>
        <button
          aria-label="Zoom in architecture"
          title="Zoom in"
          disabled={disabled}
          onClick={() => void flow.zoomIn()}
        >
          <Plus size={15} />
        </button>
        <button
          aria-label="Fit architecture"
          title="Fit view"
          disabled={disabled}
          onClick={() => void flow.fitView({ padding: 0.16 })}
        >
          <Focus size={16} />
        </button>
      </div>
      {(parsing || layingOut || stale || view?.autoView) && (
        <p role="status" className="architecture-state">
          {parsing
            ? 'Updating architecture…'
            : layingOut
              ? 'Arranging view…'
              : stale
                ? layout
                  ? 'Stale diagram · source has parsing errors'
                  : 'Correct the source to render this architecture.'
                : 'Inferred view · generated locally from this model'}
        </p>
      )}
      {!!diagnostics.length && (
        <details
          className="architecture-diagnostics"
          open={diagnostics.some(
            (diagnostic) => diagnostic.severity === 'error',
          )}
        >
          <summary>
            {diagnostics.some((diagnostic) => diagnostic.severity === 'error')
              ? 'Parsing errors'
              : 'Incomplete coverage'}{' '}
            · {diagnostics.length} diagnostic
            {diagnostics.length === 1 ? '' : 's'}
          </summary>
          <ul>
            {diagnostics.map((diagnostic, index) => (
              <li key={index}>
                {diagnostic.line
                  ? `Line ${diagnostic.line}, column ${diagnostic.column ?? 1} · `
                  : ''}
                {diagnostic.message}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="architecture-body">
        <div
          className="architecture-canvas"
          aria-label={
            view
              ? `Architecture canvas ${view.title ?? view.key}`
              : 'Architecture canvas'
          }
          aria-busy={parsing || layingOut}
        >
          {layout && (
            <ReactFlow<ArchitectureNode>
              nodes={layout.nodes.map((node) => ({
                ...node,
                selected: node.id === selectedId,
              }))}
              edges={layout.edges}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={!disabled}
              disableKeyboardA11y
              panOnDrag
              minZoom={0.08}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_event, node) => {
                if (!disabled && members.has(node.id)) select(node.id);
              }}
              onMoveEnd={(_event, viewport) => {
                if (!disabled && displayedKey === viewKey)
                  presentations.current.set(displayedKey, {
                    ...presentations.current.get(displayedKey),
                    viewport,
                  });
              }}
              deleteKeyCode={null}
              selectionKeyCode={null}
              multiSelectionKeyCode={null}
              zoomActivationKeyCode={null}
              panActivationKeyCode={null}
            />
          )}
          {!layout && !parsing && (
            <p className="architecture-empty">
              {model?.views.length
                ? 'Choose a supported view.'
                : 'No supported architecture views are available.'}
            </p>
          )}
        </div>
        <aside
          className="architecture-inspector"
          aria-label="Architecture element details"
        >
          <label className="architecture-search">
            <Search size={15} />
            <input
              aria-label="Search architecture elements"
              placeholder="Find element…"
              value={query}
              disabled={disabled}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                aria-label="Clear element search"
                onClick={() => setQuery('')}
              >
                <X size={13} />
              </button>
            )}
          </label>
          {search && (
            <div
              className="architecture-results"
              aria-label="Element search results"
            >
              {results.length ? (
                results.map((element) => (
                  <button
                    disabled={disabled}
                    key={element.id}
                    onClick={() => select(element.id)}
                  >
                    <strong>{element.name}</strong>
                    <small>
                      {element.type} · {element.id}
                    </small>
                  </button>
                ))
              ) : (
                <p>No matching elements in this view.</p>
              )}
            </div>
          )}
          {!selected && !search && (
            <div className="architecture-elements">
              <p>Select an element to inspect it.</p>
              {elements.map((element) => (
                <button
                  aria-label={`${element.name} ${element.type} · ${element.id}`}
                  disabled={disabled}
                  key={element.id}
                  onClick={() => select(element.id)}
                >
                  {element.name}
                  <small>
                    {element.type} · {element.id}
                  </small>
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="architecture-element-details">
              <h3>{selected.name}</h3>
              <code>{selected.id}</code>
              <p>{selected.description || 'No description provided.'}</p>
              {'technology' in selected && selected.technology && (
                <p>
                  <strong>Technology</strong>
                  <br />
                  {selected.technology}
                </p>
              )}
              <p>
                <strong>Tags</strong>
                <br />
                {selected.tags.length ? selected.tags.join(', ') : 'No tags'}
              </p>
              <h4>Child views</h4>
              {children.length ? (
                children.map((child) => (
                  <button
                    key={child.key}
                    disabled={disabled}
                    onClick={() => navigate(child.key)}
                  >
                    {child.title ?? child.key}
                  </button>
                ))
              ) : (
                <p>No child view is available.</p>
              )}
              <h4>Direct relationships</h4>
              {relationships.length ? (
                relationships.map((relationship) => {
                  const otherId =
                    relationship.sourceId === selected.id
                      ? relationship.destinationId
                      : relationship.sourceId;
                  const other = model!.elements.find(
                    (element) => element.id === otherId,
                  );
                  const inView = members.has(otherId);
                  return (
                    <div
                      key={relationship.id}
                      className="architecture-relationship"
                    >
                      <span>
                        {relationship.sourceId === selected.id
                          ? 'Outgoing'
                          : 'Incoming'}
                      </span>
                      <p>
                        {relationship.description || 'No description'}
                        {relationship.technology
                          ? ` · ${relationship.technology}`
                          : ''}
                      </p>
                      <button
                        aria-label={`${other?.name ?? otherId} ${otherId}${inView ? '' : ' · Outside this view'}`}
                        disabled={!inView || disabled}
                        onClick={() => select(otherId)}
                      >
                        {other?.name ?? otherId}
                        <small>
                          {otherId}
                          {inView ? '' : ' · Outside this view'}
                        </small>
                      </button>
                    </div>
                  );
                })
              ) : (
                <p>No direct relationships.</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export default function ArchitectureExplorer(props: {
  content: string;
  visible: boolean;
}) {
  return (
    <ReactFlowProvider>
      <Explorer {...props} />
    </ReactFlowProvider>
  );
}
