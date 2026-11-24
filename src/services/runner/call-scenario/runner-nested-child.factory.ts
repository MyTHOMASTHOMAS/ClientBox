/**
 * Fabrique de sous-runner CallScenario + relay des chunks CLI vers le parent (AC-ENG-03-6).
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import { emitRunnerEvent } from '../host/runner-host.bindings.js';
import type { NestedScenarioRunner } from './runner-call-scenario.helper.js';
import type { ScenarioRunnerEventHandler } from '../scenario-runner.types.js';

/** Sous-runner capable d'émettre des événements et d'être await/stop. */
export type NestedChildRunner = NestedScenarioRunner & {
  on(event: string, handler: ScenarioRunnerEventHandler): void;
  stop(): Promise<void>;
};

/** Factory brute d'instanciation d'un sous-runner (évite l'import circulaire SVC-001). */
export type NestedChildSpawner = (scenario: Scenario, nextDepth: number) => NestedChildRunner;

/**
 * Relaye `chunkReceived` enfant → listeners parent, avec `nestedScenarioId`.
 * Ne relaie pas blockStatus / status (REQ-040).
 *
 * @param child Sous-runner source
 * @param parentListeners Bus d'événements du runner parent
 * @param nestedScenarioId Id du scénario enfant
 */
export function wireNestedChunkRelayToParent(
  child: NestedChildRunner,
  parentListeners: Map<string, Set<ScenarioRunnerEventHandler>>,
  nestedScenarioId: string,
) {
  child.on('chunkReceived', (payload: unknown) => {
    const base = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    emitRunnerEvent(parentListeners, 'chunkReceived', {
      ...base,
      nestedScenarioId,
    });
  });
}

/**
 * Enveloppe une factory de sous-runner pour brancher le relay chunks vers le parent.
 *
 * @param spawnChild Factory d'instanciation (fournie par SVC-001)
 * @param parentListeners Bus d'événements du runner parent
 */
export function createNestedChildWithChunkRelay(
  spawnChild: NestedChildSpawner,
  parentListeners: Map<string, Set<ScenarioRunnerEventHandler>>,
) {
  return (scenario: Scenario, nextDepth: number) => {
    const child = spawnChild(scenario, nextDepth);
    wireNestedChunkRelayToParent(child, parentListeners, scenario.id);
    return child;
  };
}
