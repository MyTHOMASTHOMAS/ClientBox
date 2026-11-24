import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import type { Connection } from '../../../src/types/models/connection.model.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';

function conn(
  partial: Partial<Connection> & { sourceNodeId: string; targetNodeId: string; key: string },
): Connection {
  return {
    sourceNodeId: partial.sourceNodeId,
    sourcePortIndex: partial.sourcePortIndex ?? 0,
    targetNodeId: partial.targetNodeId,
    targetPortIndex: partial.targetPortIndex ?? 0,
    key: partial.key,
  };
}

function node(
  id: string,
  type: ScenarioNode['type'],
  position: { x: number; y: number },
  extras: Partial<ScenarioNode> = {},
): ScenarioNode {
  return {
    id,
    type,
    position,
    ...extras,
  } as ScenarioNode;
}

describe('CASE-DATA-03-1 — persistance et rechargement JSON de scénario (SPEC-DATA-03)', () => {
  it('test_CASE_DATA_03_1_scenario_json_persist_and_reload', async () => {
    const handle = createTempDir('clientsbox-data-03-1-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      const store = new ResourceStoreService({ dataRoot });

      const scenario: Scenario = {
        id: 'mon-flux',
        name: 'Mon flux',
        nodes: [
          node('start-1', 'start', { x: 100, y: 50 }),
          node('run-1', 'run', { x: 300, y: 50 }, { agentId: 'agent-dev' }),
          node('if-1', 'if', { x: 500, y: 50 }, { ifScriptId: 'check-status' }),
        ],
        connections: [
          conn({
            sourceNodeId: 'start-1',
            targetNodeId: 'run-1',
            key: '0',
          }),
          conn({
            sourceNodeId: 'run-1',
            targetNodeId: 'if-1',
            key: '0',
          }),
        ],
      };

      await store.createScenario(scenario);

      const filePath = path.join(dataRoot, 'scenarios', 'mon-flux.json');
      assert.ok(fs.existsSync(filePath));

      const reloaded = await store.getScenario('mon-flux');
      assert.ok(reloaded !== null);
      if (!reloaded) throw new Error('Scenario not found');
      assert.equal(reloaded.nodes.length, 3);
      assert.equal(reloaded.connections.length, 2);

      const start = reloaded.nodes.find((n) => n.id === 'start-1');
      const run = reloaded.nodes.find((n) => n.id === 'run-1');
      const ifNode = reloaded.nodes.find((n) => n.id === 'if-1');
      assert.ok(start !== undefined);
      assert.ok(run !== undefined);
      assert.ok(ifNode !== undefined);
      assert.equal(start.type, 'start');
      assert.deepEqual(start.position, { x: 100, y: 50 });
      assert.deepEqual(run.position, { x: 300, y: 50 });
      assert.equal(run.agentId, 'agent-dev');
      assert.equal(ifNode.ifScriptId, 'check-status');
      assert.deepEqual(reloaded.connections.map((c) => c.key).sort(), ['0', '0']);
    } finally {
      handle.cleanup();
    }
  });
});
