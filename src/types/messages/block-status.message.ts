/**
 * Statuts runtime blocs / scénario (TYPES-012).
 * Littéraux EN techniques ; localisation FR côté UI.
 */

/**
 * Statut d'exécution interne d'un bloc individuel au sein du scénario.
 */
export type BlockStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/**
 * Statut global d'exécution du runner de scénario.
 */
export type RunnerStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';
