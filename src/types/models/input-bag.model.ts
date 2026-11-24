/**
 * Sac d'entrées d'un bloc (TYPES-010) : indexé par clé de connexion.
 */

import type { BlockMessage } from '../messages/block-message.message.js';

/**
 * Sac d'entrées d'un bloc regroupant les messages reçus sur chaque clé de connexion.
 */
export type BlockInputBag = Readonly<Record<string, BlockMessage>>;
