/**
 * Handlers SSE Studio (statusChanged / blockStatus).
 */

import type { CanvasDocument } from '../../types/canvas.types.js';
import type { ScenarioStreamOptions } from './studio-execution.options.js';

/**
 * Applique un changement de statut runner au Studio.
 * @param options Options stream
 * @param status Statut reçu
 */
export function applyStreamStatus(options: ScenarioStreamOptions, status: string) {
  const isEnded = status === 'completed' || status === 'stopped' || status === 'error';
  if (!isEnded) {
    if (status === 'running') options.setIsRunning(true);
    return;
  }
  options.setIsRunning(false);
  options.setLaunchLocked?.(false);
  if (status !== 'stopped') return;
  options.setDoc((prev) => ({
    ...prev,
    nodes: prev.nodes.map((n) =>
      n.status === 'running' || n.status === 'paused' ? { ...n, status: 'idle' } : n,
    ),
  }));
}

/**
 * Applique un statut de bloc reçu via SSE.
 * @param setDoc Setter document
 * @param raw Payload brut
 */
export function applyStreamBlockStatus(
  setDoc: (setter: (prev: CanvasDocument) => CanvasDocument) => void,
  raw: unknown,
) {
  const payload = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const nodeId = typeof payload.nodeId === 'string' ? payload.nodeId : undefined;
  const fromBlock = typeof payload.blockStatus === 'string' ? payload.blockStatus : undefined;
  const fromStatus = typeof payload.status === 'string' ? payload.status : undefined;
  const status = fromBlock ?? fromStatus;
  if (!nodeId || !status) return;
  setDoc((prev) => ({
    ...prev,
    nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, status } : n)),
  }));
}
