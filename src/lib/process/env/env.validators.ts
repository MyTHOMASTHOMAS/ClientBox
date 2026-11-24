/**
 * Primitives déclaratives de validation et typage des variables d'environnement.
 */

import type {
  BooleanEnvFieldDescriptor,
  EnumEnvFieldDescriptor,
  EnvEngineContext,
  EnvFieldDescriptor,
  NumberEnvFieldDescriptor,
  StringEnvFieldDescriptor,
} from './env.types.js';
import { validateExecutableField } from './env.executable.js';

export { requireExecutablePath, optionalExecutablePath } from './env.executable.js';

function validateStringField(key: string, raw: string | undefined, d: StringEnvFieldDescriptor) {
  if (raw === undefined || raw.trim() === '') {
    if (d.isRequired) {
      const hint = d.helpRef ? ` Consultez ${d.helpRef}.` : '';
      throw new Error(`Variable d'environnement obligatoire manquante : ${key}.${hint}`);
    }
    return d.default ?? '';
  }
  const val = raw.trim();
  if (d.minLength !== undefined && val.length < d.minLength) {
    const hint = d.helpRef ? ` Consultez ${d.helpRef}.` : '';
    throw new Error(`Variable d'environnement obligatoire manquante : ${key}.${hint}`);
  }
  return val;
}

function validateNumberField(key: string, raw: string | undefined, d: NumberEnvFieldDescriptor) {
  if (raw === undefined || raw.trim() === '') {
    if (d.isRequired) {
      throw new Error(`Variable d'environnement obligatoire manquante : ${key}.`);
    }
    return d.default;
  }
  const n = Number(raw.trim());
  if (Number.isNaN(n)) {
    throw new Error(`La variable ${key} doit être un nombre valide.`);
  }
  if (d.min !== undefined && n < d.min) {
    throw new Error(`La variable ${key} doit être supérieure ou égale à ${d.min}.`);
  }
  if (d.max !== undefined && n > d.max) {
    throw new Error(`La variable ${key} doit être inférieure ou égale à ${d.max}.`);
  }
  return n;
}

function validateBooleanField(raw: string | undefined, d: BooleanEnvFieldDescriptor) {
  if (raw === undefined || raw.trim() === '') {
    return d.default ?? false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

function validateEnumField(
  key: string,
  raw: string | undefined,
  d: EnumEnvFieldDescriptor<string>,
) {
  if (raw === undefined || raw.trim() === '') {
    return d.default;
  }
  const trimmed = raw.trim();
  if (!d.allowed.includes(trimmed)) {
    throw new Error(`La variable ${key} doit être l'un de : ${d.allowed.join(', ')}.`);
  }
  return trimmed;
}

/**
 * Valide et convertit une valeur brute selon un descripteur déclaratif.
 *
 * @param descriptor - Descripteur déclaratif de la variable
 * @param options - Clé, valeur brute et contexte d'exécution
 * @returns Valeur typée validée
 */
export function validateFieldDescriptor(
  descriptor: EnvFieldDescriptor,
  options: { key: string; raw?: string; ctx: EnvEngineContext },
) {
  const { key, raw, ctx } = options;
  switch (descriptor.type) {
    case 'string':
      return validateStringField(key, raw, descriptor);
    case 'number':
      return validateNumberField(key, raw, descriptor);
    case 'boolean':
      return validateBooleanField(raw, descriptor);
    case 'enum':
      return validateEnumField(key, raw, descriptor);
    case 'executable':
      return validateExecutableField(key, raw, { d: descriptor, workspacePath: ctx.workspacePath });
  }
}

/**
 * Valide une chaîne obligatoire non vide.
 *
 * @param options - Options de longueur minimale et lien d'aide
 * @returns Validateur de chaîne
 */
export function requireString(options?: { minLength?: number; helpRef?: string }) {
  const minLength = options?.minLength ?? 1;
  return (key: string, raw: string | undefined) => {
    if (raw === undefined || raw.trim().length < minLength) {
      const hint = options?.helpRef ? ` Consultez ${options.helpRef}.` : '';
      throw new Error(`Variable d'environnement obligatoire manquante : ${key}.${hint}`);
    }
    return raw.trim();
  };
}

/**
 * Valide une chaîne optionnelle avec valeur par défaut.
 *
 * @param fallback - Valeur de repli
 * @returns Validateur de chaîne optionnelle
 */
export function optionalString(fallback = '') {
  return (_key: string, raw: string | undefined) => {
    if (raw === undefined || raw.trim() === '') return fallback;
    return raw.trim();
  };
}

/**
 * Valide un nombre optionnel avec plage de valeurs et valeur par défaut.
 *
 * @param fallback - Valeur par défaut
 * @param options - Bornes min et max
 * @returns Validateur de nombre
 */
export function optionalNumber(fallback: number, options?: { min?: number; max?: number }) {
  return (key: string, raw: string | undefined) => {
    if (raw === undefined || raw.trim() === '') return fallback;
    const n = Number(raw.trim());
    if (Number.isNaN(n)) throw new Error(`La variable ${key} doit être un nombre valide.`);
    if (options?.min !== undefined && n < options.min) {
      throw new Error(`La variable ${key} doit être supérieure ou égale à ${options.min}.`);
    }
    if (options?.max !== undefined && n > options.max) {
      throw new Error(`La variable ${key} doit être inférieure ou égale à ${options.max}.`);
    }
    return n;
  };
}

/**
 * Valide une énumération optionnelle avec valeur par défaut.
 *
 * @param allowed - Liste des valeurs admises
 * @param fallback - Valeur par défaut
 * @returns Validateur d'énumération
 */
export function optionalEnum<T extends string>(allowed: readonly T[], fallback: T) {
  return (key: string, raw: string | undefined) => {
    if (raw === undefined || raw.trim() === '') return fallback;
    const trimmed = raw.trim() as T;
    if (!allowed.includes(trimmed)) {
      throw new Error(`La variable ${key} doit être l'un de : ${allowed.join(', ')}.`);
    }
    return trimmed;
  };
}

/**
 * Valide un booléen optionnel avec valeur par défaut.
 *
 * @param fallback - Valeur par défaut
 * @returns Validateur de booléen
 */
export function optionalBoolean(fallback = false) {
  return (_key: string, raw: string | undefined) => {
    if (raw === undefined || raw.trim() === '') return fallback;
    const normalized = raw.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  };
}
