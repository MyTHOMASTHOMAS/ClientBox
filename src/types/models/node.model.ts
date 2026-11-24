/**
 * Schéma TypeScript d'un nœud de scénario (TYPES-007 / SPEC-DATA-03).
 * `NodeType` = configuration persistée ; distinct de `BlockType` runtime (TYPES-009).
 */

/**
 * Types de nœuds graphiques déclarables dans un scénario.
 */
export type NodeType = 'start' | 'run' | 'if' | 'clearContext' | 'callScenario' | 'command';

/**
 * Coordonnées géométriques 2D d'un nœud sur le canvas.
 */
export interface NodePosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Descripteur de port de sortie d'un nœud graphique.
 */
export interface NodeOutputPort {
  readonly index: number;
  readonly branch?: 'true' | 'false';
}

/**
 * Descripteur de port d'entrée d'un nœud graphique.
 */
export interface NodeInputPort {
  readonly index: number;
}

/**
 * Modèle de nœud déclaré au sein d'un graphe de scénario.
 */
export interface ScenarioNode {
  readonly id: string;
  readonly type: NodeType;
  readonly position: NodePosition;
  readonly label?: string;
  readonly status?: 'idle' | 'running' | 'completed' | 'paused' | 'error' | 'stopped' | string;
  readonly agentId?: string;
  readonly promptId?: string;
  readonly exitId?: string;
  readonly ifScriptId?: string;
  /** Identifiant du scénario cible (bloc CallScenario, REQ-039). */
  readonly targetScenarioId?: string;
  /** Ligne de commande shell native à exécuter (bloc Command, REQ-043 / ADR-019). */
  readonly commandLine?: string;
  readonly inputs?: readonly NodeInputPort[];
  readonly outputs?: readonly NodeOutputPort[];
}

/**
 * Alias de compatibilité pour ScenarioNode.
 */
export type Node = ScenarioNode;
