import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type {
  CLIAdapter,
  ExecutionContext,
  CommandSpawnOptions,
} from '../../../src/types/contracts/cli-adapter.contract.js';
import { CodexCLIAdapter } from '../../../src/lib/adapters/codex/codex-cli.adapter.js';

function assertSpawnOptions(options: CommandSpawnOptions): void {
  assert.equal(typeof options.command, 'string');
  assert.ok(Array.isArray(options.args));
  assert.equal(typeof options.cwd, 'string');
  if (options.env !== undefined) {
    assert.equal(typeof options.env, 'object');
  }
}

describe('CASE-ADPT-05-1 — conformité contrat TypeScript CodexCLIAdapter (SPEC-ADPT-05)', () => {
  it('test_CASE_ADPT_05_1_codex_cli_adapter_contract_compliance', () => {
    const adapter: CLIAdapter = new CodexCLIAdapter();

    assert.equal(adapter.cliId, 'codex-cli');
    assert.equal(typeof adapter.buildCommand, 'function');
    assert.equal(typeof adapter.parseStreamLine, 'function');
    assert.equal(typeof adapter.listModels, 'function');
    assert.equal(typeof adapter.createSession, 'function');

    const ctx: ExecutionContext = {
      workspacePath: '/mock/workspace',
      agentId: 'agent-codex',
      assembledPrompt: 'Bonjour Codex',
    };

    const options = adapter.buildCommand(ctx);
    assertSpawnOptions(options);
    assert.equal(options.cwd, '/mock/workspace');
    assert.ok(options.args.includes('Bonjour Codex'));
  });
});

