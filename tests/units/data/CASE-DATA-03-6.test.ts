import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import {
  SCENARIO_NODE_NO_SAVE_KEYS,
  stripScenarioNodeNoSaveFields,
  stripScenarioNodesNoSave,
} from '../../../src/domain/graph/node-transient-keys.constant.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';

describe('CASE-DATA-03-6 — liste no-save SCENARIO_NODE_NO_SAVE_KEYS (SPEC-DATA-03)', () => {
  it('test_CASE_DATA_03_6_scenario_node_no_save_keys_stripped_on_serialize_and_load', async () => {
    assert.ok(SCENARIO_NODE_NO_SAVE_KEYS.includes('status'));
    assert.ok(SCENARIO_NODE_NO_SAVE_KEYS.length >= 1);

    const polluted: ScenarioNode = {
      id: 'run-1',
      type: 'run',
      position: { x: 10, y: 20 },
      agentId: 'a1',
      status: 'running',
    };

    const stripped = stripScenarioNodeNoSaveFields(polluted);
    assert.equal(Object.prototype.hasOwnProperty.call(stripped, 'status'), false);
    assert.equal(stripped.id, 'run-1');
    assert.equal(stripped.type, 'run');
    assert.deepEqual(stripped.position, { x: 10, y: 20 });
    assert.equal(stripped.agentId, 'a1');
    assert.equal(polluted.status, 'running');

    const fromDisk: ScenarioNode = {
      id: 'run-1',
      type: 'run',
      position: { x: 10, y: 20 },
      status: 'completed',
    };
    const hydrated = stripScenarioNodesNoSave([fromDisk])[0];
    assert.equal(Object.prototype.hasOwnProperty.call(hydrated, 'status'), false);
    assert.equal(hydrated.id, 'run-1');
    assert.deepEqual(hydrated.position, { x: 10, y: 20 });

    const handle = createTempDir('clientsbox-data-03-6-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      const store = new ResourceStoreService({ dataRoot });
      const scenario: Scenario = {
        id: 'flux-no-save',
        name: 'Flux no-save',
        nodes: [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 }, status: 'completed' },
          polluted,
        ],
        connections: [],
      };
      await store.createScenario(scenario);

      const raw = JSON.parse(
        fs.readFileSync(path.join(dataRoot, 'scenarios', 'flux-no-save.json'), 'utf8'),
      ) as Scenario;
      for (const node of raw.nodes) {
        for (const key of SCENARIO_NODE_NO_SAVE_KEYS) {
          assert.equal(
            Object.prototype.hasOwnProperty.call(node, key),
            false,
            `clé no-save "${key}" absente du JSON disque`,
          );
        }
      }

      const reloaded = await store.getScenario('flux-no-save');
      for (const node of reloaded.nodes) {
        assert.equal(Object.prototype.hasOwnProperty.call(node, 'status'), false);
      }
      assert.equal(reloaded.nodes.find((n) => n.id === 'run-1')?.agentId, 'a1');
    } finally {
      handle.cleanup();
    }
  });
});
