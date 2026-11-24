/**
 * Moteur générique d'analyse des arguments de ligne de commande piloté par schéma.
 */

import type { CliOptionSpec, CliParserSchema, CliParseResult } from './args-parser.types.js';
import { findMatchingOption, type MatchCandidate } from './args-parser.matcher.js';
import { ServerCliParseError } from './args-parser.error.js';

export { ServerCliParseError } from './args-parser.error.js';

interface ProcessTargetContext {
  readonly values: Record<string, unknown>;
  readonly envOverrides: Record<string, string>;
}

function validateNumberSpec(spec: CliOptionSpec<unknown>, rawValue: string) {
  if (!/^-?\d+$/.test(rawValue)) {
    if (spec.key === 'port') {
      throw new ServerCliParseError(
        'Usage invalide : le port doit être une valeur numérique (--port <n> ou -p <n>).',
      );
    }
    throw new ServerCliParseError(`Usage invalide : l'option ${spec.long} doit être un entier.`);
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (
    (spec.min !== undefined && parsed < spec.min) ||
    (spec.max !== undefined && parsed > spec.max)
  ) {
    if (spec.key === 'port') {
      throw new ServerCliParseError(
        `Port hors plage : la valeur doit être comprise entre ${spec.min ?? 1} et ${spec.max ?? 65535} (reçu : ${String(parsed)}).`,
      );
    }
    throw new ServerCliParseError(
      `Valeur hors plage pour ${spec.long} : attendu entre ${spec.min} et ${spec.max} (reçu : ${String(parsed)}).`,
    );
  }
}

function transformSpecValue(spec: CliOptionSpec<unknown>, rawValue: string) {
  if (spec.transform) {
    return spec.transform(rawValue);
  }
  if (spec.type === 'number') {
    return Number.parseInt(rawValue, 10);
  }
  if (spec.type === 'boolean') {
    return rawValue === 'true' || rawValue === '1' || rawValue === '';
  }
  return rawValue;
}

function processCandidate(candidate: MatchCandidate, token: string, target: ProcessTargetContext) {
  const { spec, rawValue } = candidate;

  if (spec.isNonEmpty && (!rawValue || rawValue.trim() === '')) {
    throw new ServerCliParseError(`L'option ${spec.long} requiert une valeur non vide.`);
  }

  if (spec.type === 'number') {
    validateNumberSpec(spec, rawValue);
  }

  if (spec.validate) {
    spec.validate(rawValue, token);
  }

  target.values[spec.key] = transformSpecValue(spec, rawValue);
  if (spec.envKey) {
    target.envOverrides[spec.envKey] = rawValue;
  }
}

/**
 * @returnTypeExemption Typage contractuel du résultat de parsing des options CLI.
 * Analyse une liste d'arguments en fonction d'un schéma d'options déclaratif.
 *
 * @param argv - Arguments CLI (généralement process.argv.slice(2))
 * @param schema - Schéma décrivant les options acceptées
 * @returns Résultat typé contenant les valeurs, les surcharges d'env et les arguments non appariés
 */
export function parseCliArgs(argv: readonly string[], schema: CliParserSchema): CliParseResult {
  const values: Record<string, unknown> = {};
  const envOverrides: Record<string, string> = {};
  const unmatched: string[] = [];

  for (const spec of schema) {
    if (spec.defaultValue !== undefined) {
      values[spec.key] = spec.defaultValue;
    }
  }

  const target: ProcessTargetContext = { values, envOverrides };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === undefined) continue;

    const candidate = findMatchingOption(token, argv[index + 1], schema);
    if (candidate !== null) {
      processCandidate(candidate, token, target);
      if (candidate.isNextConsumed) index += 1;
      continue;
    }

    unmatched.push(token);
  }

  return { values, envOverrides, unmatched };
}
