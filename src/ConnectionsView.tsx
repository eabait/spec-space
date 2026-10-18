import { RefreshCw, ExternalLink } from 'lucide-react';
import { ConnectionGraph } from './ConnectionGraph';
import type { ConnectionIndex, Reference } from './connections';

export function ConnectionsView({
  index,
  selected,
  dirty,
  loading,
  error,
  onRefresh,
  onOpen,
  onEdit,
}: {
  index: ConnectionIndex | null;
  selected: string;
  dirty: boolean;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onOpen: (path: string) => void;
  onEdit: () => void;
}) {
  const outgoing = index?.references.filter((r) => r.source === selected) ?? [];
  const incoming =
    index?.references.filter(
      (r) => r.target === selected && r.status === 'resolved',
    ) ?? [];
  const broken = index?.references.filter((r) => r.status === 'missing') ?? [];
  function referenceList(
    references: Reference[],
    direction: 'outgoing' | 'incoming',
  ) {
    return (
      <ul className="reference-list">
        {references.map((r) => (
          <li key={JSON.stringify([r.source, r.target])}>
            <button
              disabled={r.status !== 'resolved'}
              onClick={() =>
                onOpen(direction === 'outgoing' ? r.target : r.source)
              }
            >
              {direction === 'outgoing' ? r.target : r.source}
            </button>
            {r.status !== 'resolved' && (
              <span className={`reference-state ${r.status}`}>
                {r.status === 'missing'
                  ? 'Missing document'
                  : r.status === 'excluded'
                    ? 'Outside index scope'
                    : 'Unavailable / not indexed'}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <section className="connections-view" aria-label="Connected specifications">
      <div className="connections-heading">
        <div>
          <div className="eyebrow">CONNECTED SPECIFICATIONS</div>
          <h1>Explore your documents</h1>
          <p>
            {index
              ? `${index.documents.length} documents · ${index.references.filter((r) => r.status === 'resolved').length} references · ${broken.length} broken`
              : 'Build a map of your workspace.'}
          </p>
        </div>
        <button disabled={loading} onClick={onRefresh}>
          <RefreshCw size={15} />
          Refresh connections
        </button>
      </div>
      <div className="connections-note" role="status">
        {loading
          ? 'Reading saved Markdown files…'
          : 'Connections reflect saved files. Refresh to include external changes.'}
        {dirty && ' This document has unsaved edits.'}
      </div>
      {error && (
        <div role="alert" className="connection-warning">
          {index
            ? 'Connections are stale. '
            : 'Connections could not be loaded. '}
          {error}
          <button onClick={onRefresh}>Retry</button>
        </div>
      )}
      {index && (!index.complete || index.unavailable.length > 0) && (
        <details className="connection-warning">
          <summary>
            {index.complete
              ? 'Some documents could not be read'
              : 'Incomplete workspace scan'}{' '}
            ({index.unavailable.length})
          </summary>
          <ul>
            {index.unavailable.map((issue, i) => (
              <li key={i}>
                {issue.path || 'Workspace'}: {issue.message}
              </li>
            ))}
          </ul>
        </details>
      )}
      {index && index.documents.length > 0 ? (
        <div className="connections-body">
          <ConnectionGraph index={index} selected={selected} onOpen={onOpen} />
          <div className="connections-details">
            <h2>{selected || 'Select a document'}</h2>
            {selected && (
              <button className="edit-document" onClick={onEdit}>
                <ExternalLink size={14} />
                Go to editor
              </button>
            )}
            <h3>
              References <span>{outgoing.length}</span>
            </h3>
            {outgoing.length ? (
              referenceList(outgoing, 'outgoing')
            ) : (
              <p>No outgoing document references.</p>
            )}
            <h3>
              Backlinks <span>{incoming.length}</span>
            </h3>
            {incoming.length ? (
              referenceList(incoming, 'incoming')
            ) : (
              <p>No documents reference this document.</p>
            )}
            <details className="workspace-documents">
              <summary>All documents ({index.documents.length})</summary>
              <ul className="reference-list">
                {index.documents.map((doc) => (
                  <li key={doc.path}>
                    <button onClick={() => onOpen(doc.path)}>{doc.path}</button>
                  </li>
                ))}
              </ul>
            </details>
            <details className="broken-documents" open={broken.length > 0}>
              <summary>Broken references ({broken.length})</summary>
              {broken.length ? (
                <ul className="reference-list">
                  {broken.map((r) => (
                    <li key={JSON.stringify([r.source, r.target])}>
                      <button onClick={() => onOpen(r.source)}>
                        {r.source}
                      </button>
                      <span className="reference-state missing">
                        Missing: {r.target}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No missing document targets found.</p>
              )}
            </details>
          </div>
        </div>
      ) : (
        !loading &&
        !error && (
          <div className="connections-empty">
            <h2>No Markdown documents to connect</h2>
            <p>Add .md or .markdown files to this workspace, then refresh.</p>
          </div>
        )
      )}
    </section>
  );
}
