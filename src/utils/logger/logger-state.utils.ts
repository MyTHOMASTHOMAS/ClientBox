/**
 * Module de journalisation structurée isomorphique pour ClientsBox.
 * @module utils/logger/logger-state
 * @description État interne d'une instance Logger et fusion des options.
 * @internal Usage réservé au module logger.
 */

import { toEnableList } from './logger-filter.utils.js';
import type { LogEnableFn, LogEnables, LogOptions, LogWithOptions } from './logger.types.js';

/**
 * État mutable porté par chaque instance de logger.
 */
export type LoggerState = {
  /** Préfixe affiché sur chaque ligne ([SERVICE]). */
  serviceName: string;
  /** Tags fixes cumulés via createLogger et with. */
  tags: readonly string[];
  /** Restriction dev héritée ; remplacée par with({ isDevOnly }). */
  isDevOnly?: boolean;
  /** Gardes cumulées via with({ enables }) et options d'appel. */
  enables: LogEnableFn[];
};

/**
 * Type guard : argument objet de LogWithOptions (vs tags string de with('a')).
 *
 * @param value - Premier argument passé à with.
 */
export function isLogWithOptions(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Ajoute des fonctions enables à la liste existante (sans remplacer).
 *
 * @param existing - Gardes déjà présentes sur le logger dérivé.
 * @param addition - Nouvelle garde ou liste à concaténer.
 */
export function appendEnables(existing: LogEnableFn[], addition?: LogEnables) {
  if (!addition) {
    return existing;
  }
  return [...existing, ...toEnableList(addition)];
}

/**
 * Extrait la valeur booléenne dev-only depuis les options.
 */
function resolveDevOnlyOption(options?: LogOptions | LogWithOptions) {
  if (!options) {
    return undefined;
  }
  if (options.isDevOnly !== undefined) {
    return options.isDevOnly;
  }
  if (options.onDevOnly !== undefined) {
    return Boolean(options.onDevOnly);
  }
  return undefined;
}

/**
 * Fusionne l'état hérité du logger et les options d'un appel (info, timed, etc.).
 *
 * @param state - État du logger courant.
 * @param options - Options de l'appel (facultatif).
 */
export function mergeCallOptions(state: LoggerState, options?: LogOptions) {
  const mergedEnables = appendEnables(state.enables, options?.enables);
  const isDevOnly = resolveDevOnlyOption(options) ?? state.isDevOnly;

  if (options === undefined && isDevOnly === undefined && mergedEnables.length === 0) {
    return undefined;
  }

  const merged: LogOptions = {
    ...options,
    isDevOnly,
    enables: mergedEnables.length > 0 ? mergedEnables : undefined,
  };
  return merged;
}

/**
 * Construit l'état d'un logger dérivé via with({ ... }).
 *
 * @param parent - Logger parent.
 * @param options - Options de dérivation.
 */
export function deriveLoggerState(parent: LoggerState, options: LogWithOptions) {
  const isDevOnly = resolveDevOnlyOption(options) ?? parent.isDevOnly;

  const nextState: LoggerState = {
    serviceName: parent.serviceName,
    tags: [...parent.tags, ...(options.tags ?? []).filter(Boolean)],
    isDevOnly,
    enables: appendEnables(parent.enables, options.enables),
  };
  return nextState;
}
