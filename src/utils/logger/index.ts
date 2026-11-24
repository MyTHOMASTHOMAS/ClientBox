/**
 * Module de journalisation structurée isomorphique pour ClientsBox.
 * @module utils/logger
 * @description Logger structuré pour le serveur (Node.js) et le client (navigateur).
 *
 * Point d'entrée applicatif :
 *
 * ```ts
 * import { createLogger } from './utils/logger/index.js';
 * import type { Logger, LogOptions, LogWithOptions } from './utils/logger/index.js';
 * ```
 *
 * Garde avant écriture : shouldLog (niveau debug, onDevOnly, enables, LOGS_DISABLED).
 * Dérivation : Logger.with (tags, options héritées).
 */

export { createLogger } from './logger.factory.js';
export {
  isDevBack,
  isDevFront,
  isLogsDisabled,
  isNode,
  resolveIsDev,
  resolveLogEnvironment,
} from './logger-runtime.utils.js';
export type { LogEnvironment } from './logger-runtime.utils.js';
export { shouldLog, toEnableList } from './logger-filter.utils.js';
export type {
  LogEnableContext,
  LogEnableFn,
  LogEnables,
  Logger,
  LogLevel,
  LogOptions,
  LogWithOptions,
} from './logger.types.js';
