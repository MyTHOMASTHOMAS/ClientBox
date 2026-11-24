/**
 * Garde pure des blocs orphelins N=0 (DOM-002 / SPEC-ENG-02 / R-42c / R-42d).
 * Start est exempt ; les autres types sans entrée câblée restent inactifs.
 */

import type { Connection } from '../../types/models/connection.model.js';
import type { NodeType } from '../../types/models/node.model.js';

/**
 * Détermine si un bloc est orphelin (aucune connexion entrante pour un type hors Start).
 *
 * @param connections Liste de l'ensemble des connexions du scénario
 * @param nodeId Identifiant du bloc à évaluer
 * @param nodeType Type de bloc
 * @returns Booléen indiquant si le bloc est orphelin
 */
export function isOrphanBlock(
  connections: readonly Connection[],
  nodeId: string,
  nodeType: NodeType,
) {
  if (nodeType === 'start') {
    return false;
  }

  return !connections.some((connection) => connection.targetNodeId === nodeId);
}
