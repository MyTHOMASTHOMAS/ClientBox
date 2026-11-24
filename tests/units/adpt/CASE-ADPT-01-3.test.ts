import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { AgentStreamEvent } from '../../../src/types/contracts/cli-adapter.contract.js';
import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';

function assertStreamEvent(event: AgentStreamEvent): void {
  assert.ok(['stdout', 'stderr', 'exit', 'error'].includes(event.type));
  assert.equal(typeof event.chunk, 'string');
}

describe('CASE-ADPT-01-3 — normalisation du flux et fallback robuste (SPEC-ADPT-01)', () => {
  it('test_CASE_ADPT_01_3_stream_normalization_and_graceful_fallback', () => {
    const adapter = new CursorCLIAdapter();

    const nominal = adapter.parseStreamLine('Compilation réussie');
    assert.doesNotThrow(() => adapter.parseStreamLine('Compilation réussie'));
    assertStreamEvent(nominal);
    assert.equal(nominal.type, 'stdout');
    assert.equal(nominal.chunk, 'Compilation réussie');

    const warningLine = 'Warning: deprecated flag';
    const warning = adapter.parseStreamLine(warningLine);
    assertStreamEvent(warning);
    assert.ok((warning.type as string) === 'stderr' || warning.type === 'stdout');
    assert.equal(warning.chunk, warningLine);

    const malformed = '{ malformed json :: %%%';
    let fallback: AgentStreamEvent | undefined;
    assert.doesNotThrow(() => {
      fallback = adapter.parseStreamLine(malformed);
    });
    assert.ok(fallback !== undefined);
    assert.equal(fallback.type, 'stdout');
    assert.equal(fallback.chunk, malformed);

    for (const line of ['', '   ', '{"ok":true}', '🎉', '\x00null']) {
      assert.doesNotThrow(() => {
        const event = adapter.parseStreamLine(line);
        assertStreamEvent(event);
      });
    }
  });
});
