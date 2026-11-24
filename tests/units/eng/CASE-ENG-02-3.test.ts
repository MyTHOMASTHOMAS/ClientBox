import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { Connection } from '../../../src/types/models/connection.model.js';
import type { NodeType } from '../../../src/types/models/node.model.js';
import { isOrphanBlock } from '../../../src/domain/join/orphan-node.guard.js';
import { flushPromises } from '../../helpers/flush-promises.js';

describe('CASE-ENG-02-3 — inactivité des blocs à 0 entrée sauf Start (SPEC-ENG-02)', () => {
  it('test_CASE_ENG_02_3_zero_input_blocks_remain_inactive_except_start', async () => {
    const connections: Connection[] = [];
    // Start avec N=0 n'est jamais orphelin
    assert.equal(isOrphanBlock(connections, 'start-0', 'start'), false);

    const orphanTypes: Array<{ id: string; type: NodeType }> = [
      { id: 'run-orphan', type: 'run' },
      { id: 'if-orphan', type: 'if' },
      { id: 'clear-orphan', type: 'clearContext' },
    ];

    for (const { id, type } of orphanTypes) {
      assert.equal(isOrphanBlock(connections, id, type), true);
    }

    // Start câblé en sortie n'active pas les orphelins (aucune connexion entrante vers eux)
    const withStartEmission: Connection[] = [
      {
        sourceNodeId: 'start-0',
        sourcePortIndex: 0,
        targetNodeId: 'run-connected',
        targetPortIndex: 0,
        key: '0',
      },
    ];
    assert.equal(isOrphanBlock(withStartEmission, 'start-0', 'start'), false);
    assert.equal(isOrphanBlock(withStartEmission, 'run-orphan', 'run'), true);
    assert.equal(isOrphanBlock(withStartEmission, 'run-connected', 'run'), false);

    await flushPromises();
    // Après flush : les orphelins restent orphelins (pas de déclenchement résiduel)
    for (const { id, type } of orphanTypes) {
      assert.equal(isOrphanBlock(withStartEmission, id, type), true);
    }
  });
});
