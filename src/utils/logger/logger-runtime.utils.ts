/**
 * Module de journalisation structurée isomorphique pour ClientsBox.
 * @module utils/logger/runtime
 * @description Environnement d'exécution local, flags dev/prod, détection Node.js et kill-switch LOGS_DISABLED.
 */

/**
 * Récupère l'objet d'environnement système sans accès statique direct.
 */
function getRuntimeEnv() {
  const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
    .process;
  return proc ? proc['env'] : undefined;
}

/**
 * Indique si le code s'exécute sous Node.js (codes ANSI activés côté terminal).
 */
export const isNode =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

/**
 * Vrai lorsque NODE_ENV n'est pas production (runtime serveur Node.js).
 */
export const isDevBack = getRuntimeEnv()?.['NODE_ENV'] !== 'production';

/**
 * Vrai lorsque le runtime client n'est pas en production.
 */
export const isDevFront =
  typeof window !== 'undefined' &&
  (Boolean((window as unknown as Record<string, unknown>)['__DEV__']) ||
    (typeof location !== 'undefined' &&
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1')));

/** Environnement local dans lequel le logger s'exécute. */
export type LogEnvironment = 'front' | 'back';

/**
 * Détermine l'environnement local au moment de l'appel.
 */
export function resolveLogEnvironment() {
  return isNode ? ('back' as const) : ('front' as const);
}

/**
 * Indique si l'environnement local courant est en mode dev.
 */
export function resolveIsDev() {
  if (resolveLogEnvironment() === 'front') {
    return isDevFront;
  }
  return getRuntimeEnv()?.['NODE_ENV'] !== 'production';
}

/**
 * Évalue si la journalisation globale est désactivée via variable d'environnement ou flag client.
 *
 * Supporte :
 * - LOGS_DISABLED positionné à true
 * - LOGS_ENABLED positionné à false
 * - window.__LOGS_DISABLED__ positionné à true
 * - clé localStorage LOGS_DISABLED positionnée à true
 */
export function isLogsDisabled() {
  const env = getRuntimeEnv();
  if (env) {
    if (env['LOGS_DISABLED'] === 'true' || env['LOGS_ENABLED'] === 'false') {
      return true;
    }
  }

  if (typeof window !== 'undefined') {
    const win = window as unknown as Record<string, unknown>;
    if (win['__LOGS_DISABLED__'] === true) {
      return true;
    }
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('LOGS_DISABLED') === 'true') {
        return true;
      }
    } catch {
      // Ignorer les restrictions de stockage local en sandbox
    }
  }

  return false;
}
