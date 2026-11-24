/**
 * Types et interfaces du moteur de validation d'environnement typé.
 * Réexporte les contrats déclaratifs du Palier 1 (src/types/) et définit les erreurs runtime.
 */

export type {
  EnvEngineContext,
  EnvFieldType,
  BaseEnvFieldDescriptor,
  StringEnvFieldDescriptor,
  NumberEnvFieldDescriptor,
  BooleanEnvFieldDescriptor,
  EnumEnvFieldDescriptor,
  ExecutableEnvFieldDescriptor,
  EnvFieldDescriptor,
  EnvValidator,
  EnvSchema,
  EnvEngineResult,
} from '../../../types/contracts/env-schema.contract.js';

/**
 * Erreur levée lorsqu'un fichier d'environnement spécifié n'existe pas.
 */
export class EnvLoadError extends Error {
  override readonly name = 'EnvLoadError';
}

/**
 * Erreur levée lorsqu'une variable d'environnement ne respecte pas son schéma.
 */
export class EnvValidationError extends Error {
  override readonly name = 'EnvValidationError';
}
