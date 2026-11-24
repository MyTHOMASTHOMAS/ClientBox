import { describe, it, expect, vi } from 'vitest';
import type {
  HttpHandler,
  HttpMethod,
  HttpRequestLike,
  HttpResponseLike,
  HttpRouter,
  RouteParams,
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

describe('CASE-SRV-02-7 — Enregistrement et routage des contrôleurs REST CRUD via HttpRouter (SPEC-SRV-02 / CTL-001)', () => {
  it('test_CASE_SRV_02_7_resource_controller_rest_crud_and_integrity_routing', async () => {
    const router = new MockHttpRouter();
    const mockStore = {
      listAgents: vi.fn().mockResolvedValue([{ id: 'agent-1', name: 'Agent 1' }]),
      getAgent: vi
        .fn()
        .mockImplementation(async (id: string) =>
          id === 'agent-1' ? { id, name: 'Agent 1' } : null,
        ),
      createAgent: vi.fn().mockResolvedValue({ id: 'agent-new', name: 'New' }),
      updateAgent: vi.fn().mockResolvedValue({ id: 'agent-1', name: 'Updated' }),
      deleteAgent: vi.fn().mockResolvedValue(true),
      listProfils: vi.fn().mockResolvedValue([]),
      getProfil: vi.fn().mockResolvedValue(null),
      createProfil: vi.fn().mockResolvedValue({ id: 'p-1' }),
      updateProfil: vi.fn().mockResolvedValue({ id: 'p-1' }),
      deleteProfil: vi.fn().mockResolvedValue(true),
      listPrompts: vi.fn().mockResolvedValue([]),
      getPrompt: vi.fn().mockResolvedValue(null),
      createPrompt: vi.fn().mockResolvedValue({ id: 'pr-1' }),
      updatePrompt: vi.fn().mockResolvedValue({ id: 'pr-1' }),
      deletePrompt: vi.fn().mockResolvedValue(true),
      listExitConditions: vi.fn().mockResolvedValue([]),
      getExitCondition: vi.fn().mockResolvedValue(null),
      createExitCondition: vi.fn().mockResolvedValue({ id: 'ex-1' }),
      updateExitCondition: vi.fn().mockResolvedValue({ id: 'ex-1' }),
      deleteExitCondition: vi.fn().mockResolvedValue(true),
      listScenarios: vi.fn().mockResolvedValue([]),
      getScenario: vi.fn().mockResolvedValue(null),
      createScenario: vi.fn().mockResolvedValue({ id: 'sc-1' }),
      updateScenario: vi.fn().mockResolvedValue({ id: 'sc-1' }),
      deleteScenario: vi.fn().mockResolvedValue(true),
      listIfScripts: vi.fn().mockResolvedValue(['script-1.js']),
      deleteIfScript: vi.fn().mockResolvedValue(true),
    };

    const mockAgentService = {
      deleteProfile: vi.fn().mockImplementation(async (profileId: string) => {
        if (profileId === 'profil-utilise') {
          const err = new Error(
            'Impossible de supprimer ce profil car il est utilisé par des agents.',
          );
          (err as { statusCode?: number }).statusCode = 409;
          throw err;
        }
        return true;
      }),
    };

    const mockAdapterRegistry = {
      listOperationalAdapters: vi.fn().mockReturnValue([{ id: 'cursor-cli', name: 'Cursor CLI' }]),
    };

    registerResourceRoutes({
      router,
      resourceStore: mockStore as unknown as any,
      agentService: mockAgentService as unknown as any,
      adapterRegistry: mockAdapterRegistry as unknown as any,
    });

    // 1. Vérification que les routes essentielles sont enregistrées
    const getAgentsRoute = router.routes.find(
      (r) => r.method === 'GET' && r.path === '/api/agents',
    );
    expect(getAgentsRoute).toBeDefined();

    const deleteProfileRoute = router.routes.find(
      (r) => r.method === 'DELETE' && r.path === '/api/profils/:id',
    );
    expect(deleteProfileRoute).toBeDefined();

    const getAdaptersRoute = router.routes.find(
      (r) => r.method === 'GET' && r.path === '/api/adapters',
    );
    expect(getAdaptersRoute).toBeDefined();

    // 2. Test exécution route GET /api/agents
    const resAgents = createMockResponse();
    await getAgentsRoute?.handler(
      { method: 'GET', url: '/api/agents' } as HttpRequestLike,
      resAgents,
      {},
    );
    expect(resAgents.statusCode).toBe(200);
    expect(JSON.parse(resAgents.body)).toEqual([{ id: 'agent-1', name: 'Agent 1' }]);

    // 3. Test conflit 409 sur suppression profil lié
    const resDeleteProfil = createMockResponse();
    await deleteProfileRoute?.handler(
      { method: 'DELETE', url: '/api/profils/profil-utilise' } as HttpRequestLike,
      resDeleteProfil,
      { id: 'profil-utilise' },
    );
    expect(resDeleteProfil.statusCode).toBe(409);
    expect(JSON.parse(resDeleteProfil.body).message).toMatch(/utilis|conflit|agent/i);

    // 4. Test GET /api/adapters
    const resAdapters = createMockResponse();
    await getAdaptersRoute?.handler(
      { method: 'GET', url: '/api/adapters' } as HttpRequestLike,
      resAdapters,
      {},
    );
    expect(resAdapters.statusCode).toBe(200);
    expect(JSON.parse(resAdapters.body)).toEqual([{ id: 'cursor-cli', name: 'Cursor CLI' }]);
  });
});
