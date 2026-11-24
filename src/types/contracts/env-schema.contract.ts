/**
 * Contrats d'interfaces et schémas déclaratifs d'environnement (Palier 1 : Types).
 * Définit la structure déclarative des variables d'environnement consommée par src/config/ et src/lib/process/.
 */

/** Contexte fourni aux validateurs d'environnement (ex: workspacePath). */
export interface EnvEngineContext {
  /** Chemin absolu du répertoire de travail (workspace). */
  readonly workspacePath: string;
}

/** Types de champs supportés pour la description déclarative d'environnement. */
export type EnvFieldType = 'string' | 'number' | 'boolean' | 'enum' | 'executable';

/** Propriétés communes à tous les descripteurs de variables d'environnement. */
export interface BaseEnvFieldDescriptor {
  /** Description documentaire de la variable d'environnement. */
  readonly description?: string;
  /** Indique si la variable est strictement requise. */
  readonly isRequired?: boolean;
}

/** Descripteur déclaratif d'une chaîne de caractères d'environnement. */
export interface StringEnvFieldDescriptor extends BaseEnvFieldDescriptor {
  readonly type: 'string';
  readonly default?: string;
  readonly minLength?: number;
  readonly helpRef?: string;
}

/** Descripteur déclaratif d'un nombre d'environnement avec bornes optionnelles. */
export interface NumberEnvFieldDescriptor extends BaseEnvFieldDescriptor {
  readonly type: 'number';
  readonly default?: number;
  readonly min?: number;
  readonly max?: number;
}

/** Descripteur déclaratif d'un booléen d'environnement. */
export interface BooleanEnvFieldDescriptor extends BaseEnvFieldDescriptor {
  readonly type: 'boolean';
  readonly default?: true | false;
}

/** Descripteur déclaratif d'une énumération d'environnement. */
export interface EnumEnvFieldDescriptor<T extends string = string> extends BaseEnvFieldDescriptor {
  readonly type: 'enum';
  readonly allowed: readonly T[];
  readonly default?: T;
}

/** Descripteur déclaratif d'un binaire exécutable d'environnement vérifié sur le système hôte. */
export interface ExecutableEnvFieldDescriptor extends BaseEnvFieldDescriptor {
  readonly type: 'executable';
  readonly label?: string;
  readonly helpRef?: string;
}

/** Union discriminée de tous les descripteurs déclaratifs supportés par le moteur d'environnement. */
export type EnvFieldDescriptor =
  | StringEnvFieldDescriptor
  | NumberEnvFieldDescriptor
  | BooleanEnvFieldDescriptor
  | EnumEnvFieldDescriptor<string>
  | ExecutableEnvFieldDescriptor;

/** Fonction de validation et transformation d'une variable d'environnement (rétrocompatibilité). */
export type EnvValidator<T = string> = (
  key: string,
  raw: string | undefined,
  ctx: EnvEngineContext,
) => T;

/** Schéma déclaratif associant chaque clé d'environnement à son descripteur déclaratif pur ou validateur. */
export type EnvSchema = Readonly<Record<string, EnvFieldDescriptor | EnvValidator<unknown>>>;

/** Résultat de l'initialisation et de la confirmation de l'environnement. */
export interface EnvEngineResult<T = Record<string, unknown>> {
  /** Indique si des variables ont été chargées depuis un fichier sur le disque. */
  readonly isLoadedFromFile: boolean;
  /** Chemin absolu du fichier d'environnement chargé, le cas échéant. */
  readonly envFilePath?: string;
  /** Objet de configuration typé consolidé. */
  readonly config: T;
}
