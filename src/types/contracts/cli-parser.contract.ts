/**
 * Contrat d'interface et spécification des options de ligne de commande (Palier 1 : Types).
 * Définit la structure déclarative des schémas d'options consommés par src/config/ et src/lib/process/.
 */

/** Type de valeur scalaire attendu pour une option de ligne de commande. */
export type CliOptionType = 'string' | 'number' | 'boolean';

/**
 * Spécification déclarative d'une option de ligne de commande reconnue par ClientsBox.
 */
export interface CliOptionSpec<T = unknown> {
  /** Clé identifiante de l'option dans l'objet de résultat. */
  readonly key: string;
  /** Syntaxe courte optionnelle (ex: '-p'). */
  readonly short?: string;
  /** Syntaxe longue obligatoire (ex: '--port'). */
  readonly long: string;
  /** Type primitif attendu pour la valeur. */
  readonly type: CliOptionType;
  /** Clé de variable d'environnement associée pour surcharge automatique. */
  readonly envKey?: string;
  /** Fonction de validation textuelle personnalisée avant transformation. */
  readonly validate?: (raw: string, token: string) => void;
  /** Fonction de transformation de la chaîne brute vers la valeur typée. */
  readonly transform?: (raw: string) => T;
  /** Borne numérique minimale autorisée (si type === 'number'). */
  readonly min?: number;
  /** Borne numérique maximale autorisée (si type === 'number'). */
  readonly max?: number;
  /** Exige une valeur textuelle non vide (après trim). */
  readonly isNonEmpty?: boolean;
  /** Valeur par défaut si l'option est omise. */
  readonly defaultValue?: T;
  /** Description de l'option pour documentation ou aide. */
  readonly description?: string;
}

/** Schéma complet définissant l'ensemble des options supportées. */
export type CliParserSchema = readonly CliOptionSpec<unknown>[];

/** Résultat de l'analyse des arguments de ligne de commande. */
export interface CliParseResult {
  /** Valeurs typées résolues, indexées par la clé de l'option. */
  readonly values: Readonly<Record<string, unknown>>;
  /** Surcharges d'environnement extraites (options avec envKey renseigné). */
  readonly envOverrides: Readonly<Record<string, string>>;
  /** Arguments positionnels ou non reconnus. */
  readonly unmatched: readonly string[];
}
