import { describe, it, expect, vi } from 'vitest';
import type {
  HttpHandler,
  HttpMethod,
  HttpRequestLike,
  HttpResponseLike,
  HttpRouter,
} from '../../../src/types/contracts/http-router.contract.js';
import { registerResourceRoutes } from '../../../src/controllers/http/resource.controller.js';

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

describe("CASE-SRV-02-9 — Consultation sécurisée de script GET /api/if/:id et rejet strict du path traversal (SPEC-SRV-02 / SPEC-DATA-02)", () => {
  it('test_CASE_SRV_02_9_get_if_script_secure_consultation', async () => {
    const router = new MockHttpRouter();
    const mockStore = {
      listAgents: vi.fn().mockResolvedValue([]),
      getAgent: vi.fn().mockResolvedValue(null),
      createAgent: vi.fn(),
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
      listIfScripts: vi.fn().mockResolvedValue(['custom-check.js']),
      deleteIfScript: vi.fn().mockResolvedValue(true),
      getIfScript: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'custom-check' || id === 'custom-check.js') {
          return 'return sac["0"] > 0;';
        }
        return null;
      }),
    };

    const mockAgentService = {
      deleteProfile: vi.fn().mockResolvedValue(true),
    };

    const mockAdapterRegistry = {
      listOperationalAdapters: vi.fn().mockReturnValue([]),
    };

    registerResourceRoutes({
      router,
      resourceStore: mockStore as unknown as any,
      agentService: mockAgentService as unknown as any,
      adapterRegistry: mockAdapterRegistry as unknown as any,
    });

    const getIfScriptRoute = router.routes.find(
      (r) => r.method === 'GET' && r.path === '/api/if/:id',
    );
    expect(getIfScriptRoute).toBeDefined();

    // 1. Récupération nominale d'un script existant (200 OK)
    const resNominal = createMockResponse();
    await getIfScriptRoute?.handler(
      { method: 'GET', url: '/api/if/custom-check' } as HttpRequestLike,
      resNominal,
      { id: 'custom-check' },
    );
    expect(resNominal.statusCode).toBe(200);
    expect(resNominal.body).toContain('return sac["0"] > 0;');

    // 2. Rejet en 400 avec message en français pour path traversal
    const traversalVectors = [
      '../script.js',
      '../../secrets.json',
      '..%2F..%2Fetc%2Fpasswd',
      'sub/nested.js',
      '..\\windows\\system32',
    ];

    for (const vector of traversalVectors) {
      const resTraversal = createMockResponse();
      await getIfScriptRoute?.handler(
        { method: 'GET', url: `/api/if/${encodeURIComponent(vector)}` } as HttpRequestLike,
        resTraversal,
        { id: vector },
      );
      expect(resTraversal.statusCode).toBe(400);
      const parsedBody = JSON.parse(resTraversal.body);
      expect(parsedBody.message).toMatch(/invalide|interdit|traversée/i);
    }

    // 3. Retour 404 pour un script inexistant
    const resNotFound = createMockResponse();
    await getIfScriptRoute?.handler(
      { method: 'GET', url: '/api/if/script-fantome' } as HttpRequestLike,
      resNotFound,
      { id: 'script-fantome' },
    );
    expect(resNotFound.statusCode).toBe(404);
    const parsedNotFound = JSON.parse(resNotFound.body);
    expect(parsedNotFound.message).toMatch(/introuvable|non trouvé/i);
  });
});
