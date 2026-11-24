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

describe('CASE-DATA-03-3 — préservation des clés textuelles personnalisées (SPEC-DATA-03)', () => {
  it('test_CASE_DATA_03_3_custom_keys_preserved_after_deletion', () => {
    const target = 'if-1';
    const mixed: Connection[] = [
      conn({ sourceNodeId: 'a', targetNodeId: target, key: 'promptData' }),
      conn({ sourceNodeId: 'b', targetNodeId: target, key: '0' }),
      conn({ sourceNodeId: 'c', targetNodeId: target, key: '1' }),
    ];
    const afterRemoveNumeric = mixed.filter((c) => c.key !== '0');
    const renumbered = renumberDefaultKeys(afterRemoveNumeric, '0');
    const keys = keysForTarget(renumbered, target);
    assert.ok(keys.includes('promptData'));
    assert.equal(renumbered.find((c) => c.sourceNodeId === 'a')?.key, 'promptData');
    assert.equal(renumbered.find((c) => c.sourceNodeId === 'c')?.key, '0');
    assert.deepEqual([...keys].sort(), ['0', 'promptData']);

    const customOnly: Connection[] = [
      conn({ sourceNodeId: 'a', targetNodeId: 'run-1', key: 'contextInput' }),
      conn({ sourceNodeId: 'b', targetNodeId: 'run-1', key: 'mainPrompt' }),
    ];
    const afterRemoveCustom = customOnly.filter((c) => c.key !== 'contextInput');
    const preserved = renumberDefaultKeys(afterRemoveCustom, 'contextInput');
    assert.deepEqual(keysForTarget(preserved, 'run-1'), ['mainPrompt']);
    assert.equal(preserved.find((c) => c.sourceNodeId === 'b')?.key, 'mainPrompt');
  });
});
