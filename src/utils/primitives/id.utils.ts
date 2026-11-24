/**
 * Validation des identifiants de ressources (UTILS-003).
 * Caractères interdits FS / path-traversal : `/`, `\`, `..`.
 */

/**
 * Vérifie si un identifiant de ressource est valide (non vide et sans path traversal).
 *
 * @param id Identifiant de ressource à vérifier
 * @returns Booléen indiquant si l'identifiant est valide
 */
export function isValidResourceId(id: string) {
  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  if (id.includes('/') || id.includes('\\') || id.includes('..')) {
    return false;
  }
  return true;
}
