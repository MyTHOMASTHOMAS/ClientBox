/**
 * Fabrique de cache interne LRU multi-domaines avec TTL (portage MedialogApi / ADR-016).
 */

import { LRUCache } from 'lru-cache';
import type {
  CacheDomainApi,
  CacheDomainConfig,
  CacheDomainsMapConfig,
  InternalCacheInstance,
  InternalCacheOptions,
} from './internal-cache.types.js';

function createDomainApi<TArgs extends readonly unknown[], TInput, TOutput>(
  lru: LRUCache<string, NonNullable<unknown>>,
  domainKey: string,
  domainConfig: CacheDomainConfig<TArgs, TInput, TOutput>,
) {
  const api: CacheDomainApi<TArgs, TInput, TOutput> = {
    set: (args: TArgs, data: TInput, overrideTtl?: number) => {
      const subKey = domainConfig.createKey(...args);
      const fullKey = `${domainKey}:${subKey}`;
      const finalValue = domainConfig.set ? domainConfig.set(data) : (data as unknown as TOutput);
      const ttl = overrideTtl ?? domainConfig.ttl;

      if (ttl !== undefined) {
        lru.set(fullKey, finalValue as NonNullable<unknown>, { ttl });
      } else {
        lru.set(fullKey, finalValue as NonNullable<unknown>);
      }
      return finalValue;
    },
    get: (args: TArgs) => {
      const subKey = domainConfig.createKey(...args);
      const fullKey = `${domainKey}:${subKey}`;
      return lru.get(fullKey) as TOutput | undefined;
    },
    has: (args: TArgs) => {
      const subKey = domainConfig.createKey(...args);
      const fullKey = `${domainKey}:${subKey}`;
      return lru.has(fullKey);
    },
    delete: (args: TArgs) => {
      const subKey = domainConfig.createKey(...args);
      const fullKey = `${domainKey}:${subKey}`;
      return lru.delete(fullKey);
    },
  };
  return api;
}

/**
 * Fonction utilitaire pour inférer et valider la configuration du cache avec un typage exact.
 *
 * @param options - Options de configuration du cache et des domaines
 */
export function defineCacheConfig<TDomains extends CacheDomainsMapConfig>(
  options: InternalCacheOptions<TDomains>,
) {
  return options;
}

/**
 * Fabrique générique construisant l'instance du service de cache multi-domaines basée sur LRUCache.
 *
 * @param options - Configuration du cache de base et de ses domaines typés
 */
export function createInternalCache<TDomains extends CacheDomainsMapConfig>(
  options: InternalCacheOptions<TDomains>,
) {
  const lru = new LRUCache<string, NonNullable<unknown>>(
    options.baseConfig as LRUCache.Options<string, NonNullable<unknown>, unknown>,
  );
  const instance = {} as InternalCacheInstance<TDomains>;
  const entries = Object.entries(options.domains);

  for (const [domainKey, domainConfig] of entries) {
    const api = createDomainApi(lru, domainKey, domainConfig);
    (instance as Record<string, unknown>)[domainKey] = api;
  }

  return instance;
}
