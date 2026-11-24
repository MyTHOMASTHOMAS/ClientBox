/**
 * Module de journalisation structurée isomorphique pour ClientsBox.
 * @module utils/logger/write-log
 * @description Écriture d'une entrée de log vers la console hôte.
 * @internal Appelé par createLogger ; ne pas importer directement.
 */

import { ANSI_BOLD, ANSI_DIM, ANSI_RESET, LEVEL_CONFIG } from './logger.config.js';
import { formatLogTags, formatLogTime } from './logger-formatter.utils.js';
import { isNode } from './logger-runtime.utils.js';
import { shouldLog } from './logger-filter.utils.js';
import type { LogLevel, LogOptions } from './logger.types.js';

/**
 * Paramètres nécessaires à la composition de l'en-tête de log.
 */
interface LogHeaderPayload {
  readonly serviceName: string;
  readonly level: LogLevel;
  readonly tags: readonly string[];
  readonly message: string;
  readonly ms?: number;
}

/**
 * Construit l'en-tête textuel formaté d'une ligne de log.
 *
 * @param payload - Données nécessaires au formatage de l'en-tête.
 */
function buildLogHeader(payload: LogHeaderPayload) {
  const { label, icon, ansi } = LEVEL_CONFIG[payload.level];
  const isColored = isNode;

  const prefixPart = isColored
    ? `${ansi}${ANSI_BOLD}[${payload.serviceName.toUpperCase()}]${ANSI_RESET}`
    : `[${payload.serviceName.toUpperCase()}]`;
  const timePart = isColored ? `${ANSI_DIM}${formatLogTime()}${ANSI_RESET}` : formatLogTime();
  const levelPart = isColored
    ? `${ansi}${ANSI_BOLD}${icon} ${label}${ANSI_RESET}`
    : `${icon} ${label}`;
  const tagPart = formatLogTags(payload.tags, isColored);
  const msPart =
    payload.ms != null
      ? isColored
        ? `${ansi}(${payload.ms}ms)${ANSI_RESET}`
        : `(${payload.ms}ms)`
      : '';

  return [prefixPart, timePart, levelPart, tagPart, payload.message, msPart]
    .filter(Boolean)
    .join(' ');
}

/**
 * Écrit un objet de données sérialisé sous Node.js avec indentation.
 *
 * @param consoleFn - Méthode console cible.
 * @param data - Données à sérialiser.
 */
function writeNodeData(consoleFn: 'debug' | 'info' | 'warn' | 'error', data: unknown) {
  try {
    const dataLines = JSON.stringify(data, null, 2).split('\n');
    console[consoleFn](`${ANSI_DIM}  └─${ANSI_RESET} ${dataLines[0]}`);
    for (let i = 1; i < dataLines.length; i++) {
      console[consoleFn](`     ${dataLines[i]}`);
    }
  } catch {
    console[consoleFn](
      `${ANSI_DIM}  └─${ANSI_RESET} [Référence circulaire ou données non sérialisables]`,
    );
  }
}

/**
 * Émet les données associées à un log vers la console hôte.
 *
 * @param consoleFn - Méthode console cible.
 * @param data - Données à afficher.
 */
function writeLogData(consoleFn: 'debug' | 'info' | 'warn' | 'error', data: unknown) {
  if (data instanceof Error) {
    console[consoleFn](data);
    return;
  }
  if (isNode) {
    writeNodeData(consoleFn, data);
    return;
  }
  console[consoleFn](data);
}

/**
 * Données d'une écriture de log.
 */
export interface WriteLogPayload {
  readonly level: LogLevel;
  readonly serviceName: string;
  readonly message: string;
  readonly baseTags?: readonly string[];
  readonly options?: LogOptions;
}

/**
 * Affiche une ligne de log structurée et, le cas échéant, les données associées.
 *
 * @param payload - Enveloppe complète des données de log.
 */
export function writeLog(payload: WriteLogPayload) {
  const { level, serviceName, baseTags = [], message, options } = payload;
  if (!shouldLog(level, baseTags, options)) {
    return;
  }

  const { consoleFn } = LEVEL_CONFIG[level];
  const tags = [...baseTags, ...(options?.tags ?? [])];
  const head = buildLogHeader({
    serviceName,
    level,
    tags,
    message,
    ms: options?.ms,
  });

  console[consoleFn](head);

  if (options?.data !== undefined) {
    writeLogData(consoleFn, options.data);
  }
}
