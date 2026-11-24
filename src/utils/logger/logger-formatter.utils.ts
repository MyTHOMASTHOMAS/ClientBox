/**
 * Module de journalisation structurée isomorphique pour ClientsBox.
 * @module utils/logger/format
 * @description Formatage des parties textuelles d'une ligne de log.
 */

import { ANSI_DIM, ANSI_RESET } from './logger.config.js';

/**
 * Formate l'heure courante au format français avec millisecondes.
 *
 * @param date - Date à formater (défaut : maintenant).
 */
export function formatLogTime(date = new Date()) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

/**
 * Concatène les tags sous forme `[tag1] [tag2]`.
 *
 * @param tags - Liste de tags à afficher.
 * @param isColored - Applique le style ANSI atténué si vrai.
 */
export function formatLogTags(tags: readonly string[], isColored: boolean) {
  if (tags.length === 0) {
    return '';
  }
  if (isColored) {
    return tags.map((tag) => `${ANSI_DIM}[${tag}]${ANSI_RESET}`).join(' ');
  }
  return tags.map((tag) => `[${tag}]`).join(' ');
}
