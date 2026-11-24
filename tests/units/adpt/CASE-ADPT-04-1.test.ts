import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type {
  CLIAdapter,
  ExecutionContext,
  CommandSpawnOptions,
} from '../../../src/types/contracts/cli-adapter.contract.js';
import { AntigravityCLIAdapter } from '../../../src/lib/adapters/antigravity/antigravity-cli.adapter.js';

function assertSpawnOptions(options: CommandSpawnOptions): void {
  assert.equal(typeof options.command, 'string');
  assert.ok(Array.isArray(options.args));
  assert.equal(typeof options.cwd, 'string');
  if (options.env !== undefined) {
    assert.equal(typeof options.env, 'object');
  }
}

describe('CASE-ADPT-04-1 — conformité contrat TypeScript AntigravityCLIAdapter (SPEC-ADPT-04)', () => {
  it('test_CASE_ADPT_04_1_antigravity_cli_adapter_contract_compliance', () => {
    const adapter: CLIAdapter = new AntigravityCLIAdapter();

    assert.equal(adapter.cliId, 'antigravity');
    assert.equal(typeof adapter.buildCommand, 'function');
    assert.equal(typeof adapter.parseStreamLine, 'function');
    assert.equal(typeof adapter.listModels, 'function');

    const ctx: ExecutionContext = {
      workspacePath: '/mock/workspace',
      agentId: 'agent-antigravity',
      assembledPrompt: 'Bonjour Antigravity',
    };

    const options = adapter.buildCommand(ctx);
    assertSpawnOptions(options);
    assert.equal(options.cwd, '/mock/workspace');
    assert.ok(options.args.includes('Bonjour Antigravity'));
  });
});

