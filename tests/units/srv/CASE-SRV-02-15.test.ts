import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
  HttpHandler,
  HttpMethod,
  HttpRequestLike,
  HttpResponseLike,
  HttpRouter,
} from '../../../src/types/contracts/http-router.contract.js';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
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

describe('CASE-SRV-02-15 — Atomicité et intégrité face à des requêtes PUT concurrentes sur la même ressource (SPEC-SRV-02 / SPEC-DATA-04)', () => {
  let tmpDir: string;
  let scenariosDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-test-srv-put-'));
    scenariosDir = path.join(tmpDir, 'scenarios');
    fs.mkdirSync(scenariosDir, { recursive: true });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignoré sur Windows si verrou temporaire
    }
  });

  it('test_CASE_SRV_02_15_concurrent_put_requests_atomicity', async () => {
    const store = new ResourceStoreService({ dataRoot: tmpDir });
    const router = new MockHttpRouter();

    registerResourceRoutes({
      router,
      resourceStore: store,
      agentService: {} as any,
      adapterRegistry: {} as any,
    });

    const putScenarioRoute = router.routes.find(
      (r) => r.method === 'PUT' && r.path === '/api/scenarios/:id',
    );
    expect(putScenarioRoute).toBeDefined();

    // Initialisation de la ressource initiale sur disque
    const scenarioId = 'sc-concurrence';
    const initialScenario: Scenario = {
      id: scenarioId,
      name: 'Version Initiale',
      nodes: [{ id: 'start-1', type: 'start', position: { x: 0, y: 0 } }],
      connections: [],
    };
    await store.createScenario(initialScenario);

    // Préparation de Req-A et Req-B
    const payloadA: Scenario = {
      id: scenarioId,
      name: 'Scénario Version Alpha',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        { id: 'run-1', type: 'run', position: { x: 100, y: 0 } },
      ],
      connections: [],
    };

    const payloadB: Scenario = {
      id: scenarioId,
      name: 'Scénario Version Bêta',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        { id: 'run-1', type: 'run', position: { x: 100, y: 0 } },
        { id: 'run-2', type: 'run', position: { x: 200, y: 0 } },
      ],
      connections: [
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-1',
          targetPortIndex: 0,
          key: '0',
        },
      ],
    };

    const resA = createMockResponse();
    const resB = createMockResponse();

    // Déclenchement simultané des deux requêtes PUT
    await Promise.all([
      putScenarioRoute?.handler(
        { method: 'PUT', url: `/api/scenarios/${scenarioId}`, body: payloadA } as HttpRequestLike,
        resA,
        { id: scenarioId },
      ),
      putScenarioRoute?.handler(
        { method: 'PUT', url: `/api/scenarios/${scenarioId}`, body: payloadB } as HttpRequestLike,
        resB,
        { id: scenarioId },
      ),
    ]);

    // Validation des réponses HTTP
    expect(resA.statusCode).toBe(200);
    expect(resB.statusCode).toBe(200);

    // Vérification du fichier sur le disque
    const targetFile = path.join(scenariosDir, `${scenarioId}.json`);
    expect(fs.existsSync(targetFile)).toBe(true);

    const rawContent = fs.readFileSync(targetFile, 'utf-8');
    let parsed: Scenario;
    expect(() => {
      parsed = JSON.parse(rawContent);
    }).not.toThrow();

    // L'état final doit correspondre intégralement à payloadA ou payloadB (aucun état tronqué ou corrompu)
    const isPayloadA = parsed!.name === 'Scénario Version Alpha' && parsed!.nodes.length === 2;
    const isPayloadB = parsed!.name === 'Scénario Version Bêta' && parsed!.nodes.length === 3;
    expect(isPayloadA || isPayloadB).toBe(true);

    // Vérification de l'absence de résidus .tmp dans le dossier
    const files = fs.readdirSync(scenariosDir);
    const tmpFiles = files.filter((f) => f.includes('.tmp') || f.endsWith('.tmp'));
    expect(tmpFiles.length).toBe(0);
  });
});
