/**
 * Module de journalisation structurée isomorphique pour ClientsBox.
 * @module utils/logger/should-log
 * @description Garde booléenne exécutée avant chaque écriture console.
 */

import { isLogsDisabled, resolveIsDev } from './logger-runtime.utils.js';
import type {
  LogEnableContext,
  LogEnableFn,
  LogEnables,
  LogLevel,
  LogOptions,
} from './logger.types.js';

/**
 * Normalise `LogEnables` en tableau de fonctions de garde.
 *
 * @param enables - Une fonction ou une liste de fonctions.
 */
export function toEnableList(enables: LogEnables) {
  const list: LogEnableFn[] = Array.isArray(enables) ? enables : [enables];
  return list;
}

/**
 * Exécute toutes les gardes : chacune doit retourner `true`.
 *
 * @param enables - Gardes fusionnées (logger + appel).
 * @param isDev - Résultat de `resolveIsDev`.
 * @param context - Tags effectifs et `isDevOnly` de l'appel.
 */
function runEnables(enables: LogEnables, isDev: boolean, context: LogEnableContext) {
  return toEnableList(enables).every((fn) => fn(isDev, context));
}

/**
 * Indique si une entrée de log peut être écrite.
 *
 * Ordre de décision :
 * 0. Si `isLogsDisabled()` est vrai → `false` (kill-switch d'environnement).
 * 1. `debug` hors dev local → `false` (non contournable par `enables`).
 * 2. `options.enables` défini → toutes les fonctions doivent retourner `true`.
 * 3. `isDevOnly` et hors dev → `false`.
 * 4. Sinon → `true`.
 *
 * @param level - Niveau demandé.
 * @param baseTags - Tags fixes du logger.
 * @param options - Options fusionnées de l'appel.
 */
export function shouldLog(level: LogLevel, baseTags: readonly string[], options?: LogOptions) {
  if (isLogsDisabled()) {
    return false;
  }

  const isDevOnly = options?.isDevOnly ?? Boolean(options?.onDevOnly);
  const tags = [...baseTags, ...(options?.tags ?? [])];
  const isDev = resolveIsDev();
  const context: LogEnableContext = { tags, isDevOnly };

  if (level === 'debug' && !isDev) {
    return false;
  }

  if (options?.enables) {
    return runEnables(options.enables, isDev, context);
  }

  if (isDevOnly && !isDev) {
    return false;
  }

  return true;
}
