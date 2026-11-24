/**
 * CASE-ARCH-02-2 — Pureté et déterminisme des 10 fonctions métier de src/domain/
 * (`AC-ARCH-02-2` / `SPEC-ARCH-02` / CR-012 — `DOM-009` abrogé).
 */

import { describe, it, expect } from 'vitest';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

import type { Connection } from '../../../src/types/models/connection.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import type { PolicyInjectionState } from '../../../src/domain/prompt/injection-policy.evaluator.js';

import { evaluateJoin } from '../../../src/domain/join/join-barrier.evaluator.js';
import { isOrphanBlock } from '../../../src/domain/join/orphan-node.guard.js';
import {
  shouldInjectSystemPrompt,
  updatePolicyState,
} from '../../../src/domain/prompt/injection-policy.evaluator.js';
import { assemblePrompt } from '../../../src/domain/prompt/prompt.assembler.js';
import { assignDefaultKey } from '../../../src/domain/keys/key-assigner.domain.js';
import { renumberDefaultKeys } from '../../../src/domain/keys/key-renumberer.domain.js';
import { hasKeyCollision, isValidConnectionKey } from '../../../src/domain/keys/key-collision.validator.js';
import { validateGraph } from '../../../src/domain/graph/graph-integrity.validator.js';

const EXPECTED_DETERMINISM_STATUS = '100 % (Sorties stables)';

function deepFreezeSnapshot<T>(value: T): T {
  return structuredClone(value);
}

function connection(
  partial: Partial<Connection> & Pick<Connection, 'key' | 'targetNodeId'>,
): Connection {
  return {
    sourceNodeId: partial.sourceNodeId ?? 'src',
    sourcePortIndex: partial.sourcePortIndex ?? 0,
    targetNodeId: partial.targetNodeId,
    targetPortIndex: partial.targetPortIndex ?? 0,
    key: partial.key,
  };
}

describe('CASE-ARCH-02-2 — pureté et déterminisme des 10 fonctions domain/ (SPEC-ARCH-02)', () => {
  it('test_CASE_ARCH_02_2_domain_pure_functions_and_determinism', () => {
    const connections: Connection[] = [
      connection({ key: '0', targetNodeId: 'run-1', sourceNodeId: 'start-1' }),
    ];
    const inputBag: BlockInputBag = {
      '0': { blockType: 'start', value: null, power: 1 },
    };
    const policyState: PolicyInjectionState = {
      hasInjectedOnce: false,
      hasInjectedThisScenario: false,
    };
    const nodes: ScenarioNode[] = [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 0, y: 0 },
      },
    ];

    const connectionsSnapshot = deepFreezeSnapshot(connections);
    const inputBagSnapshot = deepFreezeSnapshot(inputBag);
    const policyStateSnapshot = deepFreezeSnapshot(policyState);
    const nodesSnapshot = deepFreezeSnapshot(nodes);

    const globalMarker = Symbol.for('CASE_ARCH_02_2_global_marker');
    const globalRecord = globalThis as typeof globalThis & {
      [globalMarker]?: number;
    };
    globalRecord[globalMarker] = 42;

    const determinismViolations: ArchitectureViolation[] = [];

    type Scenario = { name: string; run: () => unknown };
    const scenarios: Scenario[] = [
      { name: 'evaluateJoin', run: () => evaluateJoin(inputBag, connections) },
      { name: 'isOrphanBlock', run: () => isOrphanBlock(connections, 'run-1', 'run') },
      {
        name: 'shouldInjectSystemPrompt',
        run: () => shouldInjectSystemPrompt('chaque_prompt', policyState),
      },
      {
        name: 'updatePolicyState',
        run: () => updatePolicyState('chaque_prompt', policyState, 'run'),
      },
      { name: 'assemblePrompt', run: () => assemblePrompt('system', 'user', 'exit') },
      { name: 'assignDefaultKey', run: () => assignDefaultKey(connections, 'run-1') },
      { name: 'renumberDefaultKeys', run: () => renumberDefaultKeys(connections, '0') },
      { name: 'hasKeyCollision', run: () => hasKeyCollision(connections, 'run-1', '1') },
      { name: 'isValidConnectionKey', run: () => isValidConnectionKey('0') },
      { name: 'validateGraph', run: () => validateGraph(nodes, connections) },
    ];

    expect(scenarios).toHaveLength(10);

    const firstOutputs = scenarios.map((s) => s.run());
    const secondOutputs = scenarios.map((s) => s.run());

    for (let i = 0; i < scenarios.length; i++) {
      if (JSON.stringify(firstOutputs[i]) !== JSON.stringify(secondOutputs[i])) {
        determinismViolations.push({
          file: 'src/domain',
          symbol: scenarios[i].name,
          message: `Sortie instable / non déterministe pour ${scenarios[i].name}`,
        });
      }
    }

    const determinismStatus =
      determinismViolations.length === 0 ? EXPECTED_DETERMINISM_STATUS : 'NON_DETERMINISTE';

    const mutationViolations: ArchitectureViolation[] = [];
    let inPlaceMutationCount = 0;
    if (JSON.stringify(connections) !== JSON.stringify(connectionsSnapshot)) {
      inPlaceMutationCount += 1;
      mutationViolations.push({
        file: 'src/domain',
        symbol: 'connections',
        message: "Mutation in-place de l'argument connections",
      });
    }
    if (JSON.stringify(inputBag) !== JSON.stringify(inputBagSnapshot)) {
      inPlaceMutationCount += 1;
      mutationViolations.push({
        file: 'src/domain',
        symbol: 'inputBag',
        message: "Mutation in-place de l'argument inputBag",
      });
    }
    if (JSON.stringify(policyState) !== JSON.stringify(policyStateSnapshot)) {
      inPlaceMutationCount += 1;
      mutationViolations.push({
        file: 'src/domain',
        symbol: 'policyState',
        message: "Mutation in-place de l'argument policyState",
      });
    }
    if (JSON.stringify(nodes) !== JSON.stringify(nodesSnapshot)) {
      inPlaceMutationCount += 1;
      mutationViolations.push({
        file: 'src/domain',
        symbol: 'nodes',
        message: "Mutation in-place de l'argument nodes",
      });
    }

    const sharedGlobalMutationViolations: ArchitectureViolation[] = [];
    const sharedGlobalMutationCount = globalRecord[globalMarker] === 42 ? 0 : 1;
    if (sharedGlobalMutationCount > 0) {
      sharedGlobalMutationViolations.push({
        file: 'src/domain',
        symbol: 'globalThis',
        message: 'Altération de variable globale partagée par les fonctions domain',
      });
    }

    expect(
      determinismStatus,
      formatViolationsMessage('Déterminisme des fonctions domain', determinismViolations),
    ).toBe(EXPECTED_DETERMINISM_STATUS);

    expect(
      inPlaceMutationCount,
      formatViolationsMessage('Mutations in-place domain', mutationViolations),
    ).toBe(0);

    expect(
      sharedGlobalMutationCount,
      formatViolationsMessage('Altérations globales domain', sharedGlobalMutationViolations),
    ).toBe(0);
  });
});
