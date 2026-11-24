/**
 * Opérations pures sur le sac d'entrées (SPEC-ENG-01 / R-44 / TYPES-010).
 * La clé vit uniquement comme index du Record — jamais sur le message (R-10).
 */

import type { BlockMessage } from '../../types/messages/block-message.message.js';
import type { BlockInputBag } from '../../types/models/input-bag.model.js';

/**
 * Insère de manière immutable un message entrant indexé par clé dans le sac d'entrées.
 *
 * @param bag Sac d'entrées courant
 * @param key Clé d'entrée associée au port/connexion
 * @param message Message de bloc à insérer
 * @returns Nouveau sac d'entrées contenant le message
 */
export function putIncomingMessage(bag: BlockInputBag, key: string, message: BlockMessage) {
  return {
    ...bag,
    [key]: message,
  };
}
