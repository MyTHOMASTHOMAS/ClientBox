/**
 * CASE-UTILS-03-1 — Opérations CRUD élémentaires et isolation multi-domaines du cache interne LRU
 * (`AC-UTILS-03-1` / `ADR-016` / `CR-005`).
 */

import { describe, it, expect } from 'vitest';
import { createInternalCache, defineCacheConfig } from '../../../src/utils/cache/index.js';

describe('CASE-UTILS-03-1 — Opérations CRUD et isolation multi-domaines internalCache', () => {
  it('test_CASE_UTILS_03_1_crud_lifecycle_and_multidomain_isolation', () => {
    const config = defineCacheConfig({
      baseConfig: { max: 100 },
      domains: {
        models: {
          createKey: (cliId: string) => cliId,
        },
        sessions: {
          createKey: (sessionId: string) => sessionId,
        },
      },
    });

    const cache = createInternalCache(config);

    // 1. Écriture et lecture nominale
    const written = cache.models.set(['antigravity'], ['gemini-2.5-pro', 'gemini-2.5-flash']);
    expect(written).toEqual(['gemini-2.5-pro', 'gemini-2.5-flash']);

    expect(cache.models.has(['antigravity'])).toBe(true);
    expect(cache.models.get(['antigravity'])).toEqual(['gemini-2.5-pro', 'gemini-2.5-flash']);

    // Clé absente
    expect(cache.models.has(['inconnu'])).toBe(false);
    expect(cache.models.get(['inconnu'])).toBeUndefined();

    // 2. Isolation stricte multi-domaines (même argument de clé)
    cache.models.set(['shared-key'], ['model-a']);
    cache.sessions.set(['shared-key'], 'session-b');

    expect(cache.models.get(['shared-key'])).toEqual(['model-a']);
    expect(cache.sessions.get(['shared-key'])).toBe('session-b');

    // 3. Suppression
    const deleted = cache.models.delete(['antigravity']);
    expect(deleted).toBe(true);
    expect(cache.models.has(['antigravity'])).toBe(false);
    expect(cache.models.get(['antigravity'])).toBeUndefined();

    // Suppression d'une clé inexistante
    expect(cache.models.delete(['antigravity'])).toBe(false);
  });

  it('test_CASE_UTILS_03_1_custom_set_transformer', () => {
    const config = defineCacheConfig({
      baseConfig: { max: 50 },
      domains: {
        upper: {
          createKey: (k: string) => k,
          set: (data: string) => data.toUpperCase(),
        },
      },
    });

    const cache = createInternalCache(config);

    const result = cache.upper.set(['greeting'], 'bonjour');
    expect(result).toBe('BONJOUR');
    expect(cache.upper.get(['greeting'])).toBe('BONJOUR');
  });
});

