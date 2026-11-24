/**
 * Module de journalisation structurée isomorphique pour ClientsBox.
 * @module utils/logger/types
 * @description Types publics du logger applicatif.
 */

/**
 * Niveaux de gravité supportés par le logger.
 *
 * - `debug` — diagnostic détaillé (jamais émis en prod, non contournable par `enables`).
 * - `info` — événement informatif standard.
 * - `success` — opération réussie (affiché en vert côté terminal).
 * - `warn` — situation anormale mais non bloquante.
 * - `error` — échec ou erreur métier / technique.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

/**
 * Contexte passé à chaque fonction de {@link LogEnables}.
 */
export type LogEnableContext = {
  /** Tags effectifs (logger + `options.tags` de l'appel). */
  tags: string[];
  /** Valeur `isDevOnly` effective après fusion logger / appel. */
  isDevOnly: boolean;
};

/**
 * Garde personnalisée exécutée dans `shouldLog`.
 */
export type LogEnableFn = (isDev: boolean, context: LogEnableContext) => boolean;

/**
 * Une garde unique ou une liste (toutes doivent retourner `true`).
 */
export type LogEnables = LogEnableFn | LogEnableFn[];

/**
 * Options de dérivation via `Logger.with`.
 */
export type LogWithOptions = {
  /** Tags ajoutés au logger dérivé. */
  tags?: string[];
  /** Remplace la restriction environnementale de dev héritée. */
  isDevOnly?: boolean;
  /** Alias rétrocompatible pour isDevOnly. */
  onDevOnly?: unknown;
  /** Gardes ajoutées à la liste du parent. */
  enables?: LogEnables;
};

/**
 * Options facultatives passées à chaque appel de log.
 */
export type LogOptions = {
  /** Tags additionnels fusionnés avec ceux du logger. */
  tags?: string[];
  /** Données associées (objet, tableau ou Error). */
  data?: unknown;
  /** Durée en millisecondes affichée en suffixe. */
  ms?: number;
  /**
   * Si vrai, le log n'est émis qu'en environnement dev.
   * @default false
   */
  isDevOnly?: boolean;
  /** Alias rétrocompatible pour isDevOnly. */
  onDevOnly?: unknown;
  /**
   * Gardes personnalisées exécutées dans `shouldLog`.
   */
  enables?: LogEnables;
};

/**
 * Instance de logger liée à un service ou module.
 */
export type Logger = {
  /** Nom du service ou module (préfixe des lignes de log). */
  readonly serviceName: string;
  /** Tags fixes hérités par tous les appels. */
  readonly tags: readonly string[];
  /** Restriction dev héritée. */
  readonly isDevOnly?: boolean;
  /** Gardes héritées et cumulées. */
  readonly enables: readonly LogEnableFn[];
  /** Message de niveau `debug`. */
  debug: (message: string, options?: LogOptions) => void;
  /** Message de niveau `info`. */
  info: (message: string, options?: LogOptions) => void;
  /** Message de niveau `warn`. */
  warn: (message: string, options?: LogOptions) => void;
  /** Message de niveau `error`. */
  error: (message: string, options?: LogOptions) => void;
  /** Message de niveau `success`. */
  success: (message: string, options?: LogOptions) => void;
  /** Dérive un logger (tags, isDevOnly, enables). */
  with: {
    (...tags: string[]): Logger;
    (options: LogWithOptions): Logger;
  };
  /** Regroupe des logs repliables dans la console. */
  group: (title: string, fn: () => void, options?: LogOptions) => void;
  /** Mesure une opération asynchrone et journalise sa durée. */
  timed: <T>(
    label: string,
    fn: () => Promise<T>,
    options?: LogOptions & { level?: Exclude<LogLevel, 'success'> },
  ) => Promise<T>;
};
