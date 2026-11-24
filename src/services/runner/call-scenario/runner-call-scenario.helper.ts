/**
 * Sous-exécution CallScenario nested in-process (ADR-018 / REQ-040 / REQ-041).
 */

import type { Scenario } from '../../../types/models/scenario.model.js';

/** Contrat minimal d'un sous-runner CallScenario. */
export interface NestedScenarioRunner {
  run(): Promise<void>;
  getStatus(): string;
}

/** Entrées pour lancer un sous-scénario nested. */
export interface NestedCallScenarioInput<TChild extends NestedScenarioRunner> {
  readonly nestingDepth: number;
  /** `-1` = illimité (CALL_SCENARIO_MAX_DEPTH). */
  readonly maxCallScenarioDepth: number;
  readonly targetScenarioId: string;
  readonly isHalted: () => boolean;
  readonly getScenario: (id: string) => Promise<Scenario>;
  readonly createChild: (scenario: Scenario, nextDepth: number) => TChild;
  readonly trackChild: (child: TChild) => void;
  readonly untrackChild: (child: TChild) => void;
}

/** Parent minimal pour câbler un CallScenario depuis ScenarioRunnerService. */
export interface NestedCallScenarioParent<TChild extends NestedScenarioRunner> {
  readonly nestingDepth: number;
  readonly maxCallScenarioDepth: number;
  readonly isHalted: () => boolean;
  readonly getScenario: (id: string) => Promise<Scenario>;
  readonly createChild: (scenario: Scenario, nextDepth: number) => TChild;
  readonly childRunners: Set<TChild>;
}

/**
 * Lance un sous-scénario depuis un parent runner (track / untrack automatiques).
 *
 * @param parent Contexte parent
 * @param targetScenarioId Identifiant du scénario cible
 */
export async function runNestedCallScenarioFromParent<TChild extends NestedScenarioRunner>(
  parent: NestedCallScenarioParent<TChild>,
  targetScenarioId: string,
) {
  await executeNestedCallScenario({
    nestingDepth: parent.nestingDepth,
    maxCallScenarioDepth: parent.maxCallScenarioDepth,
    targetScenarioId,
    isHalted: parent.isHalted,
    getScenario: parent.getScenario,
    createChild: parent.createChild,
    trackChild: (child) => {
      parent.childRunners.add(child);
    },
    untrackChild: (child) => {
      parent.childRunners.delete(child);
    },
  });
}

/**
 * Charge, exécute et attend un scénario enfant ; propage l'échec / stop.
 *
 * @param input Contexte nested CallScenario
 */
export async function executeNestedCallScenario<TChild extends NestedScenarioRunner>(
  input: NestedCallScenarioInput<TChild>,
) {
  const nextDepth = input.nestingDepth + 1;
  const maxDepth = input.maxCallScenarioDepth;
  if (maxDepth >= 0 && nextDepth > maxDepth) {
    throw new Error(
      `CallScenario : profondeur d'imbrication ${String(nextDepth)} supérieure à ${String(maxDepth)} (REQ-041)`,
    );
  }
  if (input.isHalted()) {
    throw new Error('CallScenario interrompu avant le lancement du sous-scénario');
  }
  const childScenario = await input.getScenario(input.targetScenarioId);
  const child = input.createChild(childScenario, nextDepth);
  input.trackChild(child);
  try {
    try {
      await child.run();
    } catch (err: unknown) {
      throw err instanceof Error
        ? err
        : new Error(`Sous-scénario "${input.targetScenarioId}" en échec`, { cause: err });
    }
    if (input.isHalted()) {
      throw new Error(`CallScenario interrompu pendant "${input.targetScenarioId}"`);
    }
    if (child.getStatus() !== 'completed') {
      throw new Error(
        `Sous-scénario "${input.targetScenarioId}" non réussi (statut=${child.getStatus()})`,
      );
    }
  } finally {
    input.untrackChild(child);
  }
}
