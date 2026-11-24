import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type {
  ExecutionContext,
  CommandSpawnOptions,
} from '../../../src/types/contracts/cli-adapter.contract.js';
import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';

function assertSpawnOptions(options: CommandSpawnOptions): void {
  assert.equal(typeof options.command, 'string');
  assert.ok(Array.isArray(options.args));
  assert.equal(typeof options.cwd, 'string');
  if (options.env !== undefined) {
    assert.equal(typeof options.env, 'object');
  }
}

const baseCtx: ExecutionContext = {
  workspacePath: '/home/user/workspace/app',
  agentId: 'agent-backend',
  assembledPrompt: 'Directives système\n\nPrompt utilisateur test',
  sessionId: 'chat-abc-123',
  cliOpaque: { customFlag: true },
};

describe('CASE-ADPT-01-2 — typage et propagation de ExecutionContext (SPEC-ADPT-01)', () => {
  it('test_CASE_ADPT_01_2_execution_context_typing_and_propagation', () => {
    const adapter = new CursorCLIAdapter();

    assert.equal(baseCtx.workspacePath, '/home/user/workspace/app');
    assert.equal(baseCtx.agentId, 'agent-backend');
    assert.equal(baseCtx.assembledPrompt, 'Directives système\n\nPrompt utilisateur test');
    assert.equal(baseCtx.sessionId, 'chat-abc-123');
    assert.deepEqual(baseCtx.cliOpaque, { customFlag: true });

    const withOpaque = adapter.buildCommand(baseCtx);
    assert.equal(withOpaque.cwd, baseCtx.workspacePath);
    assert.ok(
      withOpaque.args.includes(baseCtx.assembledPrompt),
      'assembledPrompt doit être transmis tel quel sans re-concaténation (R-45)',
    );
    assert.ok(withOpaque.args.includes('chat-abc-123'), 'sessionId doit être transmis au CLI');

    const withoutOpaque: ExecutionContext = {
      workspacePath: baseCtx.workspacePath,
      agentId: baseCtx.agentId,
      assembledPrompt: baseCtx.assembledPrompt,
      sessionId: baseCtx.sessionId,
    };
    const defaults = adapter.buildCommand(withoutOpaque);
    assertSpawnOptions(defaults);
    assert.equal(defaults.cwd, withoutOpaque.workspacePath);
    assert.ok(defaults.args.includes(withoutOpaque.assembledPrompt));

    // C-13 : pass-through mémoire — buildCommand ne matérialise pas de chemin sous data/
    assert.ok(!('dataPath' in withOpaque));
    assert.equal('command' in withOpaque && 'args' in withOpaque && 'cwd' in withOpaque, true);
  });
});
