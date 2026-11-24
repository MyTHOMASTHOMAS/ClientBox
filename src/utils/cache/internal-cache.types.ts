/**
 * Types génériques du cache interne LRU multi-domaines (portage MedialogApi / ADR-016).
 */

import type { LRUCache } from 'lru-cache';

/**
 * Configuration de base du cache LRU sous-jacent.
 */
export type CacheBaseConfig = LRUCache.Options<string, NonNullable<unknown>, unknown>;

/**
 * Configuration d'un domaine de cache individuel.
 */
export interface CacheDomainConfig<
  TArgs extends readonly unknown[] = readonly unknown[],
  TInput = unknown,
  TOutput = TInput,
> {
  /**
   * Fonction générant la clé spécifique au domaine à partir des arguments donnés.
   */
  readonly createKey: (...args: TArgs) => string;

  /**
   * Transformer optionnel exécuté lors de la méthode set.
   */
  readonly set?: (data: TInput) => TOutput;

  /**
   * Durée de rétention spécifique en millisecondes pour ce domaine.
   */
  readonly ttl?: number;
}

/**
 * Dictionnaire générique des domaines de la configuration du cache.
 */
export type CacheDomainsMapConfig = Record<
  string,
  CacheDomainConfig<readonly never[], never, unknown>
>;

/**
 * Interface d'accès pour un domaine du cache.
 */
export interface CacheDomainApi<TArgs extends readonly unknown[], TInput, TOutput> {
  /**
   * Enregistre une valeur dans le cache pour ce domaine avec TTL optionnel.
   */
  readonly set: (args: TArgs, data: TInput, overrideTtl?: number) => TOutput;

  /**
   * Récupère une valeur du cache pour ce domaine.
   */
  readonly get: (args: TArgs) => TOutput | undefined;

  /**
   * Vérifie la présence d'une valeur dans le cache.
   */
  readonly has: (args: TArgs) => boolean;

  /**
   * Supprime une entrée du cache.
   */
  readonly delete: (args: TArgs) => boolean;
}

/**
 * Configuration globale de la fabrique de cache.
 */
export interface InternalCacheOptions<TDomains extends CacheDomainsMapConfig> {
  /**
   * Configuration de base de lru-cache.
   */
  readonly baseConfig: CacheBaseConfig;

  /**
   * Carte des domaines typés.
   */
  readonly domains: TDomains;
}

/**
 * Instance typée retournée par createInternalCache selon la carte des domaines.
 */
export type InternalCacheInstance<TDomains extends CacheDomainsMapConfig> = {
  [K in keyof TDomains]: TDomains[K] extends CacheDomainConfig<
    infer TArgs,
    infer TInput,
    infer TOutput
  >
    ? CacheDomainApi<TArgs, TInput, TOutput>
    : never;
};
