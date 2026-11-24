/**
 * @fileExemption Dépassement nominal justifié par l'orchestration du graphe nodal, interactions pointer et unicité du bloc Start.
 * Orchestration réactive du canvas nodal.
 */

import { useState, useCallback } from 'preact/hooks';
import type { NodeType } from '../../../types/models/node.model.js';
import type { Scenario } from '../../../types/models/scenario.model.js';
import { validateGraph } from '../../../domain/graph/graph-integrity.validator.js';
import type {
  Point,
  CanvasDocument,
  AddBlockResult,
  WireResult,
  BooleanFlag,
} from '../../types/canvas.types.js';
import type { HttpClient } from '../../api/http.client.js';
import {
  LAUNCH_BUTTON_LABEL,
  isStudioGraphLocked,
  createCanvasDocument,
  buildScenarioPersistPayload,
} from './canvas-document.factory.js';
import {
  addBlock,
  removeBlock,
  removeConnection,
  moveBlock,
  wireOriented,
  updateConnectionKey,
  updateConnectionPower,
} from './canvas-mutations.helper.js';

export type { CanvasDocument, AddBlockResult, WireResult };
export {
  LAUNCH_BUTTON_LABEL,
  isStudioGraphLocked,
  createCanvasDocument,
  buildScenarioPersistPayload,
  addBlock,
  removeBlock,
  removeConnection,
  moveBlock,
  wireOriented,
  updateConnectionKey,
  updateConnectionPower,
};

/**
 * Lance l'exécution d'un scénario via l'API REST avec garde anti-double-clic.
 * @param doc Document canvas
 * @param http Client HTTP
 */
export async function tryLaunchScenario(doc: CanvasDocument, http: HttpClient) {
  if ((doc as { runnerStatus?: string }).runnerStatus === 'running') {
    return { ok: false as BooleanFlag, error: "L'exécution du scénario est déjà en cours." };
  }
  const errors = validateGraph(doc.nodes, doc.connections);
  if (errors.length > 0) return { ok: false as BooleanFlag, error: errors[0] };
  try {
    const res = await http.post<{
      success?: unknown;
      ok?: unknown;
      runId?: string;
      message?: string;
    }>(`/api/scenarios/${doc.scenarioId}/run`);
    if (res.success === false || res.ok === false) {
      return {
        ok: false as BooleanFlag,
        error: res.message || 'Le démarrage du scénario a été refusé.',
      };
    }
    return {
      ok: true as BooleanFlag,
      runId: res.runId,
      launchButtonDisabled: true as BooleanFlag,
      startNodeStatus: 'running',
    };
  } catch (err: unknown) {
    return {
      ok: false as BooleanFlag,
      error: err instanceof Error ? err.message : `${err}`,
    };
  }
}

export {
  attachCanvasInteractions,
  type CanvasInteractionsHandle,
} from './use-canvas-interactions.hook.js';

/**
 * Hook d'état réactif pour la gestion complète du graphe nodal Canvas.
 * @param initialScenarioId Identifiant du scénario
 * @param initialDoc Scénario initial
 */
export function useCanvasState(initialScenarioId: string, initialDoc?: Scenario) {
  const [doc, setDoc] = useState(() => createCanvasDocument(initialScenarioId, initialDoc));
  const onAddBlock = useCallback((type: NodeType, pos: Point) => {
    setDoc((d) => {
      const r = addBlock(d, type, pos);
      return r.ok ? r.document : d;
    });
  }, []);
  const onRemoveBlock = useCallback((nodeId: string) => {
    setDoc((d) => removeBlock(d, nodeId));
  }, []);
  const onMoveBlock = useCallback((nodeId: string, pos: Point) => {
    setDoc((d) => moveBlock(d, nodeId, pos));
  }, []);
  const onWire = useCallback((opts: Parameters<typeof wireOriented>[1]) => {
    setDoc((d) => {
      const r = wireOriented(d, opts);
      return r.ok ? r.document : d;
    });
  }, []);
  return { doc, setDoc, onAddBlock, onRemoveBlock, onMoveBlock, onWire };
}
