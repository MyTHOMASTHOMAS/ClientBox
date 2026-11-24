/**
 * Schéma TypeScript du document Scénario (TYPES-006 / SPEC-DATA-03).
 */

import type { Connection } from './connection.model.js';
import type { ScenarioNode } from './node.model.js';

/**
 * Identifiant unique de document Scénario.
 */
export type ScenarioId = string;

/**
 * Métadonnées graphiques associées au scénario (position de caméra, zoom).
 */
export interface ScenarioMetadata {
  readonly viewport?: {
    readonly x: number;
    readonly y: number;
    readonly zoom?: number;
  };
}

/**
 * Document complet décrivant un scénario avec son graphe de nœuds et connexions.
 */
export interface Scenario {
  readonly id: ScenarioId;
  readonly name: string;
  readonly nodes: readonly ScenarioNode[];
  readonly connections: readonly Connection[];
  readonly metadata?: ScenarioMetadata;
}
