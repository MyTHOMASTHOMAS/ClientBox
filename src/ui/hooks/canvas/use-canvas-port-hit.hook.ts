/**
 * Détection et hit-test des ports nodaux d'entrée pour le canvas.
 */

import { assignDefaultKey } from '../../../domain/keys/key-assigner.domain.js';
import type { Scenario } from '../../../types/models/scenario.model.js';
import type { ScenarioConnection } from '../../types/canvas.types.js';
import { portAnchor } from './use-canvas-geometry.hook.js';

/** Rayon de tolérance en pixels pour le hit-test d'un port nodal. */
export const PORT_HIT_RADIUS_PX = 12;

/**
 * Recherche le port d'entrée le plus proche d'un point dans le rayon de tolérance.
 *
 * @param scenario - Scénario contenant les blocs.
 * @param canvasPoint - Coordonnées 2D du pointeur dans le canvas.
 * @param excludeNodeId - Identifiant du bloc source à ignorer.
 */
export function findInputPortHit(
  scenario: Scenario,
  canvasPoint: { x: number; y: number },
  excludeNodeId: string,
) {
  let best: { nodeId: string; portIndex: number; dist: number } | null = null;
  for (const node of scenario.nodes) {
    if (node.id === excludeNodeId || node.type === 'start') continue;
    const pos = portAnchor({ nodePos: node.position, type: 'input', portIndex: 0, totalPorts: 1 });
    const dist = Math.hypot(pos.x - canvasPoint.x, pos.y - canvasPoint.y);
    if (dist <= PORT_HIT_RADIUS_PX && (!best || dist < best.dist)) {
      best = { nodeId: node.id, portIndex: 0, dist };
    }
  }
  return best ? { nodeId: best.nodeId, portIndex: best.portIndex } : null;
}

/** Options pour l'ajout d'une connexion orientée dans le scénario. */
export interface AppendConnectionOptions {
  scenario: Scenario;
  sourceNodeId: string;
  sourcePortIndex: number;
  targetNodeId: string;
  targetPortIndex: number;
}

/**
 * Ajoute une connexion orientée avec clé par défaut au graphe de scénario.
 *
 * @param options - Paramètres de connexion source et cible.
 */
export function appendOrientedConnection(options: AppendConnectionOptions) {
  const connection: ScenarioConnection = {
    sourceNodeId: options.sourceNodeId,
    sourcePortIndex: options.sourcePortIndex,
    targetNodeId: options.targetNodeId,
    targetPortIndex: options.targetPortIndex,
    key: assignDefaultKey(options.scenario.connections, options.targetNodeId),
    power: 1,
  };
  return {
    ...options.scenario,
    connections: [...options.scenario.connections, connection],
  };
}
