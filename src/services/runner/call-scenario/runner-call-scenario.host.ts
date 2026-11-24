/**
 * Câblage CallScenario depuis l'hôte ScenarioRunnerService (ADR-018 / REQ-040).
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type { CLIAdapter } from '../../../types/contracts/cli-adapter.contract.js';
import type { ResourceStoreService } from '../../resources/resource-store.service.js';
import { runNestedCallScenarioFromParent } from './runner-call-scenario.helper.js';
import {
  createNestedChildWithChunkRelay,
  type NestedChildRunner,
} from './runner-nested-child.factory.js';
import type { ScenarioRunnerEventHandler } from '../scenario-runner.types.js';

/** Contexte hôte minimal pour lancer un CallScenario nested. */
export interface CallScenarioHostContext {
  readonly nestingDepth: number;
  readonly maxCallScenarioDepth: number;
  readonly adapters: readonly CLIAdapter[];
  readonly workspacePath: string;
  readonly resourceStore: ResourceStoreService;
  readonly eventListeners: Map<string, Set<ScenarioRunnerEventHandler>>;
  readonly childRunners: Set<NestedChildRunner>;
  readonly isHalted: () => boolean;
  readonly spawnChildRunner: (scenario: Scenario, nextDepth: number) => NestedChildRunner;
}

/**
 * Lance la sous-exécution CallScenario avec relay des chunks CLI vers l'hôte.
 *
 * @param host Contexte du runner parent
 * @param targetScenarioId Identifiant du scénario cible
 */
export async function runCallScenarioFromHost(
  host: CallScenarioHostContext,
  targetScenarioId: string,
) {
  const createChild = createNestedChildWithChunkRelay(host.spawnChildRunner, host.eventListeners);
  await runNestedCallScenarioFromParent(
    {
      nestingDepth: host.nestingDepth,
      maxCallScenarioDepth: host.maxCallScenarioDepth,
      isHalted: host.isHalted,
      getScenario: (id) => host.resourceStore.getScenario(id),
      createChild,
      childRunners: host.childRunners,
    },
    targetScenarioId,
  );
}
