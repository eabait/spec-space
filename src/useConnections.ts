import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  buildConnections,
  resolveTargets,
  uncheckedTargets,
  type ConnectionIndex,
  type Snapshot,
  type TargetCheck,
} from './connections';

export function useConnections() {
  const [index, setIndex] = useState<ConnectionIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  function reset() {
    setIndex(null);
    setError('');
  }
  // Called inside App's serialized actions, so a workspace cannot switch mid-scan.
  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const snapshot = await invoke<Snapshot>('workspace_snapshot');
      let next = buildConnections(snapshot);
      const targets = uncheckedTargets(next);
      const checks: TargetCheck[] = [];
      for (let offset = 0; offset < targets.length; offset += 500) {
        checks.push(
          ...(await invoke<TargetCheck[]>('check_reference_targets', {
            paths: targets.slice(offset, offset + 500),
          })),
        );
      }
      next = resolveTargets(next, checks);
      setIndex(next);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }
  return { index, loading, error, reset, refresh };
}
