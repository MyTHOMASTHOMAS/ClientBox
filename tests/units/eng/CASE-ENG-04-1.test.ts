import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { assemblePrompt } from '../../../src/domain/prompt/prompt.assembler.js';
import { flushPromises } from '../../helpers/flush-promises.js';

describe("CASE-ENG-04-1 — assemblage du prompt moteur avant transmission à l'adaptateur (SPEC-ENG-04)", () => {
  it('test_CASE_ENG_04_1_engine_prompt_assembly_before_adapter_call', async () => {
    const systemPrompt = 'Tu es un assistant expert en TypeScript. Réponds de façon concise.';
    const userPrompt = 'Écris une fonction générique de validation de schéma.';

    const assembled = assemblePrompt(systemPrompt, userPrompt);
    await flushPromises();
    assert.equal(assembled, `${systemPrompt}\n\n${userPrompt}`);
    assert.ok(assembled.includes(systemPrompt));
    assert.ok(assembled.includes(userPrompt));
    assert.ok(!assembled.startsWith('\n'));

    const emptySystem = assemblePrompt('', 'Bonjour');
    assert.equal(emptySystem, 'Bonjour');
    assert.ok(!emptySystem.startsWith('\n'));

    // CR-012 — 3e segment exit.content
    const withExit = assemblePrompt('Expert', 'Rédige', 'Conclus par TERMINER');
    assert.equal(withExit, 'Expert\n\nRédige\n\nConclus par TERMINER');

    const emptyExit = assemblePrompt('Expert', 'Rédige', '');
    assert.equal(emptyExit, 'Expert\n\nRédige');

    // L'adapter ne doit recevoir que le résultat assemblé (contrat R-45)
    const rawUserOnly = userPrompt;
    assert.notEqual(assembled, rawUserOnly);
  });
});
