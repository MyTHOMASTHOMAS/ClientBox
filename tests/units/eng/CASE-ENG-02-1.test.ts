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

describe('CASE-ENG-02-1 — déclenchement du Join à réception complète avec pleine puissance (SPEC-ENG-02)', () => {
  it('test_CASE_ENG_02_1_join_trigger_when_all_inputs_received_with_full_power', async () => {
    const target = 'run-join';
    const connections = wiredConnections(target, ['0', '1', '2']);

    let bag: BlockInputBag = {};
    bag = putIncomingMessage(bag, '0', buildBlockMessage('run', 'data-A', 1));
    bag = putIncomingMessage(bag, '1', buildBlockMessage('run', 'data-B', 1));
    await flushPromises();
    assert.equal(evaluateJoin(bag, connections), 'waiting');

    bag = putIncomingMessage(bag, '2', buildBlockMessage('run', 'data-C', 1));
    await flushPromises();
    assert.equal(evaluateJoin(bag, connections), 'trigger');

    // N=1 mono-entrée
    const singleConns = wiredConnections('run-single', ['0']);
    const singleBag = putIncomingMessage({}, '0', buildBlockMessage('run', 'data-0', 1));
    await flushPromises();
    assert.equal(evaluateJoin(singleBag, singleConns), 'trigger');

    // power: 2 sur un seul port alors que N=2 → waiting (cardinalité)
    const n2 = wiredConnections('run-join-2', ['0', '1']);
    const premature = putIncomingMessage({}, '0', buildBlockMessage('run', 'data-err', 2));
    await flushPromises();
    assert.equal(evaluateJoin(premature, n2), 'waiting');

    // Last-Write-Wins sur le même port avant complétude
    let lww: BlockInputBag = {};
    lww = putIncomingMessage(lww, '0', buildBlockMessage('run', 'data-v1', 0));
    lww = putIncomingMessage(lww, '0', buildBlockMessage('run', 'data-v2', 1));
    await flushPromises();
    assert.equal(lww['0']?.value, 'data-v2');
    assert.equal(lww['0']?.power, 1);
    assert.equal(evaluateJoin(lww, n2), 'waiting');
  });
});
