/**
 * Module de journalisation structurée isomorphique pour ClientsBox.
 * @module utils/logger/config
 * @description Configuration globale du logger (niveaux, styles ANSI).
 */

import type { LogLevel } from './logger.types.js';

/**
 * Libellé, icône, couleur ANSI et méthode `console` par niveau.
 */
export const LEVEL_CONFIG: Record<
  LogLevel,
  {
    label: string;
    icon: string;
    ansi: string;
    consoleFn: 'debug' | 'info' | 'warn' | 'error';
  }
> = {
  debug: { label: 'DEBUG', icon: '🐛', ansi: '\x1b[90m', consoleFn: 'debug' },
  info: { label: 'INFO ', icon: 'ℹ️ ', ansi: '\x1b[36m', consoleFn: 'info' },
  success: { label: 'OK   ', icon: '✅', ansi: '\x1b[32m', consoleFn: 'info' },
  warn: { label: 'WARN ', icon: '⚠️ ', ansi: '\x1b[33m', consoleFn: 'warn' },
  error: { label: 'ERROR', icon: '🚨', ansi: '\x1b[31m', consoleFn: 'error' },
};

/** Réinitialisation des styles ANSI. */
export const ANSI_RESET = '\x1b[0m';

/** Style ANSI atténué (horodatage, tags). */
export const ANSI_DIM = '\x1b[2m';

/** Style ANSI gras (service, niveau). */
export const ANSI_BOLD = '\x1b[1m';
