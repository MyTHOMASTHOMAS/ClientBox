/**
 * Contrats runner exposés aux routes HTTP d'exécution (CTL-002).
 */

/** Runner exposé au holder pour snapshot et arrêt. */
export interface ActiveRunnerLike {
  stop(): Promise<void> | void;
  getStatus?(): string;
  getScenarioId?(): string;
  getBlockStatuses?(): Map<string, string> | ReadonlyMap<string, string>;
}

/** Détenteur de l'instance active du scénario en cours d'exécution. */
export interface RunnerHolder {
  activeRunner?: ActiveRunnerLike | null;
  startRunner?(scenarioId: string): Promise<unknown> | unknown;
  stopActiveRunner?(): Promise<void> | void;
}
