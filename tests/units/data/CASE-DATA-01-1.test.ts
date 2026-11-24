import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { Agent } from '../../../src/types/models/agent.model.js';
import { parseAgent } from '../../../src/domain/schemas/agent.schema.js';
import { ResourceValidationError } from '../../../src/domain/schemas/validation.error.js';

describe('CASE-DATA-01-1 — validation du schéma Agent (profilId, cliId) (SPEC-DATA-01)', () => {
  it('test_CASE_DATA_01_1_agent_schema_validation_profilId_cliId', () => {
    const valid: Agent = {
      id: 'agent-dev',
      name: 'Développeur',
      profilId: 'profil-standard',
      cliId: 'cursor-cli',
    };
    assert.deepEqual(parseAgent(valid), valid);

    assert.throws(
      () => parseAgent({ id: 'a', name: 'n', cliId: 'cursor-cli' }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /profilId/i);
        return true;
      },
    );

    assert.throws(
      () => parseAgent({ id: 'a', name: 'n', profilId: '', cliId: 'cursor-cli' }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /profilId/i);
        return true;
      },
    );

    assert.throws(
      () => parseAgent({ id: 'a', name: 'n', profilId: 'p' }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /cliId/i);
        return true;
      },
    );

    assert.throws(
      () => parseAgent({ id: 'a', name: 'n', profilId: 'p', cliId: '' }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /cliId/i);
        return true;
      },
    );
  });

  it('test_CASE_DATA_01_1_agent_schema_model_optional_handling', () => {
    const base = {
      id: 'agent-model',
      name: 'Agent avec Modèle',
      profilId: 'profil-dev',
      cliId: 'cursor-cli',
    };

    // 1. Modèle chaîne valide
    const withModel = parseAgent({ ...base, model: 'gpt-5.3-codex' });
    assert.equal(withModel.model, 'gpt-5.3-codex');

    // 2. Modèle avec espaces superflus (doit être trimmé)
    const withSpaces = parseAgent({ ...base, model: '  claude-3-5-sonnet  ' });
    assert.equal(withSpaces.model, 'claude-3-5-sonnet');

    // 3. Modèle composé uniquement d'espaces ou vide (doit être ignoré / indéfini)
    const withWhitespace = parseAgent({ ...base, model: '    ' });
    assert.equal(withWhitespace.model, undefined);

    const withEmpty = parseAgent({ ...base, model: '' });
    assert.equal(withEmpty.model, undefined);

    // 4. Modèle avec type non-chaîne (rejet)
    assert.throws(
      () => parseAgent({ ...base, model: 12345 }),
      (err: unknown) => {
        assert.ok(err instanceof ResourceValidationError);
        assert.match(String(err), /model/i);
        return true;
      },
    );
  });
});
