/**
 * Contrats d'options et handlers d'événement du ScenarioRunnerService.
 */

import type { Scenario } from '../../types/models/scenario.model.js';
import type { CLIAdapter } from '../../types/contracts/cli-adapter.contract.js';
import type { ResourceStoreService } from '../resources/resource-store.service.js';
import type { RunnerEventHandler } from './host/runner-host.bindings.js';

/** Options de configuration pour le service d'exécution de scénario. */
export interface ScenarioRunnerOptions {
  readonly scenario: Scenario;
  readonly adapters: readonly CLIAdapter[];
  readonly workspacePath: string;
  readonly resourceStore: ResourceStoreService;
  /** Profondeur d'imbrication CallScenario (0 = racine HTTP). */
  readonly nestingDepth?: number;
  /**
   * Plafond d'imbrication CallScenario (REQ-041).
   * `-1` = illimité (défaut si non fourni).
   */
  readonly maxCallScenarioDepth?: number;
}

/** Gestionnaire de rappel d'événement pour le runner de scénario. */
export type ScenarioRunnerEventHandler = RunnerEventHandler;
