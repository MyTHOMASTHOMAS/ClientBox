/**
 * Schéma TypeScript d'une connexion câblée (TYPES-008 / SPEC-DATA-03).
 * La clé d'entrée est portée exclusivement par la connexion (R-44).
 */

/**
 * Clé d'entrée associée à une connexion orientée.
 */
export type ConnectionKey = string;

/**
 * Modèle d'une connexion orientée reliant deux nœuds de scénario.
 */
export interface Connection {
  readonly sourceNodeId?: string;
  readonly sourcePortIndex?: number;
  readonly targetNodeId?: string;
  readonly targetPortIndex?: number;
  readonly from?: string;
  readonly to?: string;
  readonly outputPort?: string;
  readonly key: ConnectionKey;
}
