import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { Prompt } from '../../../src/types/models/prompt.model.js';
import { parsePrompt } from '../../../src/domain/schemas/prompt.schema.js';
import { parseExitCondition } from '../../../src/domain/schemas/exit-condition.schema.js';
import { ResourceValidationError } from '../../../src/domain/schemas/validation.error.js';

describe('CASE-DATA-01-3 — validation des schémas Prompt et Condition Exit (SPEC-DATA-01)', () => {
  it('test_CASE_DATA_01_3_prompt_and_exit_schema_validation', () => {
    const prompt: Prompt = {
      id: 'p-init',
      name: 'Init',
      content: 'Analyse le code suivant',
    };
    assert.deepEqual(parsePrompt(prompt), prompt);

    assert.throws(
      () => parsePrompt({ id: 'p-bad', name: 'Bad' }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /content/i);
        return true;
      },
    );

    const exit = {
      id: 'e-done',
      name: 'Ordre de boucle',
      content: 'Si complet renvoie TERMINER, sinon CONTINUE',
    };
    assert.deepEqual(parseExitCondition(exit), exit);

    assert.throws(
      () => parseExitCondition({ id: 'e-empty', name: 'Empty' }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /content/i);
        return true;
      },
    );

    assert.throws(
      () => parseExitCondition({ id: '', name: 'Bad', content: 'x' }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        return true;
      },
    );
  });
});
