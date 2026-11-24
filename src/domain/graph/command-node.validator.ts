/**
 * Validation des nœuds de type Command dans le graphe de scénario (ADR-019 / REQ-043).
 * Vérifie la présence et non-vacuité de commandLine (SPEC-DATA-03 / CASE-DATA-03-8).
 */

import type { ScenarioNode } from '../../types/models/node.model.js';

/**
 * Valide que les nœuds Command possèdent une commande shell non vide.
 *
 * @param nodes Liste des nœuds du scénario
 * @returns Liste des erreurs détectées (vide si valide)
 */
export function validateCommandNodes(nodes: readonly ScenarioNode[]) {
  const errors: string[] = [];
  for (const node of nodes) {
    if (node.type !== 'command') {
      continue;
    }
    const raw = node.commandLine;
    const command = typeof raw === 'string' ? raw.trim() : '';
    if (!command) {
      errors.push(`Command "${node.id}" : commandLine vide ou manquant (REQ-043)`);
    }
  }
  return errors;
}
