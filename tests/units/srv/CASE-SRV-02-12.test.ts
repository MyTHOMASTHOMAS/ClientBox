import { describe, it, expect, vi } from 'vitest';
import type {
  HttpHandler,
  HttpMethod,
  HttpRequestLike,
  HttpResponseLike,
  HttpRouter,
} from '../../../src/types/contracts/http-router.contract.js';
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

describe("CASE-SRV-02-12 — Rupture de flux SSE et cycle de désabonnement systématique via runner.off (SPEC-SRV-02 / SPEC-UI-03)", () => {
  it('test_CASE_SRV_02_12_sse_client_disconnect_cleanup', async () => {
    const router = new MockHttpRouter();
    const registeredListeners = new Map<string, Array<(data: unknown) => void>>();

    const mockRunner = {
      on: vi.fn().mockImplementation((ev: string, fn: (data: unknown) => void) => {
        const list = registeredListeners.get(ev) ?? [];
        list.push(fn);
        registeredListeners.set(ev, list);
      }),
      off: vi.fn().mockImplementation((ev: string, fn: (data: unknown) => void) => {
        const list = registeredListeners.get(ev);
        if (list) {
          const idx = list.indexOf(fn);
          if (idx !== -1) {
            list.splice(idx, 1);
          }
        }
      }),
    };

    const runnerHolder = {
      activeRunner: mockRunner,
      startRunner: vi.fn(),
      stopActiveRunner: vi.fn(),
    };

    registerStreamRoute(router, runnerHolder as any);

    const streamRoute = router.routes.find(
      (r) => r.method === 'GET' && r.path === '/api/scenarios/:id/stream',
    );
    expect(streamRoute).toBeDefined();

    // 1. Connexion initiale et transmission des en-têtes
    const reqCallbacks: Record<string, () => void> = {};
    const mockReq = {
      method: 'GET',
      url: '/api/scenarios/sc-1/stream',
      on: vi.fn().mockImplementation((ev: string, fn: () => void) => {
        reqCallbacks[ev] = fn;
      }),
    } as unknown as HttpRequestLike;

    const resStream = createMockResponse();
    await streamRoute?.handler(mockReq, resStream, { id: 'sc-1' });

    expect(resStream.headers['content-type']).toBe('text/event-stream');
    expect(resStream.headers['cache-control']).toBe('no-cache');
    expect(mockReq.on).toHaveBeenCalledWith('close', expect.any(Function));

    // Vérifier que runner.on a été invoqué pour abonner les flux
    expect(mockRunner.on).toHaveBeenCalled();
    const subscribedEventsCount = mockRunner.on.mock.calls.length;
    expect(subscribedEventsCount).toBeGreaterThanOrEqual(1);

    // 2. Déconnexion brutale du client (émission de l'événement 'close' sur req)
    expect(reqCallbacks['close']).toBeDefined();
    reqCallbacks['close']();

    // 3. Vérification du désabonnement systématique via runner.off
    expect(mockRunner.off).toHaveBeenCalled();
    expect(mockRunner.off.mock.calls.length).toBe(subscribedEventsCount);

    // Vérifier qu'aucun écouteur ne subsiste dans le registre
    for (const [, listeners] of registeredListeners.entries()) {
      expect(listeners.length).toBe(0);
    }
  });
});
