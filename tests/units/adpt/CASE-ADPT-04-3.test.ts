import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { AntigravityCLIAdapter } from '../../../src/lib/adapters/antigravity/antigravity-cli.adapter.js';

describe('CASE-ADPT-04-3 — décodage résilient flux parseStreamLine Antigravity (SPEC-ADPT-04)', () => {
  it('test_CASE_ADPT_04_3_antigravity_stream_parsing_to_agent_stream_event', () => {
    const adapter = new AntigravityCLIAdapter();

    // 1. NDJSON step_update avec text_delta
    const stepLine = JSON.stringify({
      event: 'step_update',
      step_update: {
        conversation_id: 'conv-1',
        step_index: 1,
        state: 'DONE',
        text_delta: 'Démarrage du refactoring...\n',
      },
    });
    const fromStep = adapter.parseStreamLine(stepLine);
    assert.equal(fromStep.type, 'stdout');
    assert.equal(fromStep.chunk, 'Démarrage du refactoring...\n');

    // 2. NDJSON result avec response
    const resultLine = JSON.stringify({
      event: 'result',
      result: {
        conversation_id: 'conv-1',
        status: 'SUCCESS',
        response: 'Refactoring achevé avec succès.\n',
      },
    });
    const fromResult = adapter.parseStreamLine(resultLine);
    assert.equal(fromResult.type, 'stdout');
    assert.equal(fromResult.chunk, 'Refactoring achevé avec succès.\n');

    // 3. JSON standard print avec response direct
    const jsonPrintLine = JSON.stringify({
      conversation_id: 'conv-1',
      status: 'SUCCESS',
      response: 'Sortie directe\n',
    });
    const fromPrint = adapter.parseStreamLine(jsonPrintLine);
    assert.equal(fromPrint.type, 'stdout');
    assert.equal(fromPrint.chunk, 'Sortie directe\n');

    // 4. Rétro-compatibilité format { type: 'text', content: '...' }
    const retroLine = JSON.stringify({
      type: 'text',
      content: 'Contenu format classique',
    });
    const fromRetro = adapter.parseStreamLine(retroLine);
    assert.equal(fromRetro.type, 'stdout');
    assert.equal(fromRetro.chunk, 'Contenu format classique');

    // 5. Texte brut sur stdout
    const rawLine = 'Fetching available models...';
    const fromRaw = adapter.parseStreamLine(rawLine);
    assert.equal(fromRaw.type, 'stdout');
    assert.equal(fromRaw.chunk, rawLine);

    // 6. JSON malformé — ne lève jamais d'exception
    assert.doesNotThrow(() => {
      const brokenLine = '{"event":"step_update","step_update":{';
      const fromBroken = adapter.parseStreamLine(brokenLine);
      assert.equal(fromBroken.type, 'stdout');
      assert.equal(fromBroken.chunk, brokenLine);
    });
  });

  it('test_CASE_ADPT_04_3_antigravity_parse_output_extracts_clean_agent_text', () => {
    const adapter = new AntigravityCLIAdapter();
    assert.equal(typeof adapter.parseOutput, 'function');

    // 1. Sortie multi-lignes avec result final
    const rawWithResult = [
      JSON.stringify({ event: 'init', conversation_id: 'c-1' }),
      JSON.stringify({
        event: 'step_update',
        step_update: { text_delta: 'Calcul en cours...' },
      }),
      JSON.stringify({
        event: 'result',
        result: { status: 'SUCCESS', response: '42' },
      }),
    ].join('\n');
    assert.equal(adapter.parseOutput(rawWithResult), '42');

    // 2. Sortie multi-lignes ne contenant que des step_update
    const rawOnlySteps = [
      JSON.stringify({
        event: 'step_update',
        step_update: { text_delta: 'Partie 1\n' },
      }),
      JSON.stringify({
        event: 'step_update',
        step_update: { text_delta: 'Partie 2' },
      }),
    ].join('\n');
    assert.equal(adapter.parseOutput(rawOnlySteps), 'Partie 1\nPartie 2');

    // 3. Sortie texte pur brut non-JSON
    const plainText = 'Texte brut direct';
    assert.equal(adapter.parseOutput(plainText), plainText);
  });
});

