import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type {
  CLIAdapter,
  ExecutionContext,
  CommandSpawnOptions,
} from '../../../src/types/contracts/cli-adapter.contract.js';
import { ClaudeCLIAdapter } from '../../../src/lib/adapters/claude/claude-cli.adapter.js';

function assertSpawnOptions(options: CommandSpawnOptions) {
  assert.equal(typeof options.command, 'string');
  assert.ok(Array.isArray(options.args));
  assert.equal(typeof options.cwd, 'string');
  if (options.env !== undefined) {
    assert.equal(typeof options.env, 'object');
  }
}

describe('CASE-ADPT-06-1 — conformité contrat TypeScript ClaudeCLIAdapter (SPEC-ADPT-06)', () => {
  it('test_CASE_ADPT_06_1_claude_cli_adapter_contract_compliance', () => {
    const adapter: CLIAdapter = new ClaudeCLIAdapter();

    assert.equal(adapter.cliId, 'claude-cli');
    assert.equal(typeof adapter.buildCommand, 'function');
    assert.equal(typeof adapter.parseStreamLine, 'function');
    assert.equal(typeof adapter.parseOutput, 'function');
    assert.equal(typeof adapter.extractSessionId, 'function');
    assert.equal(typeof adapter.listModels, 'function');
    assert.equal(typeof adapter.createSession, 'function');

    const ctx: ExecutionContext = {
      workspacePath: '/mock/workspace',
      agentId: 'agent-claude',
      assembledPrompt: 'Bonjour Claude',
    };

    const options = adapter.buildCommand(ctx);
    assertSpawnOptions(options);
    assert.equal(options.cwd, '/mock/workspace');
    assert.ok(options.args.includes('Bonjour Claude'));
  });
});

