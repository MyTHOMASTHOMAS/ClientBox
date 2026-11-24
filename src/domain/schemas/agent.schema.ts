/**
 * Validation structurelle Agent — `profilId` / `cliId` obligatoires non vides
 * (SPEC-DATA-01 / AC-DATA-01-1 / R-05 / R-03 / REQ-009).
 * AC-DATA-01-4 : rejet des `id` de traversée via UTILS-003.
 * Couche `domain/schemas/` pure (SPEC-ARCH-02) — seam Partie 63 POINT-007.
 */

import { isValidResourceId } from '../../utils/primitives/id.utils.js';
import { ResourceValidationError } from './validation.error.js';

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.length > 0;
}

function resolveAgentModel(raw: unknown) {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') {
    throw new ResourceValidationError(
      'Agent invalide : le champ model doit être une chaîne de caractères.',
    );
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Parse et valide un objet Agent selon les contraintes de schéma métier.
 *
 * @param input Données brutes de l'agent à valider
 * @returns Objet Agent validé
 */
export function parseAgent(input: unknown) {
  if (input === null || typeof input !== 'object') {
    throw new ResourceValidationError(
      'Agent invalide : un objet JSON avec profilId et cliId est attendu.',
    );
  }

  const record = input as Record<string, unknown>;

  if (!isNonEmptyString(record.profilId)) {
    throw new ResourceValidationError('Champ obligatoire profilId manquant ou vide (R-05).');
  }

  if (!isNonEmptyString(record.cliId)) {
    throw new ResourceValidationError('Champ obligatoire cliId manquant ou vide (R-03 / REQ-009).');
  }

  if (!isNonEmptyString(record.id) || !isNonEmptyString(record.name)) {
    throw new ResourceValidationError(
      'Agent invalide : id et name sont obligatoires et non vides.',
    );
  }

  if (!isValidResourceId(record.id as string)) {
    throw new ResourceValidationError(
      `Identifiant id interdit (caractères /, \\ ou .. non autorisés) : « ${record.id as string} ».`,
    );
  }

  const model = resolveAgentModel(record.model);

  return {
    id: record.id as string,
    name: record.name as string,
    profilId: record.profilId as string,
    cliId: record.cliId as string,
    ...(model ? { model } : {}),
  };
}
