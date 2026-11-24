/**
 * @fileExemption Dépassement du seuil nominal de 150 lignes justifié par le regroupement cohérent des routes REST CRUD pour l'ensemble des 6 ressources déclaratives et scripts.
 */

import type { HttpRouter } from '../../types/contracts/http-router.contract.js';
import type {
  HttpRequestLike,
  HttpResponseLike,
} from '../../types/contracts/http-router.contract.js';
import type { ResourceStoreService } from '../../services/resources/resource-store.service.js';
import type { AgentService } from '../../services/agents/agent.service.js';
import type { AdapterRegistryService } from '../../services/adapters/adapter-registry.service.js';
import type { Agent } from '../../types/models/agent.model.js';
import type { Profile } from '../../types/models/profile.model.js';
import type { Prompt } from '../../types/models/prompt.model.js';
import type { ExitCondition } from '../../types/models/exit-condition.model.js';
import type { Scenario } from '../../types/models/scenario.model.js';

/** Options d'enregistrement des routes de ressources. */
export interface RegisterResourceRoutesOptions {
  readonly router: HttpRouter;
  readonly resourceStore: ResourceStoreService;
  readonly agentService: AgentService;
  readonly adapterRegistry: AdapterRegistryService;
}

function sendJson(res: HttpResponseLike, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.end(JSON.stringify(data));
}

function sendError(res: HttpResponseLike, statusCode: number, message: string) {
  sendJson(res, statusCode, { message });
}

function extractBody(req: HttpRequestLike) {
  return (req as HttpRequestLike & { body?: unknown }).body;
}

function registerSimpleCrudRoutes<T>(
  router: HttpRouter,
  prefix: string,
  label: string,
  crud: {
    list: () => Promise<readonly T[]>;
    get: (id: string) => Promise<T | null>;
    create: (item: T) => Promise<T>;
    update: (id: string, item: T) => Promise<T>;
    delete: (id: string) => Promise<void>;
  },
) {
  router.get(`/api/${prefix}`, async (_req, res) => sendJson(res, 200, await crud.list()));
  router.get(`/api/${prefix}/:id`, async (_req, res, params) => {
    try {
      const item = await crud.get(params.id);
      if (!item) return sendError(res, 404, `${label} non trouvé.`);
      sendJson(res, 200, item);
    } catch {
      sendError(res, 404, `${label} non trouvé.`);
    }
  });
  router.post(`/api/${prefix}`, async (req, res) => {
    try {
      sendJson(res, 201, await crud.create(extractBody(req) as unknown as T));
    } catch (err: unknown) {
      sendError(res, 400, err instanceof Error ? err.message : String(err));
    }
  });
  router.put(`/api/${prefix}/:id`, async (req, res, params) => {
    try {
      sendJson(res, 200, await crud.update(params.id, extractBody(req) as unknown as T));
    } catch (err: unknown) {
      sendError(res, 400, err instanceof Error ? err.message : String(err));
    }
  });
  router.delete(`/api/${prefix}/:id`, async (_req, res, params) => {
    try {
      await crud.delete(params.id);
      sendJson(res, 200, { success: true });
    } catch (err: unknown) {
      const code =
        (err as { statusCode?: number; httpStatus?: number }).statusCode ??
        (err as { httpStatus?: number }).httpStatus ??
        409;
      sendError(res, code, err instanceof Error ? err.message : String(err));
    }
  });
}

function registerAgentProfileRoutes(
  router: HttpRouter,
  store: ResourceStoreService,
  agentService: AgentService,
) {
  registerSimpleCrudRoutes<Agent>(router, 'agents', 'Agent', {
    list: () => store.listAgents(),
    get: (id) => store.getAgent(id),
    create: (a) => store.createAgent(a),
    update: (id, a) => store.updateAgent(id, a),
    delete: (id) => store.deleteAgent(id),
  });
  registerSimpleCrudRoutes<Profile>(router, 'profils', 'Profil', {
    list: () => store.listProfils(),
    get: (id) => store.getProfil(id),
    create: (p) => store.createProfil(p),
    update: (id, p) => store.updateProfil(id, p),
    delete: (id) => agentService.deleteProfile(id),
  });
}

