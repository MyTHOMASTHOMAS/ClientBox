/**
 * Validation structurelle Exit — `content` obligatoire
 * (SPEC-DATA-01 / AC-DATA-01-3 / R-07 / CR-012).
 * Couche `domain/schemas/` pure (SPEC-ARCH-02).
 */

import { ResourceValidationError } from './validation.error.js';

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Parse et valide un prompt d'ordre de sortie.
 *
 * @param input Données brutes de la ressource exit
 * @returns Objet ExitCondition validé
 */
export function parseExitCondition(input: unknown) {
  if (input === null || typeof input !== 'object') {
    throw new ResourceValidationError(
      'Exit Condition invalide : un objet JSON avec id, name et content est attendu.',
    );
  }

  const record = input as Record<string, unknown>;

  if (!isNonEmptyString(record.id) || !isNonEmptyString(record.name)) {
    throw new ResourceValidationError(
      'Exit Condition invalide : id et name sont obligatoires et non vides.',
    );
  }

  if (typeof record.content !== 'string') {
    throw new ResourceValidationError('Champ obligatoire content manquant ou invalide.');
  }

  return {
    id: record.id,
    name: record.name,
    content: record.content,
  };
}
