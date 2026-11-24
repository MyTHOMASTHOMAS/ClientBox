/**
 * Factory pure de messages inter-blocs (SPEC-ENG-01 / R-10 / R-44).
 * Aucune propriété `key` sur la sortie.
 */

import type { BlockType } from '../../types/messages/block-message.message.js';

/**
 * Construit un message de bloc standardisé pour le moteur de flux.
 *
 * @param blockType Type du bloc émetteur
 * @param value Valeur portée par le message
 * @param power Puissance du signal (0 ou 1)
 * @returns Message de bloc standardisé
 */
export function buildBlockMessage(blockType: BlockType, value: unknown, power: number) {
  return {
    blockType,
    value,
    power,
  };
}
