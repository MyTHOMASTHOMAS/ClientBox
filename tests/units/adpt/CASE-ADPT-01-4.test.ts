import { describe, it, expect } from 'vitest';
import type { CLIAdapter } from '../../../src/types/contracts/cli-adapter.contract.js';
import { AdapterRegistryService } from '../../../src/services/adapters/adapter-registry.service.js';
import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';

describe('CASE-ADPT-01-4 — Registre dynamique des adapters CLI et énumération opérationnelle (SPEC-ADPT-01 / SPEC-ADPT-02)', () => {
  it('test_CASE_ADPT_01_4_adapter_registry_service_enumeration', async () => {
    const cursorAdapter = new CursorCLIAdapter();
    const registry = new AdapterRegistryService([cursorAdapter]);

    // 1. Liste des adaptateurs opérationnels
    const adapters =
      typeof (registry as any).getAllAdapters === 'function'
        ? (registry as any).getAllAdapters()
        : registry.listOperationalAdapters();

    expect(Array.isArray(adapters)).toBe(true);
    expect(adapters.length).toBeGreaterThanOrEqual(1);

    const foundCursor = adapters.find((a: CLIAdapter) => a.cliId === 'cursor-cli');
    expect(foundCursor).toBeDefined();
    expect(foundCursor?.cliId).toBe('cursor-cli');

    // 2. Récupération par identifiant valide
    const retrieved = registry.getAdapter('cursor-cli');
    expect(retrieved).toBeDefined();
    expect(retrieved?.cliId).toBe('cursor-cli');
    expect(typeof retrieved?.buildCommand).toBe('function');
    expect(typeof retrieved?.parseStreamLine).toBe('function');

    // 3. Récupération par identifiant inconnu -> doit retourner undefined
    const unknownAdapter = registry.getAdapter('non-existant');
    expect(unknownAdapter).toBeUndefined();
  });
});
