/**
 * Moteur d'initialisation et de validation d'environnement au runtime.
 */

import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import { EnvLoadError, type EnvEngineResult, type EnvSchema } from './env.types.js';
import { validateFieldDescriptor } from './env.validators.js';

/** Options de démarrage pour l'initialisation de l'environnement. */
export interface InitializeEnvEngineOptions {
  readonly envFile?: string;
  readonly workspacePath: string;
  readonly overrides?: Readonly<Record<string, string>>;
}

function loadTargetEnvFile(envFile: string | undefined, workspacePath: string) {
  if (envFile !== undefined) {
    const resolvedPath = path.resolve(workspacePath, envFile);
    if (!fs.existsSync(resolvedPath)) {
      throw new EnvLoadError(`Le fichier d'environnement spécifié n'existe pas : ${resolvedPath}`);
    }
    const content = fs.readFileSync(resolvedPath, 'utf8');
    Object.assign(process.env, util.parseEnv(content));
    return { isLoaded: true, filePath: resolvedPath };
  }

  const defaultPath = path.resolve(workspacePath, 'env/.env');
  if (fs.existsSync(defaultPath)) {
    const content = fs.readFileSync(defaultPath, 'utf8');
    Object.assign(process.env, util.parseEnv(content));
    return { isLoaded: true, filePath: defaultPath };
  }

  return { isLoaded: false, filePath: undefined };
}

function applyCliOverrides(overrides?: Readonly<Record<string, string>>) {
  if (!overrides) return;
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
}

/**
 * @returnTypeExemption Typage de l'objet de configuration consolidé.
 */
function validateAndLockSchema<T extends Record<string, unknown>>(
  schema: EnvSchema,
  workspacePath: string,
): T {
  const config = {} as T;
  const context = { workspacePath };

  for (const [key, entry] of Object.entries(schema)) {
    const validatedValue =
      typeof entry === 'function'
        ? entry(key, process.env[key], context)
        : validateFieldDescriptor(entry, { key, raw: process.env[key], ctx: context });

    (config as Record<string, unknown>)[key] = validatedValue;
    if (validatedValue !== undefined) {
      process.env[key] = String(validatedValue);
    }
  }

  return config;
}

/**
 * @returnTypeExemption Typage contractuel du résultat d'initialisation de l'environnement.
 * Initialise, surcharge et valide l'environnement d'exécution selon un schéma déclaratif.
 *
 * @param schema - Définition déclarative des variables et validateurs typés
 * @param options - Chemin de fichier, workspace hôte et surcharges CLI prioritaires
 * @returns Résultat d'exécution avec configuration consolidée
 */
export function initializeAndConfirmEnvironment<
  T extends Record<string, unknown> = Record<string, unknown>,
>(schema: EnvSchema, options: InitializeEnvEngineOptions): EnvEngineResult<T> {
  const { isLoaded, filePath } = loadTargetEnvFile(options.envFile, options.workspacePath);
  applyCliOverrides(options.overrides);
  const config = validateAndLockSchema<T>(schema, options.workspacePath);

  return {
    isLoadedFromFile: isLoaded,
    envFilePath: filePath,
    config,
  };
}
