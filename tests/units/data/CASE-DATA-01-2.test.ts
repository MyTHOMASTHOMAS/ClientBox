import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { parseProfile } from '../../../src/domain/schemas/profile.schema.js';
import { ResourceValidationError } from '../../../src/domain/schemas/validation.error.js';

describe('CASE-DATA-01-2 — validation du schéma Profil (enum policy et défaut) (SPEC-DATA-01)', () => {
  it('test_CASE_DATA_01_2_profile_schema_policy_enum_and_default', () => {
    const base = {
      id: 'profil-standard',
      name: 'Standard',
      systemPrompt: 'Tu es un assistant TS',
    };

    const withPolicy = parseProfile({ ...base, policy: 'chaque_prompt' });
    assert.equal(withPolicy.policy, 'chaque_prompt');

    const defaulted = parseProfile(base);
    assert.equal(defaulted.policy, 'chaque_prompt');

    for (const policy of ['debut_scenario', 'une_fois_jusqu_a_clear'] as const) {
      const parsed = parseProfile({ ...base, policy });
      assert.equal(parsed.policy, policy);
    }

    assert.throws(
      () => parseProfile({ ...base, policy: 'toujours' }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /policy|toujours/i);
        return true;
      },
    );
  });

  it('test_CASE_DATA_01_2_profile_schema_model_optional_handling', () => {
    const base = {
      id: 'profil-model',
      name: 'Modèle Test',
      systemPrompt: 'Instructions',
    };

    // 1. Modèle chaîne valide
    const withModel = parseProfile({ ...base, model: 'gpt-5.3-codex' }) as { model?: string };
    assert.equal(withModel.model, 'gpt-5.3-codex');

    // 2. Modèle avec espaces superflus (doit être trimmé)
    const withSpaces = parseProfile({ ...base, model: '  claude-sonnet-5  ' }) as { model?: string };
    assert.equal(withSpaces.model, 'claude-sonnet-5');

    // 3. Modèle composé uniquement d'espaces ou vide (doit être ignoré / indéfini)
    const withWhitespace = parseProfile({ ...base, model: '    ' }) as { model?: string };
    assert.equal(withWhitespace.model, undefined);

    const withEmpty = parseProfile({ ...base, model: '' }) as { model?: string };
    assert.equal(withEmpty.model, undefined);

    // 4. Modèle avec type non-chaîne (rejet)
    assert.throws(
      () => parseProfile({ ...base, model: 12345 }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /model/i);
        return true;
      },
    );

    assert.throws(
      () => parseProfile({ ...base, model: true }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /model/i);
        return true;
      },
    );
  });
});
