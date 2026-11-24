import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { BlockMessage } from '../../../src/types/messages/block-message.message.js';
import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import { buildBlockMessage } from '../../../src/domain/messages/block-message.factory.js';
import { putIncomingMessage } from '../../../src/domain/messages/input-bag.domain.js';
import { flushPromises } from '../../helpers/flush-promises.js';

function assertNoKeyOnMessage(message: BlockMessage): void {
  assert.equal('key' in message, false);
  assert.equal(Object.prototype.hasOwnProperty.call(message, 'key'), false);
  const keys = Object.keys(message).sort();
  assert.deepEqual(keys, ['blockType', 'power', 'value']);
}

describe("CASE-ENG-01-2 — indexation du sac d'entrées par les clés du bloc cible (SPEC-ENG-01)", () => {
  it('test_CASE_ENG_01_2_input_bag_indexing_by_entry_keys', async () => {
    const msg0: BlockMessage = buildBlockMessage('run', 'Spécification v1', 1);
    const msg1: BlockMessage = buildBlockMessage('run', 'Implémentation v1', 1);

    // Ports câblés : 0 → spec_doc, 1 → code_doc ; port 2 (clé "2") non câblé
    let bag: BlockInputBag = {};
    bag = putIncomingMessage(bag, 'spec_doc', msg0);
    bag = putIncomingMessage(bag, 'code_doc', msg1);
    await flushPromises();

    assert.deepEqual(Object.keys(bag).sort(), ['code_doc', 'spec_doc']);
    assert.deepEqual(bag.spec_doc, msg0);
    assert.deepEqual(bag.code_doc, msg1);
    assert.equal('2' in bag, false);
    assert.equal(bag['2'], undefined);

    // Immutabilité : l'ancien sac n'est pas muté
    const previous: BlockInputBag = { spec_doc: msg0 };
    const next = putIncomingMessage(previous, 'code_doc', msg1);
    assert.equal('code_doc' in previous, false);
    assert.equal('code_doc' in next, true);
    assertNoKeyOnMessage(bag.spec_doc);
    assertNoKeyOnMessage(bag.code_doc);
  });
});
