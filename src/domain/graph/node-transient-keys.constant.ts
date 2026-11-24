/**
 * Liste canonique des champs de nœud exclus du JSON scénario (SPEC-DATA-03 / AC-DATA-03-6).
 * Volatils : canvas UI, runner / snapshot `/run` — jamais sous `.agents/data/scenarios/`.
 */

import type { ScenarioNode } from '../../types/models/node.model.js';

/** Clés de nœud interdites à la persistance scénario (no-save). */
export const SCENARIO_NODE_NO_SAVE_KEYS = ['status'] as const;

/** Union des clés no-save. */
export type ScenarioNodeNoSaveKey = (typeof SCENARIO_NODE_NO_SAVE_KEYS)[number];

/** Nœud persistable (champs no-save retirés). */
export type ScenarioNodePersisted = Omit<ScenarioNode, ScenarioNodeNoSaveKey>;

/**
 * Retire du nœud toutes les clés listées dans `SCENARIO_NODE_NO_SAVE_KEYS`.
 * @param node Nœud source (éventuellement pollué runtime/UI)
 */
export function stripScenarioNodeNoSaveFields(node: ScenarioNode) {
  const { status: _runtimeStatus, ...persisted } = node;
  void _runtimeStatus;
  return persisted satisfies ScenarioNodePersisted;
}

/**
 * Applique le strip no-save à une liste de nœuds.
 * @param nodes Nœuds du graphe
 */
export function stripScenarioNodesNoSave(nodes: readonly ScenarioNode[]) {
  return nodes.map(stripScenarioNodeNoSaveFields);
}
