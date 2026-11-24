/**
 * Détection et appariement des options de ligne de commande par rapport au schéma.
 */

import type { CliOptionSpec, CliParserSchema } from './args-parser.types.js';
import { ServerCliParseError } from './args-parser.error.js';

/** Candidat apparié lors du scan d'un argument CLI. */
export interface MatchCandidate {
  readonly spec: CliOptionSpec<unknown>;
  readonly rawValue: string;
  readonly isNextConsumed: boolean;
}

/**
 * Tente d'apparier un token d'argument à une spécification d'option donnée.
 *
 * @param token - Token courant examiné
 * @param nextToken - Token suivant disponible sur la ligne de commande
 * @param spec - Spécification de l'option attendue
 * @returns MatchCandidate si correspondance ou null
 */
export function matchTokenWithSpec(
  token: string,
  nextToken: string | undefined,
  spec: CliOptionSpec<unknown>,
) {
  if (spec.short && token === spec.short) {
    if (nextToken === undefined || nextToken.trim() === '') {
      throw new ServerCliParseError(`L'option ${token} requiert une valeur.`);
    }
    return { spec, rawValue: nextToken.trim(), isNextConsumed: true };
  }

  if (token === spec.long) {
    if (nextToken === undefined || nextToken.trim() === '') {
      throw new ServerCliParseError(`L'option ${token} requiert une valeur.`);
    }
    return { spec, rawValue: nextToken.trim(), isNextConsumed: true };
  }

  const equalsPrefix = `${spec.long}=`;
  if (token.startsWith(equalsPrefix)) {
    const rawValue = token.slice(equalsPrefix.length).trim();
    if (rawValue === '') {
      throw new ServerCliParseError(`L'option ${spec.long} requiert une valeur non vide.`);
    }
    return { spec, rawValue, isNextConsumed: false };
  }

  return null;
}

/**
 * Recherche une option correspondante dans le schéma pour le token courant.
 *
 * @param token - Token courant
 * @param nextToken - Token suivant
 * @param schema - Schéma des options autorisées
 * @returns Candidat apparié ou null
 */
export function findMatchingOption(
  token: string,
  nextToken: string | undefined,
  schema: CliParserSchema,
) {
  for (const spec of schema) {
    const candidate = matchTokenWithSpec(token, nextToken, spec);
    if (candidate !== null) {
      return candidate;
    }
  }
  return null;
}