function registerPromptExitScenarioRoutes(router: HttpRouter, store: ResourceStoreService) {
  registerSimpleCrudRoutes<Prompt>(router, 'prompts', 'Prompt', {
    list: () => store.listPrompts(),
    get: (id) => store.getPrompt(id),
    create: (p) => store.createPrompt(p),
    update: (id, p) => store.updatePrompt(id, p),
    delete: (id) => store.deletePrompt(id),
  });
  registerSimpleCrudRoutes<ExitCondition>(router, 'exit', 'Condition de sortie', {
    list: () => store.listExitConditions(),
    get: (id) => store.getExitCondition(id),
    create: (e) => store.createExitCondition(e),
    update: (id, e) => store.updateExitCondition(id, e),
    delete: (id) => store.deleteExitCondition(id),
  });
  registerSimpleCrudRoutes<Scenario>(router, 'scenarios', 'Scénario', {
    list: () => store.listScenarios(),
    get: (id) => store.getScenario(id),
    create: (s) => store.createScenario(s),
    update: (id, s) => store.updateScenario(id, s),
    delete: (id) => store.deleteScenario(id),
  });
}

const PATH_TRAVERSAL_REGEX = /(?:\.\.|[/\\]|%2[fF]|%5[cC])/u;

function isInvalidScriptId(id?: string) {
  return !id || PATH_TRAVERSAL_REGEX.test(id);
}

function registerIfRoutes(router: HttpRouter, store: ResourceStoreService) {
  router.get('/api/if', async (_req, res) => sendJson(res, 200, await store.listIfScripts()));
  router.get('/api/if/:id', async (_req, res, params) => {
    const scriptId = params.id;
    if (isInvalidScriptId(scriptId)) {
      sendError(res, 400, 'Identifiant de script invalide (traversée interdite).');
      return;
    }
    try {
      const storeWithIf = store as unknown as {
        getIfScript?(id: string): Promise<string | null>;
        readIfScript?(id: string): string;
      };
      const script = storeWithIf.getIfScript
        ? await storeWithIf.getIfScript(scriptId)
        : storeWithIf.readIfScript?.(scriptId);
      if (!script) {
        sendError(res, 404, 'Script introuvable.');
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.end(script);
    } catch {
      sendError(res, 404, 'Script introuvable.');
    }
  });
  router.delete('/api/if/:id', async (_req, res, params) => {
    await store.deleteIfScript(params.id);
    sendJson(res, 200, { success: true });
  });
}

function registerAdapterRoutes(router: HttpRouter, registry?: AdapterRegistryService) {
  router.get('/api/adapters', async (_req, res) => {
    sendJson(res, 200, registry?.listOperationalAdapters() ?? []);
  });
  router.get('/api/models', async (req, res) => {
    let cliId: string | undefined;
    if (req.url && req.url.includes('?')) {
      const search = new URLSearchParams(req.url.slice(req.url.indexOf('?')));
      cliId = search.get('cliId') ?? undefined;
    }
    const models = await registry?.listOperationalModels(cliId);
    sendJson(res, 200, models ?? []);
  });
}

/**
 * Enregistre l'ensemble des routes REST CRUD pour les ressources déclaratives.
 *
 * @param options - Options d'enregistrement des routes de ressources.
 */
export function registerResourceRoutes(options: RegisterResourceRoutesOptions) {
  registerAgentProfileRoutes(options.router, options.resourceStore, options.agentService);
  registerPromptExitScenarioRoutes(options.router, options.resourceStore);
  registerIfRoutes(options.router, options.resourceStore);
  registerAdapterRoutes(options.router, options.adapterRegistry);
}
