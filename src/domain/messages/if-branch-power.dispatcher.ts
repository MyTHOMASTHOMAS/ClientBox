/**
 * Distribution différentielle de puissance If (SPEC-ENG-03 / R-15).
 * Pure : condition → émissions { portId, message } sans I/O.
 */

import type { BlockMessage } from '../../types/messages/block-message.message.js';
import { buildBlockMessage } from './block-message.factory.js';

/** Émission sur un port de sortie de bloc conditionnel If. */
export interface IfPowerEmission {
  readonly portId: string;
  readonly message: BlockMessage;
}

/**
 * Distribue la puissance différentielle sur les branches vrai/faux d'un bloc conditionnel If.
 *
 * @param isConditionSatisfied - Résultat booléen de la condition.
 * @param truePortIds - Liste des identifiants de ports pour la branche vraie.
 * @param falsePortIds - Liste des identifiants de ports pour la branche fausse.
 * @returns Tableau d'émissions avec puissance 1 sur la branche active et 0 sur la branche inactive.
 */
export function distributeIfPower(
  isConditionSatisfied: boolean,
  truePortIds: readonly string[],
  falsePortIds: readonly string[],
) {
  const truePower = isConditionSatisfied ? 1 : 0;
  const falsePower = isConditionSatisfied ? 0 : 1;
  const emissions: IfPowerEmission[] = [];

  for (const portId of truePortIds) {
    emissions.push({
      portId,
      message: buildBlockMessage('if', null, truePower),
    });
  }

  for (const portId of falsePortIds) {
    emissions.push({
      portId,
      message: buildBlockMessage('if', null, falsePower),
    });
  }

  return emissions;
}
