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
  writes: string[];
} {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    writes: [] as string[],
    setHeader(name: string, value: string): void {
      res.headers[name.toLowerCase()] = value;
    },
    write(chunk: unknown): boolean {
      if (typeof chunk === 'string') {
        res.writes.push(chunk);
      }
      return true;
    },
    end(chunk?: unknown): void {
      if (typeof chunk === 'string') {
        res.body = chunk;
      }
    },
  };
  return res;
}

describe("CASE-SRV-02-8 — Contrôle d'exécution des scénarios et diffusion SSE (SPEC-SRV-02 / CTL-002 / CTL-003)", () => {
  it('test_CASE_SRV_02_8_execution_and_sse_streaming_controllers_integration', async () => {
    const router = new MockHttpRouter();
    const mockRunner = {
      run: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
    };

    const runnerHolder = {
      activeRunner: null as unknown,
      startRunner: vi.fn().mockImplementation(() => {
        runnerHolder.activeRunner = mockRunner;
        return mockRunner;
      }),
      stopActiveRunner: vi.fn().mockImplementation(async () => {
        if (runnerHolder.activeRunner) {
          await mockRunner.stop();
          runnerHolder.activeRunner = null;
        }
      }),
    };

    registerExecutionRoutes(router, runnerHolder as any);
    registerStreamRoute(router, runnerHolder as any);

    // 1. Vérification des routes enregistrées
    const runRoute = router.routes.find(
      (r) => r.method === 'POST' && r.path === '/api/scenarios/:id/run',
    );
    const stopRoute = router.routes.find(
      (r) => r.method === 'DELETE' && r.path === '/api/scenarios/:id/run',
    );
    const streamRoute = router.routes.find(
      (r) => r.method === 'GET' && r.path === '/api/scenarios/:id/stream',
    );

    expect(runRoute).toBeDefined();
    expect(stopRoute).toBeDefined();
    expect(streamRoute).toBeDefined();
    expect(router.routes.some((r) => r.path === '/api/agents/:id/clear')).toBe(false);

    // 2. Test POST /api/scenarios/:id/run
    const resRun = createMockResponse();
    await runRoute?.handler(
      { method: 'POST', url: '/api/scenarios/sc-1/run' } as HttpRequestLike,
      resRun,
      { id: 'sc-1' },
    );
    expect(resRun.statusCode).toBe(200);
    expect(runnerHolder.startRunner).toHaveBeenCalled();

    // 3. Test DELETE /api/scenarios/:id/run
    const resStop = createMockResponse();
    await stopRoute?.handler(
      { method: 'DELETE', url: '/api/scenarios/sc-1/run' } as HttpRequestLike,
      resStop,
      { id: 'sc-1' },
    );
    expect(resStop.statusCode).toBe(200);
    expect(mockRunner.stop).toHaveBeenCalled();

    // 4. Test GET /api/scenarios/:id/stream (SSE)
    const resStream = createMockResponse();
    const reqStream = {
      method: 'GET',
      url: '/api/scenarios/sc-1/stream',
      on: vi.fn(),
    } as unknown as HttpRequestLike;
    await streamRoute?.handler(reqStream, resStream, { id: 'sc-1' });
    expect(resStream.headers['content-type']).toBe('text/event-stream');
    expect(resStream.headers['cache-control']).toBe('no-cache');
  });
});
