/**
 * Validation d'intégrité structurelle du graphe (DOM-008 / SPEC-DATA-03).
 * Start unique (REQ-015), 0 entrée Start (R-20), références de nœuds valides.
 * CallScenario : targetScenarioId (REQ-041) si options fournies.
 * Fonction pure, zéro I/O.
 */

import type { Connection } from '../../types/models/connection.model.js';
import type { ScenarioNode } from '../../types/models/node.model.js';
import { validateCommandNodes } from './command-node.validator.js';

/** Options de validation CallScenario (SPEC-DATA-03 / AC-DATA-03-7). */
export interface GraphValidateOptions {
  readonly scenarioId?: string;
  readonly scenarioExists?: (id: string) => boolean;
}

function getEndpointIds(conn: Connection) {
  return {
    srcId: conn.sourceNodeId || conn.from || '',
    tgtId: conn.targetNodeId || conn.to || '',
  };
}

function validateCallScenarioNodes(
  nodes: readonly ScenarioNode[],
  options: GraphValidateOptions | undefined,
) {
  const errors: string[] = [];
  for (const node of nodes) {
    if (node.type !== 'callScenario') continue;
    const raw = node.targetScenarioId;
    const target = typeof raw === 'string' ? raw.trim() : '';
    if (!target) {
      errors.push(`CallScenario "${node.id}" : targetScenarioId vide ou manquant (REQ-041)`);
      continue;
    }
    if (options?.scenarioExists && !options.scenarioExists(target)) {
      errors.push(`CallScenario "${node.id}" : scénario cible "${target}" introuvable (REQ-041)`);
    }
  }
  return errors;
}

/**
 * Valide l'intégrité structurelle du graphe de scénario (Start unique, pas d'entrée sur Start, références valides).
 *
 * @param nodes Liste des nœuds du graphe
 * @param connections Liste des connexions du graphe
 * @param options Contexte optionnel pour valider les nœuds CallScenario
 * @returns Tableau de messages d'erreur en français ; vide si valide
 */
export function validateGraph(
  nodes: readonly ScenarioNode[],
  connections: readonly Connection[],
  options?: GraphValidateOptions,
) {
  const errors: string[] = [];
  const starts = nodes.filter((n) => n.type === 'start');

  if (starts.length === 0) {
    errors.push('Bloc Start absent ou manquant dans le graphe');
  } else if (starts.length > 1) {
    errors.push(
      `Le graphe doit contenir un Start unique ; plusieurs (${String(starts.length)}) détectés`,
    );
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const startIds = new Set(starts.map((s) => s.id));

  for (const connection of connections) {
    const { srcId, tgtId } = getEndpointIds(connection);
    if (startIds.has(tgtId)) {
      errors.push(`Connexion entrante vers le Start (${tgtId}) interdite (R-20)`);
    }
    if (!nodeIds.has(srcId)) {
      errors.push(`Référence invalide : nœud source inexistant "${srcId}"`);
    }
    if (!nodeIds.has(tgtId)) {
      errors.push(`Référence invalide : nœud cible inexistant "${tgtId}"`);
    }
  }

  return [...errors, ...validateCallScenarioNodes(nodes, options), ...validateCommandNodes(nodes)];
}
