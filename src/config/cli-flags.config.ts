/**
 * Définition déclarative du schéma des arguments CLI de ClientsBox.
 */

import type { CliParserSchema } from '../types/contracts/cli-parser.contract.js';
import { DEFAULT_SERVER_PORT } from './constants.config.js';

const MIN_TCP_PORT = 1;
const MAX_TCP_PORT = 65535;

/**
 * Schéma des options de ligne de commande reconnues par ClientsBox.
 */
export const CLIENTSBOX_CLI_SCHEMA: CliParserSchema = [
  {
    key: 'port',
    short: '-p',
    long: '--port',
    type: 'number',
    envKey: 'PORT',
    defaultValue: DEFAULT_SERVER_PORT,
    min: MIN_TCP_PORT,
    max: MAX_TCP_PORT,
    description: 'Port HTTP local du serveur',
  },
  {
    key: 'envFile',
    short: '-e',
    long: '--env',
    type: 'string',
    isNonEmpty: true,
    description: "Fichier d'environnement personnalisé",
  },
  {
    key: 'execScene',
    long: '--exec-scene',
    type: 'string',
    isNonEmpty: true,
    description: 'Identifiant du scénario à exécuter en headless',
  },
];
