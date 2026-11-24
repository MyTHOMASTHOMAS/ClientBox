/**
 * Détection de collision et validité des clés de connexion (DOM-007 / SPEC-DATA-03).
 * Fonctions pures, zéro I/O.
 */

import type { Connection } from '../../types/models/connection.model.js';

/**
 * Détermine si une clé candidate entre en collision avec une connexion existante vers la même cible.
 *
 * @param connections Connexions existantes
 * @param targetNodeId Identifiant du nœud cible
 * @param candidateKey Clé candidate à tester
 * @returns Booléen indiquant s'il y a collision
 */
export function hasKeyCollision(
  connections: readonly Connection[],
  targetNodeId: string,
  candidateKey: string,
) {
  return connections.some((c) => c.targetNodeId === targetNodeId && c.key === candidateKey);
}

/**
 * Valide la syntaxe d'une clé de connexion.
 *
 * @param key Clé à tester
 * @returns Booléen indiquant si la clé est non vide après suppression des espaces
 */
export function isValidConnectionKey(key: string) {
  return typeof key === 'string' && key.trim().length > 0;
}

/**
 * Valide les clés des connexions d'un scénario (syntaxe et unicité par bloc cible).
 *
 * @param connections Connexions à valider
 */
export function validateScenarioConnections(connections: readonly Connection[]) {
  for (let i = 0; i < connections.length; i += 1) {
    const current = connections[i];
    if (current) {
      const targetId = current.targetNodeId || current.to || '';
      if (!isValidConnectionKey(current.key)) {
        throw new Error(`Clé de connexion invalide (vide) sur le bloc cible ${targetId}`);
      }
      if (hasKeyCollision(connections.slice(0, i), targetId, current.key)) {
        throw new Error(`Collision de clé "${current.key}" sur le bloc cible ${targetId}`);
      }
    }
  }
}
