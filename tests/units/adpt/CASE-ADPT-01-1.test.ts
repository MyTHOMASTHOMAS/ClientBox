import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type {
  CLIAdapter,
  ExecutionContext,
  AgentStreamEvent,
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

function assertStreamEvent(event: AgentStreamEvent): void {
  assert.ok(['stdout', 'stderr', 'exit', 'error'].includes(event.type));
  assert.equal(typeof event.chunk, 'string');
}

/**
 * Adapter minimal de conformité de contrat (CASE-ADPT-01-1) — hors production.
 */
class TestCLIAdapter implements CLIAdapter {
  readonly cliId = 'test-cli';

  buildCommand(ctx: ExecutionContext): CommandSpawnOptions {
    return {
      command: 'test-cli',
      args: ['--prompt', ctx.assembledPrompt],
      cwd: ctx.workspacePath,
      env: ctx.cliOpaque === undefined ? undefined : { CLI_OPAQUE: JSON.stringify(ctx.cliOpaque) },
    };
  }

  parseStreamLine(line: string): AgentStreamEvent {
    return { type: 'stdout', chunk: line };
  }

  async createSession(): Promise<string> {
    return 'test-session';
  }
}

const baseCtx: ExecutionContext = {
  workspacePath: '/home/user/workspace/app',
  agentId: 'agent-backend',
  assembledPrompt: 'Directives système\n\nPrompt utilisateur test',
  sessionId: 'chat-abc-123',
  cliOpaque: { customFlag: true },
};

describe('CASE-ADPT-01-1 — conformité du contrat CLIAdapter (SPEC-ADPT-01)', () => {
  it('test_CASE_ADPT_01_1_cli_adapter_typescript_contract_compliance', () => {
    const testAdapter: CLIAdapter = new TestCLIAdapter();
    const cursorAdapter: CLIAdapter = new CursorCLIAdapter();

    for (const adapter of [testAdapter, cursorAdapter]) {
      assert.equal(typeof adapter.cliId, 'string');
      assert.ok(adapter.cliId.length > 0);
      assert.equal(typeof adapter.buildCommand, 'function');
      assert.equal(typeof adapter.parseStreamLine, 'function');

      const options = adapter.buildCommand(baseCtx);
      assertSpawnOptions(options);
      assert.ok(options.command.length > 0);
      assert.equal(options.cwd, baseCtx.workspacePath);

      const event = adapter.parseStreamLine('ligne de test');
      assertStreamEvent(event);
    }

    assert.equal(cursorAdapter.cliId, 'cursor-cli');
    assert.equal(typeof cursorAdapter.createSession, 'function');
    assert.equal('clearContext' in cursorAdapter, false);
  });
});
