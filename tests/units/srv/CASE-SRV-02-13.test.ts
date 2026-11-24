import { describe, it, expect, vi } from 'vitest';
import type {
  HttpHandler,
  HttpMethod,
  HttpRequestLike,
  HttpResponseLike,
  HttpRouter,
} from '../../../src/types/contracts/http-router.contract.js';
import { registerResourceRoutes } from '../../../src/controllers/http/resource.controller.js';
import { registerExecutionRoutes } from '../../../src/controllers/http/execution/execution.controller.js';

class MockHttpRouter implements HttpRouter {
  readonly routes: { method: HttpMethod; path: string; handler: HttpHandler }[] = [];

  get(path: string, handler: HttpHandler): void {
    this.routes.push({ method: 'GET', path, handler });
  }
  post(path: string, handler: HttpHandler): void {
    this.routes.push({ method: 'POST', path, handler });
  }
  put(path: string, handler: HttpHandler): void {
    this.routes.push({ method: 'PUT', path, handler });
  }
  delete(path: string, handler: HttpHandler): void {
    this.routes.push({ method: 'DELETE', path, handler });
  }
  handle(_req: HttpRequestLike, _res: HttpResponseLike): boolean {
    return false;
  }
}

function createMockResponse(): HttpResponseLike & {
  body: string;
  headers: Record<string, string>;
} {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(name: string, value: string): void {
      res.headers[name.toLowerCase()] = value;
    },
    end(chunk?: unknown): void {
      if (typeof chunk === 'string') {
        res.body = chunk;
      }
    },
  };
  return res;
}

const FORBIDDEN_ENGLISH_TOKENS = [
  'ENOENT',
  'Unexpected token',
  'is not a function',
  'cannot read property',
  'undefined',
  'null pointer',
  'Internal Server Error',
];

describe('CASE-SRV-02-13 — Matrice complète de localisation en français des erreurs HTTP JSON (SPEC-SRV-02 / SPEC-ARCH-04)', () => {
  it('test_CASE_SRV_02_13_http_errors_french_localization_matrix', async () => {
    const router = new MockHttpRouter();

    const mockStore = {
      listAgents: vi.fn().mockResolvedValue([]),
      getAgent: vi.fn().mockResolvedValue(null),
      createAgent: vi.fn().mockImplementation(() => {
        throw new Error('Données invalides : le nom de l’agent est obligatoire.');
      }),
      updateAgent: vi.fn(),
      deleteAgent: vi.fn(),
      listProfils: vi.fn().mockResolvedValue([]),
      getProfil: vi.fn().mockResolvedValue(null),
      createProfil: vi.fn(),
      updateProfil: vi.fn(),
      deleteProfil: vi.fn(),
      listPrompts: vi.fn().mockResolvedValue([]),
      getPrompt: vi.fn().mockResolvedValue(null),
      createPrompt: vi.fn(),
      updatePrompt: vi.fn(),
      deletePrompt: vi.fn(),
      listExitConditions: vi.fn().mockResolvedValue([]),
      getExitCondition: vi.fn().mockResolvedValue(null),
      createExitCondition: vi.fn(),
      updateExitCondition: vi.fn(),
      deleteExitCondition: vi.fn(),
      listScenarios: vi.fn().mockResolvedValue([]),
      getScenario: vi.fn().mockResolvedValue(null),
      createScenario: vi.fn(),
      updateScenario: vi.fn(),
      deleteScenario: vi.fn(),
      listIfScripts: vi.fn().mockResolvedValue([]),
      deleteIfScript: vi.fn(),
    };

    const mockAgentService = {
      deleteProfile: vi.fn().mockImplementation(async () => {
        const err = new Error(
          'Impossible de supprimer ce profil car il est utilisé par des agents.',
        );
        (err as { statusCode?: number }).statusCode = 409;
        throw err;
      }),
    };

    const mockAdapterRegistry = {
      listOperationalAdapters: vi.fn().mockReturnValue([]),
    };

    registerResourceRoutes({
      router,
      resourceStore: mockStore as any,
      agentService: mockAgentService as any,
      adapterRegistry: mockAdapterRegistry as any,
    });

    const runnerHolder = {
      activeRunner: { isRunning: true, stop: vi.fn() },
      startRunner: undefined, // Simule 503
      stopActiveRunner: vi.fn(),
    };

    registerExecutionRoutes(router, runnerHolder as any);

    // 1. Validation 400 sur corps invalide
    const createAgentRoute = router.routes.find(
      (r) => r.method === 'POST' && r.path === '/api/agents',
    );
    const res400 = createMockResponse();
    await createAgentRoute?.handler(
      { method: 'POST', url: '/api/agents', body: {} } as HttpRequestLike,
      res400,
      {},
    );
    expect(res400.statusCode).toBe(400);
    const body400 = JSON.parse(res400.body);
    expect(typeof body400.message).toBe('string');
    expect(body400.message.length).toBeGreaterThan(0);
    for (const token of FORBIDDEN_ENGLISH_TOKENS) {
      expect(body400.message).not.toContain(token);
    }

    // 2. Validation 404 sur ressource inexistante
    const getAgentRoute = router.routes.find(
      (r) => r.method === 'GET' && r.path === '/api/agents/:id',
    );
    const res404 = createMockResponse();
    await getAgentRoute?.handler(
      { method: 'GET', url: '/api/agents/inconnu' } as HttpRequestLike,
      res404,
      { id: 'inconnu' },
    );
    expect(res404.statusCode).toBe(404);
    const body404 = JSON.parse(res404.body);
    expect(typeof body404.message).toBe('string');
    expect(body404.message).toMatch(/non trouvé|introuvable/i);
    for (const token of FORBIDDEN_ENGLISH_TOKENS) {
      expect(body404.message).not.toContain(token);
    }

    // 3. Validation 409 sur suppression profil lié
    const deleteProfileRoute = router.routes.find(
      (r) => r.method === 'DELETE' && r.path === '/api/profils/:id',
    );
    const res409 = createMockResponse();
    await deleteProfileRoute?.handler(
      { method: 'DELETE', url: '/api/profils/profil-lie' } as HttpRequestLike,
      res409,
      { id: 'profil-lie' },
    );
    expect(res409.statusCode).toBe(409);
    const body409 = JSON.parse(res409.body);
    expect(typeof body409.message).toBe('string');
    expect(body409.message).toMatch(/impossible|utilisé|profil|agent/i);
    for (const token of FORBIDDEN_ENGLISH_TOKENS) {
      expect(body409.message).not.toContain(token);
    }

    // 4. Validation 503 sur runner non initialisé
    const runRoute = router.routes.find(
      (r) => r.method === 'POST' && r.path === '/api/scenarios/:id/run',
    );
    const res503 = createMockResponse();
    await runRoute?.handler(
      { method: 'POST', url: '/api/scenarios/sc-1/run' } as HttpRequestLike,
      res503,
      { id: 'sc-1' },
    );
    expect(res503.statusCode).toBe(503);
    const body503 = JSON.parse(res503.body);
    expect(typeof body503.message).toBe('string');
    expect(body503.message).toMatch(/initialisé|service/i);
    for (const token of FORBIDDEN_ENGLISH_TOKENS) {
      expect(body503.message).not.toContain(token);
    }
  });
});
