import { describe, it, expect, vi } from 'vitest';
import type {
  HttpHandler,
  HttpMethod,
  HttpRequestLike,
  HttpResponseLike,
  HttpRouter,
} from '../../../src/types/contracts/http-router.contract.js';
import { registerExecutionRoutes } from '../../../src/controllers/http/execution/execution.controller.js';
import { registerStreamRoute } from '../../../src/controllers/sse/stream.controller.js';
import { buildExecutionSnapshot } from '../../../src/controllers/http/execution/execution-http.helper.js';

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
  chunks: string[];
} {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    chunks: [] as string[],
    setHeader(name: string, value: string): void {
      res.headers[name.toLowerCase()] = value;
    },
    end(chunk?: unknown): void {
      if (typeof chunk === 'string') {
        res.body = chunk;
      }
    },
    write(chunk?: unknown): boolean {
      if (typeof chunk === 'string') {
        res.chunks.push(chunk);
      }
      return true;
    },
  };
  return res;
}

describe('CASE-SRV-02-19 — CallScenario activeScenarioId racine / GET-SSE enfant / 409 (SPEC-SRV-02)', () => {
  it('test_CASE_SRV_02_19_call_scenario_root_active_id_and_409', async () => {
    const listeners = new Map<string, Set<(d: unknown) => void>>();
    const activeRunner = {
      stop: vi.fn(),
      isRunning: true,
      getStatus: () => 'running' as const,
      getScenarioId: () => 'parent',
      getBlockStatuses: () =>
        new Map([
          ['call-1', 'running'],
          ['run-child', 'running'],
        ]),
      on(ev: string, fn: (d: unknown) => void) {
        if (!listeners.has(ev)) listeners.set(ev, new Set());
        listeners.get(ev)!.add(fn);
      },
      off(ev: string, fn: (d: unknown) => void) {
        listeners.get(ev)?.delete(fn);
      },
    };

    const holder = {
      activeRunner,
      startRunner: vi.fn(),
      stopActiveRunner: vi.fn(),
    };

    // Identité racine pendant CallScenario
    const snapParent = buildExecutionSnapshot(activeRunner as never, 'parent');
    expect(snapParent.activeScenarioId).toBe('parent');
    expect(snapParent.busy).toBe(true);
    expect(snapParent.blocks.some((b) => b.nodeId === 'call-1')).toBe(true);

    // GET run enfant : pas d'état nested (pas de blocks enfant)
    const snapChild = buildExecutionSnapshot(activeRunner as never, 'enfant');
    expect(snapChild.activeScenarioId).toBe('parent');
    expect(snapChild.blocks).toEqual([]);

    const router = new MockHttpRouter();
    registerExecutionRoutes(router, holder as never);
    const getRoute = router.routes.find(
      (r) => r.method === 'GET' && r.path === '/api/scenarios/:id/run',
    );
    expect(getRoute).toBeDefined();
    const getRes = createMockResponse();
    await getRoute!.handler(
      { method: 'GET', url: '/api/scenarios/enfant/run' } as HttpRequestLike,
      getRes,
      { id: 'enfant' },
    );
    const getBody = JSON.parse(getRes.body) as {
      activeScenarioId: string;
      blocks: unknown[];
    };
    expect(getBody.activeScenarioId).toBe('parent');
    expect(getBody.blocks).toEqual([]);

    // Second POST /run → 409
    const postRoute = router.routes.find(
      (r) => r.method === 'POST' && r.path === '/api/scenarios/:id/run',
    );
    const postRes = createMockResponse();
    await postRoute!.handler(
      { method: 'POST', url: '/api/scenarios/autre/run' } as HttpRequestLike,
      postRes,
      { id: 'autre' },
    );
    expect(postRes.statusCode).toBe(409);

    // SSE enfant : ne doit pas publier les events du sous-runner / run racine
    const streamRouter = new MockHttpRouter();
    registerStreamRoute(streamRouter, holder as never);
    const streamRoute = streamRouter.routes.find(
      (r) => r.method === 'GET' && r.path === '/api/scenarios/:id/stream',
    );
    expect(streamRoute).toBeDefined();
    const streamRes = createMockResponse();
    const closeHandlers: Array<() => void> = [];
    const req = {
      method: 'GET',
      url: '/api/scenarios/enfant/stream',
      on(ev: string, fn: () => void) {
        if (ev === 'close') closeHandlers.push(fn);
      },
    } as HttpRequestLike & { on: (ev: string, fn: () => void) => void };

    // Le handler SSE doit recevoir l'id de scénario (params) pour filtrer
    await streamRoute!.handler(req, streamRes, { id: 'enfant' });
    const subscribedBeforeFilter = (listeners.get('blockStatusChanged')?.size ?? 0) > 0;
    for (const fn of listeners.get('blockStatusChanged') ?? []) {
      fn({ nodeId: 'run-child', status: 'running' });
    }
    // Soit aucun abonnement sur le canal enfant, soit aucun chunk nested publié
    if (subscribedBeforeFilter) {
      expect(streamRes.chunks.join('')).not.toMatch(/run-child/);
    } else {
      expect(streamRes.chunks.join('')).toBe('');
    }
  });
});

