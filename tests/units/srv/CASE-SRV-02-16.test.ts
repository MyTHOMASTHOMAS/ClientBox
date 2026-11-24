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

async function getRunSnapshot(holder: unknown, scenarioId: string) {
  const router = new MockHttpRouter();
  registerExecutionRoutes(router, holder as never);
  const route = router.routes.find(
    (r) => r.method === 'GET' && r.path === '/api/scenarios/:id/run',
  );
  expect(route).toBeDefined();
  const res = createMockResponse();
  await route?.handler(
    { method: 'GET', url: `/api/scenarios/${scenarioId}/run` } as HttpRequestLike,
    res,
    { id: scenarioId },
  );
  return { res, body: JSON.parse(res.body || '{}') as Record<string, unknown> };
}

function assertNoTerminalPayload(body: Record<string, unknown>) {
  expect(body.chunks).toBeUndefined();
  expect(body.stdout).toBeUndefined();
  expect(body.stderr).toBeUndefined();
  expect(body.terminal).toBeUndefined();
  expect(JSON.stringify(body)).not.toMatch(/"stdout"|"stderr"|"chunks"/);
}

describe('CASE-SRV-02-16 — Snapshot GET /api/scenarios/:id/run (SPEC-SRV-02 / SPEC-UI-03)', () => {
  it('test_CASE_SRV_02_16_execution_snapshot_get_run_for_ui_rehydration', async () => {
    // 1. Idle
    const idle = await getRunSnapshot(
      { activeRunner: null, startRunner: vi.fn(), stopActiveRunner: vi.fn() },
      'sc-1',
    );
    expect(idle.res.statusCode).toBe(200);
    expect(idle.body.status).toBe('idle');
    expect(idle.body.activeScenarioId).toBeNull();
    expect(idle.body.busy).toBe(false);
    expect(idle.body.blocks).toEqual([]);
    assertNoTerminalPayload(idle.body);

    // 2. Runner actif sur le même id
    const activeRunner = {
      stop: vi.fn(),
      getStatus: () => 'running' as const,
      getScenarioId: () => 'sc-1',
      getBlockStatuses: () =>
        new Map([
          ['start-1', 'completed'],
          ['run-1', 'running'],
          ['run-2', 'idle'],
        ]),
    };
    const same = await getRunSnapshot(
      { activeRunner, startRunner: vi.fn(), stopActiveRunner: vi.fn() },
      'sc-1',
    );
    expect(same.res.statusCode).toBe(200);
    expect(same.body.status).toBe('running');
    expect(same.body.activeScenarioId).toBe('sc-1');
    expect(same.body.busy).toBe(true);
    expect(same.body.blocks).toEqual(
      expect.arrayContaining([
        { nodeId: 'start-1', status: 'completed' },
        { nodeId: 'run-1', status: 'running' },
        { nodeId: 'run-2', status: 'idle' },
      ]),
    );
    assertNoTerminalPayload(same.body);

    // 3. Runner actif sur un autre id
    const other = await getRunSnapshot(
      { activeRunner, startRunner: vi.fn(), stopActiveRunner: vi.fn() },
      'sc-2',
    );
    expect(other.res.statusCode).toBe(200);
    expect(other.body.busy).toBe(true);
    expect(other.body.activeScenarioId).toBe('sc-1');
    expect(other.body.status).toBe('running');
    assertNoTerminalPayload(other.body);
  });
});
