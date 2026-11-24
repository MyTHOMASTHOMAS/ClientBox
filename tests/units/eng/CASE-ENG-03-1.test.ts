import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { BlockMessage } from '../../../src/types/messages/block-message.message.js';
import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import { buildBlockMessage } from '../../../src/domain/messages/block-message.factory.js';
import { putIncomingMessage } from '../../../src/domain/messages/input-bag.domain.js';
import { flushPromises } from '../../helpers/flush-promises.js';

interface EmittedOnPort {
  readonly targetId: string;
  readonly message: BlockMessage;
}

function fanOut(message: BlockMessage, targetIds: readonly string[]): EmittedOnPort[] {
  return targetIds.map((targetId) => ({ targetId, message }));
}

describe('CASE-ENG-03-1 — émission initiale du bloc Start (SPEC-ENG-03)', () => {
  it('test_CASE_ENG_03_1_start_block_initial_emission', async () => {
    const startMsg = buildBlockMessage('start', null, 1);
    await flushPromises();

    assert.equal(startMsg.blockType, 'start');
    assert.equal(startMsg.value, null);
    assert.equal(startMsg.power, 1);
    assert.equal('key' in startMsg, false);

    const emissions = fanOut(startMsg, ['run-A', 'run-B']);
    assert.equal(emissions.length, 2);
    for (const { message } of emissions) {
      assert.equal(message.power, 1);
      assert.equal(message.blockType, 'start');
      assert.equal(message.value, null);
    }

    let bagA: BlockInputBag = {};
    let bagB: BlockInputBag = {};
    bagA = putIncomingMessage(bagA, '0', startMsg);
    bagB = putIncomingMessage(bagB, '0', startMsg);
    await flushPromises();
    assert.equal(bagA['0']?.power, 1);
    assert.equal(bagB['0']?.power, 1);

    // Start isolé (0 sortie) : exécution sans erreur
    assert.doesNotThrow(() => {
      const isolated = fanOut(buildBlockMessage('start', null, 1), []);
      assert.deepEqual(isolated, []);
    });
  });
});
