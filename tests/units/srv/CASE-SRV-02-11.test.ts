import { describe, it, expect, vi } from 'vitest';
import type {
  HttpHandler,
  HttpMethod,
  HttpRequestLike,
  HttpResponseLike,
  HttpRouter,
} from '../../../src/types/contracts/http-router.contract.js';
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

async function postRun(
  router: MockHttpRouter,
  holder: unknown,
  scenarioId: string,
) {
  registerExecutionRoutes(router, holder as never);
  const runRoute = router.routes.find(
    (r) => r.method === 'POST' && r.path === '/api/scenarios/:id/run',
  );
  expect(runRoute).toBeDefined();
  const res = createMockResponse();
  await runRoute?.handler(
    { method: 'POST', url: `/api/scenarios/${scenarioId}/run` } as HttpRequestLike,
    res,
    { id: scenarioId },
  );
  return res;
}

describe("CASE-SRV-02-11 — Contrôleur d'exécution : gardes 503 / 409 et absence de route de clear manuel (SPEC-SRV-02 / SPEC-ENG-04)", () => {
  it('test_CASE_SRV_02_11_execution_controller_lifecycle_guards', async () => {
    // 1. Garde 503 : RunnerHolder non initialisé (startRunner indéfini)
    const res503 = await postRun(
      new MockHttpRouter(),
      { activeRunner: null, startRunner: undefined, stopActiveRunner: vi.fn() },
      'sc-1',
    );
    expect(res503.statusCode).toBe(503);
    expect(JSON.parse(res503.body).message).toMatch(/non initialisé|indisponible/i);

    // 2. Garde 409 : runner running déjà actif
    const startRunnerRunning = vi.fn();
    const activeRunning = {
      stop: vi.fn(),
      isRunning: true,
      getStatus: () => 'running' as const,
    };
    const res409Running = await postRun(
      new MockHttpRouter(),
      {
        activeRunner: activeRunning,
        startRunner: startRunnerRunning,
        stopActiveRunner: vi.fn(),
      },
      'sc-2',
    );
    expect(res409Running.statusCode).toBe(409);
    expect(JSON.parse(res409Running.body).message).toMatch(/déjà en cours|conflit/i);
    expect(startRunnerRunning).not.toHaveBeenCalled();

    // 3. Garde 409 : activeRunner présent en pause (anti-faux-vert isRunning seul)
    const startRunnerPaused = vi.fn();
    const activePaused = {
      stop: vi.fn(),
      isRunning: false,
      getStatus: () => 'paused' as const,
    };
    const res409Paused = await postRun(
      new MockHttpRouter(),
      {
        activeRunner: activePaused,
        startRunner: startRunnerPaused,
        stopActiveRunner: vi.fn(),
      },
      'sc-2',
    );
    expect(res409Paused.statusCode).toBe(409);
    expect(JSON.parse(res409Paused.body).message).toMatch(/déjà en cours|conflit/i);
    expect(startRunnerPaused).not.toHaveBeenCalled();

    // 4. Garde 409 : activeRunner non nul même sans isRunning / getStatus
    const startRunnerBare = vi.fn();
    const res409Bare = await postRun(
      new MockHttpRouter(),
      {
        activeRunner: { stop: vi.fn() },
        startRunner: startRunnerBare,
        stopActiveRunner: vi.fn(),
      },
      'sc-autre',
    );
    expect(res409Bare.statusCode).toBe(409);
    expect(startRunnerBare).not.toHaveBeenCalled();

    // 5. Route clear retirée
    const routerClear = new MockHttpRouter();
    registerExecutionRoutes(routerClear, {
      activeRunner: activeRunning,
      startRunner: vi.fn(),
      stopActiveRunner: vi.fn(),
    } as never);
    expect(routerClear.routes.filter((r) => r.path.endsWith('/clear'))).toEqual([]);
    expect(activeRunning.stop).not.toHaveBeenCalled();
  });
});
