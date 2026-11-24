import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { BlockMessage } from '../../../src/types/messages/block-message.message.js';
import { buildBlockMessage } from '../../../src/domain/messages/block-message.factory.js';
import { flushPromises } from '../../helpers/flush-promises.js';

function assertNoKeyOnMessage(message: BlockMessage): void {
  assert.equal('key' in message, false);
  assert.equal(Object.prototype.hasOwnProperty.call(message, 'key'), false);
  const keys = Object.keys(message).sort();
  assert.deepEqual(keys, ['blockType', 'power', 'value']);
}

describe('CASE-ENG-01-1 — structure du message de bloc sans clé sur la sortie (SPEC-ENG-01)', () => {
  it('test_CASE_ENG_01_1_block_message_structure_no_output_key', async () => {
    const emissions: BlockMessage[] = [];

    const runMessage = buildBlockMessage('run', 'Résultat de génération', 1);
    emissions.push(runMessage);
    await flushPromises();

    assert.equal(emissions.length, 1);
    const runOut = emissions[0];
    assert.equal(runOut.blockType, 'run');
    assert.equal(runOut.value, 'Résultat de génération');
    assert.equal(runOut.power, 1);
    assertNoKeyOnMessage(runOut);

    const startMessage = buildBlockMessage('start', null, 1);
    emissions.push(startMessage);
    await flushPromises();

    const startOut = emissions[1];
    assert.equal(startOut.blockType, 'start');
    assert.equal(startOut.value, null);
    assert.equal(startOut.power, 1);
    assertNoKeyOnMessage(startOut);

    // Garde-fou : injection accidentelle d'une clé sur sortie doit échouer le contrat
    const polluted = {
      ...runOut,
      key: 'should-not-exist',
    } as BlockMessage & { key: string };
    assert.equal('key' in polluted, true);
    assert.notDeepEqual(Object.keys(polluted).sort(), ['blockType', 'power', 'value']);
  });
});
