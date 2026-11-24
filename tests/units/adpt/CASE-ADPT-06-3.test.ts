import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { ClaudeCLIAdapter } from '../../../src/lib/adapters/claude/claude-cli.adapter.js';

describe('CASE-ADPT-06-3 — décodage résilient flux parseStreamLine et normalisation parseOutput Claude (SPEC-ADPT-06)', () => {
  it('test_CASE_ADPT_06_3_claude_stream_parsing_to_agent_stream_event', () => {
    const adapter = new ClaudeCLIAdapter();

    // 1. Événement JSONL content_block_delta avec text_delta
    const textDeltaLine = JSON.stringify({
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        delta: {
          type: 'text_delta',
          text: 'Refactoring achevé.\n',
        },
      },
    });
    const fromTextDelta = adapter.parseStreamLine(textDeltaLine);
    assert.equal(fromTextDelta.type, 'stdout');
    assert.equal(fromTextDelta.chunk, 'Refactoring achevé.\n');

    // 2. Événement JSONL assistant
    const assistantLine = JSON.stringify({
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: 'Analyse validée.' }],
      },
    });
    const fromAssistant = adapter.parseStreamLine(assistantLine);
    assert.equal(fromAssistant.type, 'stdout');
    assert.equal(fromAssistant.chunk, 'Analyse validée.');

    // 3. Événement JSONL système (init / thread_id / session_id)
    const initLine = JSON.stringify({
      type: 'system',
      subtype: 'init',
      session_id: 'session_01j83abc123',
    });
    const fromInit = adapter.parseStreamLine(initLine);
    assert.equal(fromInit.type, 'stdout');
    assert.equal(fromInit.chunk, initLine);

    // 4. Texte brut sur stdout
    const rawLine = 'Warning: Experimental feature';
    const fromRaw = adapter.parseStreamLine(rawLine);
    assert.equal(fromRaw.type, 'stdout');
    assert.equal(fromRaw.chunk, rawLine);

    // 5. JSON malformé / tronqué
    const brokenLine = '{"type":"stream_event","event":';
    const fromBroken = adapter.parseStreamLine(brokenLine);
    assert.equal(fromBroken.type, 'stdout');
    assert.equal(fromBroken.chunk, brokenLine);
  });

  it('test_CASE_ADPT_06_3_claude_parse_output_extracts_clean_agent_response', () => {
    const adapter = new ClaudeCLIAdapter();

    // 1. Sortie brute multi-lignes avec deltas textuels
    const rawOutputWithDeltas = [
      '{"type":"system","subtype":"init","session_id":"session_01j83abc123"}',
      '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Code "}}}',
      '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"4721"}}}',
      '{"type":"result","subtype":"success","result":"Code 4721"}',
    ].join('\n');

    assert.equal(typeof adapter.parseOutput, 'function');
    assert.equal(adapter.parseOutput(rawOutputWithDeltas), 'Code 4721');

    // 2. Sortie brute en texte pur (fallback non altéré)
    const plainText = 'Code généré proprement';
    assert.equal(adapter.parseOutput(plainText), 'Code généré proprement');

    // 3. Multiples messages assistant
    const multiAssistantOutput = [
      '{"type":"system","subtype":"init","session_id":"session_01j83abc123"}',
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Étape 1 terminée.\\n"}]}}',
      '{"type":"assistant","message":{"content":[{"type":"text","text":"Étape 2 terminée."}]}}',
      '{"type":"result","subtype":"success","result":"ok"}',
    ].join('\n');
    assert.equal(adapter.parseOutput(multiAssistantOutput), 'Étape 1 terminée.\nÉtape 2 terminée.');
  });
});

