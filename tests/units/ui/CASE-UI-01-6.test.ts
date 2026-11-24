import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHttpClient } from '../../../src/ui/api/http.client.js';

describe('CASE-UI-01-6 — Client HTTP et flux SSE navigateur avec normalisation des erreurs en français (SPEC-UI-01 / SPEC-UI-03)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('test_CASE_UI_01_6_browser_http_client_implementation', async () => {
    // 1. Appel GET réussi avec désérialisation JSON
    const mockAgents = [{ id: 'ag-1', name: 'Agent Test' }];
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockAgents,
      text: async () => JSON.stringify(mockAgents),
    });

    const client = createHttpClient();
    const result = await client.get('/api/agents');
    expect(result).toEqual(mockAgents);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/agents', expect.objectContaining({ method: 'GET' }));

    // 2. Erreur réseau / serveur 503 avec normalisation en français (REQ-007)
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ message: 'Service temporairement indisponible.' }),
      text: async () => JSON.stringify({ message: 'Service temporairement indisponible.' }),
    });

    await expect(client.get('/api/scenarios/1/run')).rejects.toThrow(/indisponible|service/i);

    // 3. Erreur 404 avec normalisation en français
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Ressource introuvable.' }),
      text: async () => JSON.stringify({ message: 'Ressource introuvable.' }),
    });

    await expect(client.get('/api/agents/fantome')).rejects.toThrow(/introuvable|non trouvé/i);

    // 4. Souscription flux SSE et fermeture via unsubscribe()
    let closed = false;
    const mockEventSource = {
      onmessage: null as unknown,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn().mockImplementation(() => {
        closed = true;
      }),
    };

    // Injection ou simulation de constructeur EventSource
    (globalThis as any).EventSource = vi.fn().mockImplementation(() => mockEventSource);

    const onStdout = vi.fn();
    const onStderr = vi.fn();
    const onBlockStatus = vi.fn();

    const unsubscribe = client.subscribeStream('/api/scenarios/1/stream', {
      onStdout,
      onStderr,
      onBlockStatus,
    });

    expect((globalThis as any).EventSource).toHaveBeenCalledWith('/api/scenarios/1/stream');
    expect(typeof unsubscribe).toBe('function');

    // Annulation
    unsubscribe();
    expect(mockEventSource.close).toHaveBeenCalled();
    expect(closed).toBe(true);
  });
});
