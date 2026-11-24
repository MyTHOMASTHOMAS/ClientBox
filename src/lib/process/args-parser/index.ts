/**
 * Moteur déclaratif d'analyse des arguments CLI.
 */

export type {
  CliOptionType,
  CliOptionSpec,
  CliParserSchema,
  CliParseResult,
} from './args-parser.types.js';

export { ServerCliParseError, parseCliArgs } from './args-parser.engine.js';
