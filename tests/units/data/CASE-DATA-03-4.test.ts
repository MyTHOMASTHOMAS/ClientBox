import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import path from 'node:path';

import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import type { Connection } from '../../../src/types/models/connection.model.js';
import { hasKeyCollision, isValidConnectionKey } from '../../../src/domain/keys/key-collision.validator.js';
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

describe('CASE-DATA-03-4 — détection et rejet des collisions de clés (SPEC-DATA-03)', () => {
  it('test_CASE_DATA_03_4_key_collision_detection_and_rejection', async () => {
    const handle = createTempDir('clientsbox-data-03-4-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      const store = new ResourceStoreService({ dataRoot });

      const baseline: Scenario = {
        id: 'collision-demo',
        name: 'Collision demo',
        nodes: [
          node('start-1', 'start', { x: 0, y: 0 }),
          node('if-1', 'if', { x: 100, y: 0 }),
          node('run-1', 'run', { x: 200, y: 0 }),
          node('src-a', 'run', { x: 50, y: 50 }),
          node('src-b', 'run', { x: 50, y: 100 }),
        ],
        connections: [
          conn({ sourceNodeId: 'src-a', targetNodeId: 'if-1', key: '0' }),
          conn({
            sourceNodeId: 'src-a',
            targetNodeId: 'run-1',
            key: 'contextInput',
          }),
        ],
      };
      await store.createScenario(baseline);
      const snapshotBefore = JSON.stringify(await store.getScenario('collision-demo'));

      assert.equal(hasKeyCollision(baseline.connections, 'if-1', '0'), true);
      assert.equal(hasKeyCollision(baseline.connections, 'run-1', 'contextInput'), true);
      assert.equal(hasKeyCollision([], 'if-2', '0'), false);
      assert.equal(isValidConnectionKey('0'), true);
      assert.equal(isValidConnectionKey(''), false);

      const withNumericCollision: Scenario = {
        ...baseline,
        connections: [
          ...baseline.connections,
          conn({ sourceNodeId: 'src-b', targetNodeId: 'if-1', key: '0' }),
        ],
      };
      await assert.rejects(
        () => store.updateScenario(withNumericCollision),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.match(String(err), /collision|clé|"0"|0/i);
          return true;
        },
      );
      assert.equal(JSON.stringify(await store.getScenario('collision-demo')), snapshotBefore);

      const withCustomCollision: Scenario = {
        ...baseline,
        connections: [
          ...baseline.connections,
          conn({
            sourceNodeId: 'src-b',
            targetNodeId: 'run-1',
            key: 'contextInput',
          }),
        ],
      };
      await assert.rejects(
        () => store.updateScenario(withCustomCollision),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.match(String(err), /collision|contextInput/i);
          return true;
        },
      );
      assert.equal(JSON.stringify(await store.getScenario('collision-demo')), snapshotBefore);

      const withNewKey: Scenario = {
        ...baseline,
        connections: [
          ...baseline.connections,
          conn({ sourceNodeId: 'start-1', targetNodeId: 'if-1', key: '1' }),
        ],
      };
      assert.equal(hasKeyCollision(baseline.connections, 'if-1', '1'), false);
      const accepted = await store.updateScenario(withNewKey);
      assert.ok(accepted.connections.some((c) => c.key === '1' && c.targetNodeId === 'if-1'));
    } finally {
      handle.cleanup();
    }
  });
});
