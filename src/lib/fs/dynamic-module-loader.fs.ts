/**
 * Chargement dynamique et exécution des scripts If (LIB-003 / SPEC-DATA-02).
 * AC-DATA-02-2 : coercition Boolean ; AC-DATA-02-3 : erreurs typées sans crash hôte.
 */

import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import type { BlockInputBag } from '../../types/models/input-bag.model.js';
import { logStorageReadError } from '../../utils/logger/events/errors/storage-error.event.js';

/** Signature d'une fonction de condition If recevant le sac d'entrées. */
export type IfScriptFn = (sac: BlockInputBag) => unknown;

/** Erreur de chargement / syntaxe à l'import (AC-DATA-02-3). */
export class IfScriptLoadError extends Error {
  override readonly name = 'IfScriptLoadError';

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

/** Erreur runtime lors de l'exécution de `if(sac)` (AC-DATA-02-3). */
export class IfScriptRuntimeError extends Error {
  override readonly name = 'IfScriptRuntimeError';

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

/**
 * Extrait la fonction candidate d'un module exporté.
 *
 * @param exported - Module ou fonction exportée.
 * @param scriptPath - Chemin du script pour le message d'erreur.
 */
function extractFunction(exported: unknown, scriptPath: string) {
  const candidate =
    typeof exported === 'function'
      ? exported
      : exported !== null &&
          typeof exported === 'object' &&
          'default' in exported &&
          typeof (exported as { default: unknown }).default === 'function'
        ? (exported as { default: IfScriptFn }).default
        : undefined;

  if (candidate === undefined) {
    throw new IfScriptLoadError(`Script If invalide (fonction attendue) : ${scriptPath}`);
  }
  return candidate as IfScriptFn;
}

/**
 * Normalise une cause d'erreur en instance de IfScriptLoadError.
 *
 * @param scriptPath - Chemin du script en échec.
 * @param cause - Cause d'erreur capturée.
 */
function toLoadError(scriptPath: string, cause: unknown) {
  if (cause instanceof IfScriptLoadError) {
    return cause;
  }
  const detail = cause instanceof Error ? cause.message : String(cause);
  const kind = cause instanceof Error ? cause.name : 'Error';
  return new IfScriptLoadError(
    `Échec du chargement du script If (syntaxe) ${scriptPath}: ${kind}: ${detail}`,
    { cause },
  );
}

/**
 * Charge un script If CJS (`.js`) ou ESM (`.mjs`) et retourne `(sac) => …`.
 * Les erreurs d'import/syntaxe sont encapsulées en `IfScriptLoadError`.
 *
 * @param scriptPath - Chemin absolu ou relatif du script If.
 * @returns Fonction IfScriptFn chargée.
 */
export async function loadIfScript(scriptPath: string) {
  const absolute = path.resolve(scriptPath);

  try {
    if (absolute.endsWith('.mjs')) {
      const mod: unknown = await import(pathToFileURL(absolute).href);
      return extractFunction(mod, absolute);
    }

    const requireFromHere = createRequire(import.meta.url);
    const resolved = requireFromHere.resolve(absolute);
    delete requireFromHere.cache[resolved];
    const exported: unknown = requireFromHere(absolute);
    return extractFunction(exported, absolute);
  } catch (cause: unknown) {
    logStorageReadError(absolute, cause);
    throw toLoadError(absolute, cause);
  }
}

/**
 * Exécute la fonction If et coerce le résultat en booléen (`Boolean`).
 * Les exceptions runtime sont encapsulées en `IfScriptRuntimeError`.
 *
 * @param fn - Fonction IfScriptFn à exécuter.
 * @param sac - Sac d'entrées du bloc.
 * @returns Résultat booléen de la condition.
 */
export function runIfScript(fn: IfScriptFn, sac: BlockInputBag) {
  try {
    return Boolean(fn(sac));
  } catch (cause: unknown) {
    logStorageReadError('script:if', cause);
    if (cause instanceof IfScriptRuntimeError) {
      throw cause;
    }
    const detail = cause instanceof Error ? cause.message : String(cause);
    const kind = cause instanceof Error ? cause.name : 'Error';
    throw new IfScriptRuntimeError(`Erreur runtime script If (${kind}): ${detail}`, { cause });
  }
}
