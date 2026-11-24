/**
 * CRUD scénarios pour ResourceStoreService (sanitize no-save + collisions clés).
 */

import type { Scenario } from '../../types/models/scenario.model.js';
import { validateScenarioConnections } from '../../domain/keys/key-collision.validator.js';
import { stripScenarioNodesNoSave } from '../../domain/graph/node-transient-keys.constant.js';

/** Accès générique aux entités JSON du store. */
export interface ScenarioEntityAccess {
  getEntity<T>(subdir: string, id: string): T | null;
  saveEntity<T extends { id: string }>(subdir: string, item: T): T;
  removeEntity(subdir: string, id: string): void;
  listEntities<T>(subdir: string): T[];
}

/**
 * Sanitize un scénario avant persistance (strip champs no-save).
 * @param scenario Scénario brut
 */
export function sanitizeScenario(scenario: Scenario) {
  return {
    ...scenario,
    nodes: stripScenarioNodesNoSave(scenario.nodes ?? []),
  };
}

/**
 * Liste les scénarios.
 * @param access Accès entités
 */
export function listScenarios(access: ScenarioEntityAccess) {
  return access.listEntities<Scenario>('scenarios');
}

/**
 * Charge un scénario ou lève une erreur.
 * @param access Accès entités
 * @param id Identifiant
 */
export function getScenario(access: ScenarioEntityAccess, id: string) {
  const item = access.getEntity<Scenario>('scenarios', id);
  if (!item) throw new Error(`Scénario introuvable : ${id} — fichier absent`);
  return sanitizeScenario(item);
}

/**
 * Crée un scénario persisté.
 * @param access Accès entités
 * @param scenario Scénario
 */
export function createScenario(access: ScenarioEntityAccess, scenario: Scenario) {
  return access.saveEntity('scenarios', sanitizeScenario(scenario));
}

/**
 * Met à jour un scénario (validation connexions + sanitize).
 * @param access Accès entités
 * @param idOrScenario Id ou scénario
 * @param maybeScenario Scénario si id fourni
 */
export function updateScenario(
  access: ScenarioEntityAccess,
  idOrScenario: string | Scenario,
  maybeScenario?: Scenario,
) {
  const scenario = typeof idOrScenario === 'string' ? maybeScenario! : idOrScenario;
  validateScenarioConnections(scenario.connections);
  return access.saveEntity('scenarios', sanitizeScenario(scenario));
}

/**
 * Supprime un scénario.
 * @param access Accès entités
 * @param id Identifiant
 */
export function deleteScenario(access: ScenarioEntityAccess, id: string) {
  access.removeEntity('scenarios', id);
}
