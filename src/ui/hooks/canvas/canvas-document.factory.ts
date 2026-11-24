/**
 * Fabrique et sérialisation du document canvas (load/save, strip no-save).
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import { stripScenarioNodesNoSave } from '../../../domain/graph/node-transient-keys.constant.js';
import type { CanvasDocument } from '../../types/canvas.types.js';

/** Libellé officiel français du bouton de lancement. */
export const LAUNCH_BUTTON_LABEL = 'Lancer le scénario';

/**
 * Verrou édition / Enregistrer pendant un run actif (AC-UI-02-9, front only).
 * @param flags États d'exécution Studio / snapshot
 */
export function isStudioGraphLocked(flags: {
  readonly isRunning?: boolean;
  readonly isLaunchLocked?: boolean;
  readonly isBusy?: boolean;
}) {
  return Boolean(flags.isRunning || flags.isLaunchLocked || flags.isBusy);
}

/**
 * Crée un document canvas vierge ou basé sur un scénario existant.
 * @param scenarioId Identifiant unique du scénario
 * @param initialDoc Document partiel initial optionnel
 */
export function createCanvasDocument(
  scenarioId: string,
  initialDoc?: Partial<Scenario> | Partial<CanvasDocument>,
) {
  return {
    scenarioId,
    name: (initialDoc as { name?: string })?.name ?? scenarioId,
    description: (initialDoc as { description?: string })?.description,
    nodes: initialDoc?.nodes ? stripScenarioNodesNoSave(initialDoc.nodes) : [],
    connections: initialDoc?.connections ? [...initialDoc.connections] : [],
    viewport: (initialDoc as Partial<CanvasDocument>)?.viewport ?? { x: 0, y: 0, zoom: 1 },
    runnerStatus: (initialDoc as { runnerStatus?: string })?.runnerStatus,
    _counters: (initialDoc as { _counters?: Record<string, number> })?._counters ?? {},
  } as CanvasDocument;
}

/**
 * Construit le payload scénario persistable (strip no-save, DOM-018 / AC-UI-02-8).
 * @param doc Document canvas courant
 */
export function buildScenarioPersistPayload(doc: CanvasDocument) {
  return {
    id: doc.scenarioId,
    name: doc.name || doc.scenarioId,
    description: doc.description,
    nodes: stripScenarioNodesNoSave(doc.nodes),
    connections: [...doc.connections],
  } as Scenario & { description?: string };
}
