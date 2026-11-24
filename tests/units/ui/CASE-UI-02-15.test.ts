import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { SCENARIO_NODE_NO_SAVE_KEYS } from '../../../src/domain/graph/node-transient-keys.constant.js';
import {
  buildScenarioPersistPayload,
  createCanvasDocument,
} from '../../../src/ui/hooks/canvas/use-canvas-state.hook.js';

describe('CASE-UI-02-15 — Enregistrer / load strip no-save (SPEC-UI-02 / SPEC-DATA-03)', () => {
  it('test_CASE_UI_02_15_studio_save_and_load_strip_scenario_node_no_save_keys', () => {
    assert.ok(SCENARIO_NODE_NO_SAVE_KEYS.includes('status'));

    const loaded = createCanvasDocument('sc-no-save', {
      id: 'sc-no-save',
      name: 'Scène polluée',
      nodes: [
        {
          id: 'run-1',
          type: 'run',
          position: { x: 100, y: 50 },
          agentId: 'agent-a',
          promptId: 'prompt-a',
          status: 'completed',
        },
        {
          id: 'start-1',
          type: 'start',
          position: { x: 0, y: 0 },
          status: 'running',
        },
      ],
      connections: [],
    });

    for (const node of loaded.nodes) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(node, 'status'),
        false,
        'load : status disque stripé',
      );
    }
    assert.equal(loaded.nodes.find((n) => n.id === 'run-1')?.agentId, 'agent-a');
    assert.equal(loaded.nodes.find((n) => n.id === 'run-1')?.promptId, 'prompt-a');

    const docWithRuntimeStatus = {
      ...loaded,
      nodes: loaded.nodes.map((n) =>
        n.id === 'run-1' ? { ...n, status: 'running' as const } : n,
      ),
    };

    const payload = buildScenarioPersistPayload(docWithRuntimeStatus);
    assert.equal(payload.id, 'sc-no-save');
    assert.equal(payload.name, 'Scène polluée');
    for (const node of payload.nodes) {
      for (const key of SCENARIO_NODE_NO_SAVE_KEYS) {
        assert.equal(
          Object.prototype.hasOwnProperty.call(node, key),
          false,
          `payload Enregistrer : clé no-save "${key}" absente`,
        );
      }
    }
    const run = payload.nodes.find((n) => n.id === 'run-1');
    assert.ok(run);
    assert.equal(run.agentId, 'agent-a');
    assert.equal(run.promptId, 'prompt-a');
    assert.deepEqual(run.position, { x: 100, y: 50 });
  });
});
