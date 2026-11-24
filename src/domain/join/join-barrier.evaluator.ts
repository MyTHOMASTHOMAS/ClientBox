/**
 * Évaluation pure du Join (DOM-001 / SPEC-ENG-02 / R-42 / C-15).
 * Décision synchrone sans effet de bord : trigger | pause | waiting.
 */

import type { Connection } from '../../types/models/connection.model.js';
import type { BlockInputBag } from '../../types/models/input-bag.model.js';

/** Décision de synchronisation d'un bloc Join. */
export type JoinDecision = 'trigger' | 'pause' | 'waiting';

/**
 * Évalue de manière pure la décision d'un bloc Join selon les messages reçus et la puissance totale.
 *
 * @param inputBag Sac de messages reçus par le bloc
 * @param connections Liste des connexions entrantes vers le bloc
 * @returns Décision d'exécution (trigger, pause ou waiting)
 */
export function evaluateJoin(inputBag: BlockInputBag, connections: readonly Connection[]) {
  const N = connections.length;
  let present = 0;
  let sumPower = 0;

  for (const connection of connections) {
    const message = inputBag[connection.key];
    if (message === undefined) {
      continue;
    }
    present += 1;
    sumPower += message.power;
  }

  if (present < N) {
    return 'waiting';
  }

  if (sumPower === N) {
    return 'trigger';
  }

  return 'pause';
}
