/**
 * Primitives de vérification d'existence et de permissions d'exécution sur le système de fichiers hôte.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { EnvEngineContext, ExecutableEnvFieldDescriptor } from './env.types.js';

function resolveCandidateExecutablePath(raw: string, workspacePath: string) {
  const normalized = raw.trim().replace(/\\/g, '/');
  const resolved = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(workspacePath, normalized);

  if (process.platform !== 'win32' && /\.(cmd|bat)$/i.test(resolved)) {
    const shCandidate = resolved.replace(/\.(cmd|bat)$/i, '.sh');
    if (fs.existsSync(shCandidate)) {
      return shCandidate;
    }
  }
  return resolved;
}

function verifyExecutablePermissions(resolved: string, label: string) {
  if (!fs.existsSync(resolved)) {
    throw new Error(`Binaire ${label} introuvable ou inexistant : ${resolved}`);
  }
  try {
    fs.accessSync(resolved, fs.constants.X_OK);
  } catch {
    throw new Error(`Binaire ${label} non exécutable (permission) : ${resolved}`);
  }
}

/**
 * Valide un descripteur déclaratif de binaire exécutable.
 *
 * @param key - Clé de la variable d'environnement
 * @param raw - Valeur textuelle brute
 * @param options - Descripteur et chemin du workspace hôte
 * @returns Chemin absolu validé du binaire
 */
export function validateExecutableField(
  key: string,
  raw: string | undefined,
  options: { d: ExecutableEnvFieldDescriptor; workspacePath: string },
) {
  if (raw === undefined || raw.trim() === '') {
    if (options.d.isRequired !== false) {
      const hint = options.d.helpRef ? ` Consultez ${options.d.helpRef}.` : '';
      throw new Error(`Variable d'environnement obligatoire manquante : ${key}.${hint}`);
    }
    return undefined;
  }
  const resolved = resolveCandidateExecutablePath(raw, options.workspacePath);
  verifyExecutablePermissions(resolved, options.d.label ?? key);
  return resolved;
}

/**
 * Valide un binaire exécutable obligatoire avec résolution de chemin relatif.
 *
 * @param options - Options de libellé et lien d'aide
 * @returns Fonction validatrice d'exécutable obligatoire
 */
export function requireExecutablePath(options?: { helpRef?: string; label?: string }) {
  return (key: string, raw: string | undefined, ctx: EnvEngineContext) => {
    const d: ExecutableEnvFieldDescriptor = {
      type: 'executable',
      isRequired: true,
      label: options?.label,
      helpRef: options?.helpRef,
    };
    const res = validateExecutableField(key, raw, { d, workspacePath: ctx.workspacePath });
    return res as string;
  };
}

/**
 * Valide un binaire exécutable optionnel.
 *
 * @param options - Options de libellé
 * @returns Fonction validatrice d'exécutable optionnel
 */
export function optionalExecutablePath(options?: { label?: string }) {
  return (key: string, raw: string | undefined, ctx: EnvEngineContext) => {
    const d: ExecutableEnvFieldDescriptor = {
      type: 'executable',
      isRequired: false,
      label: options?.label,
    };
    return validateExecutableField(key, raw, { d, workspacePath: ctx.workspacePath });
  };
}
