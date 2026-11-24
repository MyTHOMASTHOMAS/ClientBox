import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import { validateGraph } from '../../../src/domain/graph/graph-integrity.validator.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';

type GraphValidateOptions = {
  readonly scenarioId: string;
  readonly scenarioExists?: (id: string) => boolean;
};

function validateScenarioGraph(
  nodes: readonly ScenarioNode[],
  connections: Scenario['connections'],
  options: GraphValidateOptions,
) {
  // API attendue CR-008 : contexte scénario pour valider CallScenario (REQ-041)
  return (validateGraph as (
    nodes: readonly ScenarioNode[],
    connections: Scenario['connections'],
    options?: GraphValidateOptions,
  ) => string[])(nodes, connections, options);
}

describe('CASE-DATA-03-7 — callScenario targetScenarioId persist / validate (SPEC-DATA-03)', () => {
  it('test_CASE_DATA_03_7_call_scenario_target_scenario_id_persist_and_validate', async () => {
    const handle = createTempDir('clientsbox-data-03-7-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      const store = new ResourceStoreService({ dataRoot });

      await store.createScenario({
        id: 'enfant',
        name: 'Enfant',
        nodes: [{ id: 'start-1', type: 'start', position: { x: 0, y: 0 } }],
        connections: [],
      });

      const callNode = {
        id: 'c1',
        type: 'callScenario',
        targetScenarioId: 'enfant',
        position: { x: 10, y: 20 },
      } as ScenarioNode;

      const parent: Scenario = {
        id: 'parent',
        name: 'Parent',
        nodes: [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          callNode,
        ],
        connections: [
          {
            sourceNodeId: 'start-1',
            sourcePortIndex: 0,
            targetNodeId: 'c1',
            targetPortIndex: 0,
            key: '0',
          },
        ],
      };
      await store.createScenario(parent);

      const raw = JSON.parse(
        fs.readFileSync(path.join(dataRoot, 'scenarios', 'parent.json'), 'utf8'),
      ) as Scenario;
      const persisted = raw.nodes.find((n) => n.id === 'c1') as ScenarioNode & {
        targetScenarioId?: string;
      };
      assert.equal(persisted?.type, 'callScenario');
      assert.equal(persisted?.targetScenarioId, 'enfant');

      const reloaded = await store.getScenario('parent');
      const reloadedCall = reloaded.nodes.find((n) => n.id === 'c1') as ScenarioNode & {
        targetScenarioId?: string;
      };
      assert.equal(reloadedCall?.targetScenarioId, 'enfant');

      const exists = (id: string) =>
        fs.existsSync(path.join(dataRoot, 'scenarios', `${id}.json`));

      const selfRefErrors = validateScenarioGraph(
        [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          {
            id: 'c-self',
            type: 'callScenario',
            targetScenarioId: 'parent',
            position: { x: 0, y: 0 },
          } as ScenarioNode,
        ],
        [],
        { scenarioId: 'parent', scenarioExists: exists },
      );
      assert.equal(
        selfRefErrors.filter((e) => /self|courant|lui-même|auto-appel/i.test(e)).length,
        0,
        'self-ref CallScenario doit être accepté (REQ-041)',
      );

      const emptyErrors = validateScenarioGraph(
        [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          {
            id: 'c-empty',
            type: 'callScenario',
            targetScenarioId: '',
            position: { x: 0, y: 0 },
          } as ScenarioNode,
        ],
        [],
        { scenarioId: 'parent', scenarioExists: exists },
      );
      assert.ok(emptyErrors.length >= 1);

      const wsErrors = validateScenarioGraph(
        [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          {
            id: 'c-ws',
            type: 'callScenario',
            targetScenarioId: '   ',
            position: { x: 0, y: 0 },
          } as ScenarioNode,
        ],
        [],
        { scenarioId: 'parent', scenarioExists: exists },
      );
      assert.ok(wsErrors.length >= 1);

      const missingErrors = validateScenarioGraph(
        [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          {
            id: 'c-miss',
            type: 'callScenario',
            targetScenarioId: 'inconnu',
            position: { x: 0, y: 0 },
          } as ScenarioNode,
        ],
        [],
        { scenarioId: 'parent', scenarioExists: exists },
      );
      assert.ok(missingErrors.length >= 1);
    } finally {
      handle.cleanup();
    }
  });
});
