/**
 * Classe d'erreur levée en cas d'argument CLI invalide ou manquant.
 */

/**
 * Erreur levée en cas d'argument CLI invalide ou manquant.
 */
export class ServerCliParseError extends Error {
  override readonly name = 'ServerCliParseError';

  constructor(message: string) {
    super(message);
  }
}
