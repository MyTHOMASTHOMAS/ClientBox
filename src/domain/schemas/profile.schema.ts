/**
 * Validation structurelle Profil — enum `policy` + défaut `chaque_prompt`
 * (SPEC-DATA-01 / AC-DATA-01-2 / R-06).
 * Couche `domain/schemas/` pure (SPEC-ARCH-02) — seam Partie 63 POINT-007.
 * Hors DOM-003 (`injection-policy.evaluator.js` = runtime ENG).
 */

import type { ProfilePolicy } from '../../types/models/profile.model.js';
import { ResourceValidationError } from './validation.error.js';

/** Défaut métier SPEC-DATA-01 / R-06 — pas une valeur arbitraire hors spec. */
const DEFAULT_PROFILE_POLICY: ProfilePolicy = 'chaque_prompt';

const PROFILE_POLICIES: readonly ProfilePolicy[] = [
  'chaque_prompt',
  'debut_scenario',
  'une_fois_jusqu_a_clear',
] as const;

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.length > 0;
}

function isProfilePolicy(value: unknown) {
  return typeof value === 'string' && (PROFILE_POLICIES as readonly string[]).includes(value);
}

function resolveProfileModel(raw: unknown) {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') {
    throw new ResourceValidationError(
      'Profil invalide : le champ model doit être une chaîne de caractères.',
    );
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Parse et valide un profil d'agent en appliquant la politique par défaut si absente.
 *
 * @param input Données brutes du profil
 * @returns Objet Profile validé
 */
export function parseProfile(input: unknown) {
  if (input === null || typeof input !== 'object') {
    throw new ResourceValidationError(
      'Profil invalide : un objet JSON avec id, name et systemPrompt est attendu.',
    );
  }

  const record = input as Record<string, unknown>;

  if (!isNonEmptyString(record.id) || !isNonEmptyString(record.name)) {
    throw new ResourceValidationError(
      'Profil invalide : id et name sont obligatoires et non vides.',
    );
  }

  if (typeof record.systemPrompt !== 'string') {
    throw new ResourceValidationError('Profil invalide : systemPrompt est obligatoire (chaîne).');
  }

  let policy: ProfilePolicy;
  if (record.policy === undefined) {
    policy = DEFAULT_PROFILE_POLICY;
  } else if (isProfilePolicy(record.policy)) {
    policy = record.policy as ProfilePolicy;
  } else {
    throw new ResourceValidationError(
      `Valeur de policy invalide : « ${String(record.policy)} » (autorisées : chaque_prompt, debut_scenario, une_fois_jusqu_a_clear).`,
    );
  }

  const model = resolveProfileModel(record.model);

  return {
    id: record.id,
    name: record.name,
    systemPrompt: record.systemPrompt,
    policy,
    ...(model ? { model } : {}),
  };
}
