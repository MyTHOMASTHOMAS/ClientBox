import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { CodexCLIAdapter } from '../../../src/lib/adapters/codex/codex-cli.adapter.js';
import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';
import { AntigravityCLIAdapter } from '../../../src/lib/adapters/antigravity/antigravity-cli.adapter.js';

describe('CASE-ADPT-05-3 — décodage résilient flux parseStreamLine et normalisation parseOutput Codex (SPEC-ADPT-05)', () => {
  it('test_CASE_ADPT_05_3_codex_stream_parsing_to_agent_stream_event', () => {
    const adapter = new CodexCLIAdapter();

    // 1. Événement JSONL agent_message dans item.completed
    const agentMsgLine = JSON.stringify({
      type: 'item.completed',
      item: {
        id: 'item_0',
        type: 'agent_message',
        text: 'Refactoring achevé avec succès.\n',
      },
    });
    const fromAgentMsg = adapter.parseStreamLine(agentMsgLine);
    assert.equal(fromAgentMsg.type, 'stdout');
    assert.equal(fromAgentMsg.chunk, 'Refactoring achevé avec succès.\n');

    // 2. Événement JSONL système (thread.started)
    const threadStartedLine = JSON.stringify({
      type: 'thread.started',
      thread_id: '01a1c467-d234-7020-9cff-1d6cbdfeb8ca',
    });
    const fromThreadStarted = adapter.parseStreamLine(threadStartedLine);
    assert.equal(fromThreadStarted.type, 'stdout');
    assert.equal(fromThreadStarted.chunk, threadStartedLine);

    // 3. Rétro-compatibilité format { type: 'text', content: '...' }
    const retroLine = JSON.stringify({
      type: 'text',
      content: 'Contenu format classique',
    });
    const fromRetro = adapter.parseStreamLine(retroLine);
    assert.equal(fromRetro.type, 'stdout');
    assert.equal(fromRetro.chunk, 'Contenu format classique');

    // 4. Texte brut sur stdout
    const rawLine = 'Reading additional input from stdin...';
    const fromRaw = adapter.parseStreamLine(rawLine);
    assert.equal(fromRaw.type, 'stdout');
    assert.equal(fromRaw.chunk, rawLine);

    // 5. JSON malformé / tronqué
    const brokenLine = '{"type":"item.completed","item":';
    const fromBroken = adapter.parseStreamLine(brokenLine);
    assert.equal(fromBroken.type, 'stdout');
    assert.equal(fromBroken.chunk, brokenLine);
  });

  it('test_CASE_ADPT_05_3_codex_parse_output_extracts_clean_agent_response', () => {
    const adapter = new CodexCLIAdapter();

    // 1. Sortie brute multi-lignes avec métadonnées techniques et réponse agent
    const rawOutput = [
      '{"type":"thread.started","thread_id":"01a1c505-6055-7893-a918-21c4e1a722e1"}',
      '{"type":"turn.started"}',
      '{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"4721"}}',
      '{"type":"turn.completed","usage":{"input_tokens":42900,"cached_input_tokens":38528,"output_tokens":33}}',
    ].join('\n');

    assert.equal(typeof adapter.parseOutput, 'function');
    assert.equal(adapter.parseOutput(rawOutput), '4721');

    // 2. Sortie brute en texte pur (fallback non altéré)
    const plainText = 'Direct text output';
    assert.equal(adapter.parseOutput(plainText), 'Direct text output');

    // 3. Multiples messages d'agent concaténés
    const multiMsgOutput = [
      '{"type":"thread.started","thread_id":"uuid-1"}',
      '{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"Étape 1 terminée.\\n"}}',
      '{"type":"item.completed","item":{"id":"item_1","type":"agent_message","text":"Étape 2 terminée."}}',
      '{"type":"turn.completed"}',
    ].join('\n');
    assert.equal(adapter.parseOutput(multiMsgOutput), 'Étape 1 terminée.\nÉtape 2 terminée.');

    // 4. Pass-through pour Cursor et Antigravity
    const cursor = new CursorCLIAdapter();
    assert.equal(typeof cursor.parseOutput, 'function');
    assert.equal(cursor.parseOutput('4721'), '4721');

    const agy = new AntigravityCLIAdapter();
    assert.equal(typeof agy.parseOutput, 'function');
    assert.equal(agy.parseOutput('4721'), '4721');
  });
});

