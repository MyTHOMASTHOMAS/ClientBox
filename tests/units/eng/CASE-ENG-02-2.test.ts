import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { Connection } from '../../../src/types/models/connection.model.js';
import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import { evaluateJoin } from '../../../src/domain/join/join-barrier.evaluator.js';
import { buildBlockMessage } from '../../../src/domain/messages/block-message.factory.js';
import { putIncomingMessage } from '../../../src/domain/messages/input-bag.domain.js';
import { flushPromises } from '../../helpers/flush-promises.js';

function wiredConnections(targetNodeId: string, keys: readonly string[]): Connection[] {
  return keys.map((key, index) => ({
    sourceNodeId: `src-${index}`,
    sourcePortIndex: 0,
    targetNodeId,
    targetPortIndex: 0,
    key,
  }));
}

describe("CASE-ENG-02-2 — transition vers l'état pause et réactivation ultérieure (SPEC-ENG-02)", () => {
  it('test_CASE_ENG_02_2_pause_state_transition_and_subsequent_unpause', async () => {
    const target = 'run-pause';
    const connections = wiredConnections(target, ['0', '1']);

    let bag: BlockInputBag = {};
    bag = putIncomingMessage(bag, '0', buildBlockMessage('if', 'ok', 1));
    bag = putIncomingMessage(bag, '1', buildBlockMessage('if', 'skip', 0));
    await flushPromises();

    assert.equal(Object.keys(bag).length, 2);
    assert.equal(evaluateJoin(bag, connections), 'pause');

    bag = putIncomingMessage(bag, '1', buildBlockMessage('if', 'retry_ok', 1));
    await flushPromises();
    assert.equal(evaluateJoin(bag, connections), 'trigger');

    // N=1 avec power 0 → pause
    const singleConns = wiredConnections('run-single-pause', ['0']);
    const pausedSingle = putIncomingMessage({}, '0', buildBlockMessage('if', 'skip', 0));
    await flushPromises();
    assert.equal(evaluateJoin(pausedSingle, singleConns), 'pause');
  });
});
