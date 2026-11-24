/**
 * CASE-UTILS-03-2 — Gestion de la rétention temporelle (TTL par domaine et surcharge) et politique d'éviction LRU
 * (`AC-UTILS-03-2` / `ADR-016` / `CR-005`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInternalCache, defineCacheConfig } from '../../../src/utils/cache/index.js';

describe('CASE-UTILS-03-2 — Rétention temporelle TTL et éviction LRU internalCache', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'performance', 'setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('test_CASE_UTILS_03_2_domain_and_override_ttl_expiration', () => {
    const config = defineCacheConfig({
      baseConfig: {
        max: 100,
        ttl: 500,
        ttlResolution: 0,
        perf: { now: () => Date.now() },
      },
      domains: {
        shortLived: {
          createKey: (k: string) => k,
          ttl: 50,
        },
        defaultTtl: {
          createKey: (k: string) => k,
        },
      },
    });

    const cache = createInternalCache(config);

    // 1. TTL configuré au niveau du domaine (50 ms)
    cache.shortLived.set(['temp'], 'valeur');
    expect(cache.shortLived.get(['temp'])).toBe('valeur');
    expect(cache.shortLived.has(['temp'])).toBe(true);

    // Avance de 20 ms -> toujours valide
    vi.advanceTimersByTime(20);
    expect(cache.shortLived.get(['temp'])).toBe('valeur');
    expect(cache.shortLived.has(['temp'])).toBe(true);

    // Avance de 40 ms supplémentaires (total 60 ms > 50 ms) -> expiré
    vi.advanceTimersByTime(40);
    expect(cache.shortLived.get(['temp'])).toBeUndefined();
    expect(cache.shortLived.has(['temp'])).toBe(false);

    // 2. Surcharge ponctuelle du TTL à l'écriture (overrideTtl = 20 ms)
    cache.defaultTtl.set(['overrideKey'], 'valeur-courte', 20);
    expect(cache.defaultTtl.get(['overrideKey'])).toBe('valeur-courte');

    // Avance de 30 ms (> 20 ms override, alors que baseConfig.ttl = 500 ms)
    vi.advanceTimersByTime(30);
    expect(cache.defaultTtl.get(['overrideKey'])).toBeUndefined();
    expect(cache.defaultTtl.has(['overrideKey'])).toBe(false);
  });

  it('test_CASE_UTILS_03_2_lru_capacity_eviction', () => {
    const config = defineCacheConfig({
      baseConfig: { max: 2 },
      domains: {
        store: {
          createKey: (k: string) => k,
        },
      },
    });

    const cache = createInternalCache(config);

    cache.store.set(['k1'], 'val1');
    cache.store.set(['k2'], 'val2');

    // Lecture de k1 pour marquer k2 comme la moins récemment consultée
    expect(cache.store.get(['k1'])).toBe('val1');

    // Insertion d'un 3ème élément dépassant la capacité max: 2
    cache.store.set(['k3'], 'val3');

    // k1 et k3 doivent être conservés, k2 doit être évincé
    expect(cache.store.get(['k1'])).toBe('val1');
    expect(cache.store.get(['k3'])).toBe('val3');
    expect(cache.store.get(['k2'])).toBeUndefined();
  });
});

