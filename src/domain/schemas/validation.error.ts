/**
 * Erreur de validation structurelle des ressources déclaratives (seam Partie 63 POINT-007).
 * Pure — aucun I/O.
 */

/**
 * Erreur de validation levée lorsqu'une ressource déclarative ne respecte pas son schéma.
 */
export class ResourceValidationError extends Error {
  override readonly name = 'ResourceValidationError';

  constructor(message: string) {
    super(message);
  }
}
