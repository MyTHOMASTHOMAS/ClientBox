/**
 * Constantes et valeurs par défaut de configuration de ClientsBox.
 */

/** Port HTTP local par défaut (REQ-005, C-04). */
export const DEFAULT_SERVER_PORT = 2974;

/** Adresse IP d'écoute locale exclusive par défaut (C-11). */
export const DEFAULT_SERVER_HOST = '127.0.0.1';

/** Répertoire racine des agents par défaut (ADR-005). */
export const DEFAULT_AGENTS_DIR = '.agents';

/** Profondeur max d'imbrication par défaut (-1 = illimité, REQ-041). */
export const DEFAULT_CALL_SCENARIO_MAX_DEPTH = -1;

/** Délai d'expiration par défaut de probe CLI en millisecondes. */
export const DEFAULT_PROBE_TIMEOUT_MS = 15000;
