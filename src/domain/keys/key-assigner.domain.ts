/**
 * Assignation automatique de la clé numérique séquentielle suivante (DOM-005 / SPEC-DATA-03).
 * Fonction pure, zéro I/O.
 */

import type { Connection } from '../../types/models/connection.model.js';

function isDefaultNumericKey(key: string) {
  return /^(0|[1-9]\d*)$/u.test(key);
}

/**
 * Calcule le max des clés numériques existantes vers `targetNodeId` et incrémente.
 * Première entrée → `"0"`.
 *
 * @param existingConnections Connexions existantes
 * @param targetNodeId Identifiant du nœud cible
 * @returns Clé numérique suivante sous forme de chaîne
 */
export function assignDefaultKey(existingConnections: readonly Connection[], targetNodeId: string) {
  const numeric = existingConnections
    .filter((c) => c.targetNodeId === targetNodeId && isDefaultNumericKey(c.key))
    .map((c) => Number(c.key));

  if (numeric.length === 0) {
    return '0';
  }
  return String(Math.max(...numeric) + 1);
}
