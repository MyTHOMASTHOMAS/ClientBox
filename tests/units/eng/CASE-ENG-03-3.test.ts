import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import { buildBlockMessage } from '../../../src/domain/messages/block-message.factory.js';
import { distributeIfPower } from '../../../src/domain/messages/if-branch-power.dispatcher.js';
import { runIfScript } from '../../../src/lib/fs/dynamic-module-loader.fs.js';
import { flushPromises } from '../../helpers/flush-promises.js';

describe('CASE-ENG-03-3 — évaluation du bloc If et distribution différentielle de puissance (SPEC-ENG-03)', () => {
  it('test_CASE_ENG_03_3_if_block_evaluation_and_differential_power_dispatch', async () => {
    const ifFn = (sac: BlockInputBag): boolean => sac.data?.value === 'OK';

    const sacOk: BlockInputBag = {
      data: buildBlockMessage('run', 'OK', 1),
    };
    const sacKo: BlockInputBag = {
      data: buildBlockMessage('run', 'KO', 1),
    };

    assert.equal(runIfScript(ifFn, sacOk), true);
    assert.equal(runIfScript(ifFn, sacKo), false);
    await flushPromises();

    const truePorts = ['True-1', 'True-2'] as const;
    const falsePorts = ['False-1'] as const;

    const whenTrue = distributeIfPower(true, [...truePorts], [...falsePorts]);
    await flushPromises();
    assert.equal(whenTrue.length, 3);
    for (const e of whenTrue) {
      assert.equal(e.message.blockType, 'if');
      if (e.portId === 'True-1' || e.portId === 'True-2') {
        assert.equal(e.message.power, 1);
      } else {
        assert.equal(e.portId, 'False-1');
        assert.equal(e.message.power, 0);
      }
    }

    const whenFalse = distributeIfPower(false, [...truePorts], [...falsePorts]);
    await flushPromises();
    for (const e of whenFalse) {
      assert.equal(e.message.blockType, 'if');
      if (e.portId === 'False-1') {
        assert.equal(e.message.power, 1);
      } else {
        assert.equal(e.message.power, 0);
      }
    }

    // 0 sortie sur branche fausse + condition false → aucun message, pas d'erreur
    assert.doesNotThrow(() => {
      const emptyFalse = distributeIfPower(false, ['True-1'], []);
      assert.equal(emptyFalse.length, 1);
      assert.equal(emptyFalse[0]?.message.power, 0);
      const onlyFalseEmpty = distributeIfPower(false, [], []);
      assert.deepEqual(onlyFalseEmpty, []);
    });
  });
});
