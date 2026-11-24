/**
 * Hook dédié au suivi de l'état de synchronisation et de persistance du scénario.
 */

import { stripScenarioNodesNoSave } from '../../../domain/graph/node-transient-keys.constant.js';
import type { Scenario } from '../../../types/models/scenario.model.js';
import type { CanvasDocument } from '../../types/canvas.types.js';
import { safeUseState } from './studio-preact-safe.helper.js';

function resolveScenarioIdentity(doc: Partial<CanvasDocument> & Partial<Scenario>) {
  const id = doc.scenarioId ?? doc.id ?? '';
  return { id, name: doc.name || id };
}

/**
 * Calcule l'empreinte déterministe normalisée du scénario persistable.
 *
 * @param doc - Document canvas ou scénario à sérialiser.
 */
export function computeScenarioSnapshot(
  doc: Partial<CanvasDocument> | Partial<Scenario> | null | undefined,
) {
  if (!doc) return '';
  const identity = resolveScenarioIdentity(doc as Partial<CanvasDocument> & Partial<Scenario>);
  const payload = {
    id: identity.id,
    name: identity.name,
    nodes: stripScenarioNodesNoSave(doc.nodes ?? []),
    connections: [...(doc.connections ?? [])],
  };
  return JSON.stringify(payload);
}

/**
 * Vérifie si le document courant correspond exactement au dernier snapshot sauvegardé.
 *
 * @param doc - Document canvas courant.
 * @param savedSnapshot - Empreinte JSON du dernier état enregistré.
 */
export function isScenarioSaved(doc: CanvasDocument, savedSnapshot: string | null) {
  if (savedSnapshot === null) return false;
  return computeScenarioSnapshot(doc) === savedSnapshot;
}

/**
 * Hook de suivi de synchronisation pour bloquer le lancement en cas de modifications non enregistrées.
 *
 * @param doc - Document canvas courant en mémoire.
 */
export function useScenarioSaveState(doc: CanvasDocument) {
  const [savedSnapshot, setSavedSnapshot] = safeUseState<string | null>(null);

  const isSaved = isScenarioSaved(doc, savedSnapshot);

  const markSaved = (savedDoc?: CanvasDocument | Scenario) => {
    setSavedSnapshot(computeScenarioSnapshot(savedDoc ?? doc));
  };

  const markLoaded = (loadedScenario: Scenario) => {
    setSavedSnapshot(computeScenarioSnapshot(loadedScenario));
  };

  return {
    isSaved,
    markSaved,
    markLoaded,
  };
}
