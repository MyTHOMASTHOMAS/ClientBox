import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { Connection } from '../../../src/types/models/connection.model.js';
import { renumberDefaultKeys } from '../../../src/domain/keys/key-renumberer.domain.js';

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

function keysForTarget(connections: readonly Connection[], targetNodeId: string): string[] {
  return connections.filter((c) => c.targetNodeId === targetNodeId).map((c) => c.key);
}

describe('CASE-DATA-03-2 — renommage automatique des clés numériques après suppression (SPEC-DATA-03)', () => {
  it('test_CASE_DATA_03_2_default_key_renumbering_after_deletion', () => {
    const target = 'if-1';
    const initial: Connection[] = [
      conn({ sourceNodeId: 'a', targetNodeId: target, key: '0' }),
      conn({ sourceNodeId: 'b', targetNodeId: target, key: '1' }),
      conn({ sourceNodeId: 'c', targetNodeId: target, key: '2' }),
    ];

    const afterRemove1 = initial.filter((c) => c.key !== '1');
    const renumbered1 = renumberDefaultKeys(afterRemove1, '1');
    assert.deepEqual(keysForTarget(renumbered1, target).sort(), ['0', '1']);
    assert.ok(!keysForTarget(renumbered1, target).includes('2'));
    const connC = renumbered1.find((c) => c.sourceNodeId === 'c');
    assert.ok(connC !== undefined);
    assert.equal(connC.key, '1');

    const initial2: Connection[] = [
      conn({ sourceNodeId: 'a', targetNodeId: 'if-2', key: '0' }),
      conn({ sourceNodeId: 'b', targetNodeId: 'if-2', key: '1' }),
    ];
    const afterRemove0 = initial2.filter((c) => c.key !== '0');
    const renumbered0 = renumberDefaultKeys(afterRemove0, '0');
    assert.deepEqual(keysForTarget(renumbered0, 'if-2'), ['0']);
    assert.equal(renumbered0.find((c) => c.sourceNodeId === 'b')?.key, '0');
  });
});
