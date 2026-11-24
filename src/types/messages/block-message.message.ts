/**
 * Message inter-blocs (TYPES-009 / ADR-004).
 * Pas de champ `key` sur le message (R-10, R-44).
 */

/**
 * Types de blocs émetteurs de messages dans le moteur.
 */
export type BlockType = 'start' | 'run' | 'if' | 'clearContext' | 'callScenario' | 'command';

/**
 * Message normalisé transporté le long des connexions entre les blocs du scénario.
 */
export interface BlockMessage {
  readonly blockType: BlockType;
  readonly value: unknown;
  readonly power: number;
}
