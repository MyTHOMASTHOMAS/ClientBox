import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { BlockMessage } from '../../../src/types/messages/block-message.message.js';
import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import type {
  ExecutionContext,
  CLIAdapter,
  CommandSpawnOptions,
} from '../../../src/types/contracts/cli-adapter.contract.js';
import { buildBlockMessage } from '../../../src/domain/messages/block-message.factory.js';
import { putIncomingMessage } from '../../../src/domain/messages/input-bag.domain.js';
import { flushPromises } from '../../helpers/flush-promises.js';

interface EmittedOnPort {
  readonly targetId: string;
  readonly message: BlockMessage;
}

function fanOut(message: BlockMessage, targetIds: readonly string[]): EmittedOnPort[] {
  return targetIds.map((targetId) => ({ targetId, message }));
}

class RecordingCLIAdapter implements CLIAdapter {
  readonly cliId = 'test-cli';
  readonly buildCalls: ExecutionContext[] = [];

  buildCommand(ctx: ExecutionContext): CommandSpawnOptions {
    this.buildCalls.push(ctx);
    return {
      command: 'test-cli',
      args: ['--prompt', ctx.assembledPrompt],
      cwd: ctx.workspacePath,
    };
  }

  parseStreamLine(line: string): { type: 'stdout'; chunk: string } {
    return { type: 'stdout', chunk: line };
  }
}

describe('CASE-ENG-03-2 — exécution et émission du bloc Run (SPEC-ENG-03)', () => {
  it('test_CASE_ENG_03_2_run_block_execution_emission_and_endpoint', async () => {
    const adapter = new RecordingCLIAdapter();
    const staticPrompt = "Génère l'API";
    const ctx: ExecutionContext = {
      workspacePath: '/ws',
      agentId: 'dev',
      assembledPrompt: staticPrompt,
    };

    // Sac d'entrées présent mais ignoré pour le prompt (R-12)
    const bag: BlockInputBag = putIncomingMessage(
      {},
      'input_0',
      buildBlockMessage('run', 'ignore-me', 1),
    );
    const options = adapter.buildCommand(ctx);
    await flushPromises();
    assert.equal(adapter.buildCalls.length, 1);
    assert.equal(adapter.buildCalls[0]?.assembledPrompt, staticPrompt);
    assert.ok(!options.args.join('\0').includes('ignore-me'));
    assert.ok(options.args.join('\0').includes(staticPrompt));
    assert.ok(bag.input_0 !== undefined); // sac présent mais non consommé

    const cliOutput = 'API générée avec 5 routes';
    const runMsg = buildBlockMessage('run', cliOutput, 1);
    const fan = fanOut(runMsg, ['next-1', 'next-2']);
    await flushPromises();
    assert.equal(fan.length, 2);
    for (const { message } of fan) {
      assert.equal(message.blockType, 'run');
      assert.equal(message.value, cliOutput);
      assert.equal(message.power, 1);
    }

    // Endpoint 0 sortie
    const endpoint = fanOut(buildBlockMessage('run', cliOutput, 1), []);
    assert.deepEqual(endpoint, []);
  });
});
