/**
 * Module de journalisation structurée isomorphique pour ClientsBox.
 * @module utils/logger/create-logger
 * @description Fabrique d'instances Logger.
 */

import {
  deriveLoggerState,
  isLogWithOptions,
  mergeCallOptions,
  type LoggerState,
} from './logger-state.utils.js';
import type { Logger, LogLevel, LogOptions, LogWithOptions } from './logger.types.js';
import { writeLog } from './logger-writer.utils.js';

/**
 * Construit la fonction de dérivation hiérarchique with().
 *
 * @param state - État courant du logger.
 * @param builder - Fabrique récursive de construction du logger.
 */
function createWithDerivation(state: LoggerState, builder: (s: LoggerState) => Logger) {
  const withTags = (...extraTags: string[]) =>
    builder({
      ...state,
      tags: [...state.tags, ...extraTags.filter(Boolean)],
    });

  const withOptions = (options: LogWithOptions) => builder(deriveLoggerState(state, options));

  return ((first?: string | LogWithOptions, ...rest: string[]) => {
    if (isLogWithOptions(first)) {
      return withOptions(first as LogWithOptions);
    }
    const tagList = [first, ...rest].filter(
      (t): t is string => typeof t === 'string' && Boolean(t),
    );
    return withTags(...tagList);
  }) as Logger['with'];
}

/**
 * Construit l'exécuteur de groupe repliable group().
 *
 * @param state - État courant du logger.
 */
function createGroupRunner(state: LoggerState) {
  return (title: string, fn: () => void, options?: LogOptions) => {
    writeLog({
      level: 'info',
      serviceName: state.serviceName,
      message: title,
      baseTags: state.tags,
      options: mergeCallOptions(state, options),
    });

    console.group();
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  };
}

/**
 * Construit l'exécuteur asynchrone mesuré timed().
 *
 * @param state - État courant du logger.
 */
function createTimedRunner(state: LoggerState) {
  return async <T>(
    label: string,
    fn: () => Promise<T>,
    options?: LogOptions & { level?: Exclude<LogLevel, 'success'> },
  ) => {
    const start = performance.now();
    try {
      const result = await fn();
      const ms = Math.round(performance.now() - start);
      writeLog({
        level: options?.level ?? 'success',
        serviceName: state.serviceName,
        message: label,
        baseTags: state.tags,
        options: { ...mergeCallOptions(state, options), ms },
      });
      return result;
    } catch (error: unknown) {
      const ms = Math.round(performance.now() - start);
      writeLog({
        level: 'error',
        serviceName: state.serviceName,
        message: label,
        baseTags: state.tags,
        options: {
          ...mergeCallOptions(state, options),
          ms,
          data: options?.data ?? error,
        },
      });
      throw error;
    }
  };
}

/**
 * Construit une instance Logger à partir de son état interne.
 *
 * @param state - Tags, gardes et serviceName du logger.
 * @internal
 */
function buildLogger(state: LoggerState) {
  const logAt = (level: LogLevel) => (message: string, options?: LogOptions) => {
    writeLog({
      level,
      serviceName: state.serviceName,
      message,
      baseTags: state.tags,
      options: mergeCallOptions(state, options),
    });
  };

  return {
    serviceName: state.serviceName,
    tags: state.tags,
    isDevOnly: state.isDevOnly,
    enables: state.enables,
    debug: logAt('debug'),
    info: logAt('info'),
    warn: logAt('warn'),
    error: logAt('error'),
    success: logAt('success'),
    with: createWithDerivation(state, buildLogger),
    group: createGroupRunner(state),
    timed: createTimedRunner(state),
  };
}

/**
 * Crée un logger dédié à un service ou module applicatif.
 *
 * @param serviceName - Identifiant du service (préfixe des lignes, ex. `auth`, `api`).
 * @param baseTags - Tags fixes appliqués à chaque entrée (chaînes vides ignorées).
 */
export function createLogger(serviceName: string, ...baseTags: string[]) {
  return buildLogger({
    serviceName,
    tags: baseTags.filter(Boolean),
    enables: [],
  });
}
