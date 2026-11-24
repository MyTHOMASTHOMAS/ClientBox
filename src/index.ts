/**
 * @fileExemption Dépassement du seuil nominal de 150 lignes justifié par la centralisation exclusive de l'assemblage Node, de l'injection de dépendances, du serveur HTTP et de l'arrêt gracieux (Composition Root ROOT-001).
 *
 * Séquence : arguments CLI → résolution de chemin → contrôle de binaire CLI
 * → services → routeur → serveur HTTP local (LIB-010) → URL dans le terminal (REQ-004)
 * → arrêt gracieux sur signaux système (AC-SRV-02-3).
 *
 * Aucun accès direct aux variables d'environnement ni au répertoire de travail (SPEC-ARCH-03) :
 * tout passe par les modules de la couche lib/.
 */

import { registerDocsRoutes } from './controllers/http/docs.controller.js';
import { registerExecutionRoutes } from './controllers/http/execution/execution.controller.js';
import type { RunnerHolder } from './controllers/shared/execution-runner.types.js';
import { registerResourceRoutes } from './controllers/http/resource.controller.js';
import { registerStreamRoute } from './controllers/sse/stream.controller.js';
import { CursorCLIAdapter } from './lib/adapters/cursor/cursor-cli.adapter.js';
import { AntigravityCLIAdapter } from './lib/adapters/antigravity/antigravity-cli.adapter.js';
import { CodexCLIAdapter } from './lib/adapters/codex/codex-cli.adapter.js';
import { ClaudeCLIAdapter } from './lib/adapters/claude/claude-cli.adapter.js';
import { createLocalHttpServer } from './lib/http/loopback-http.server.js';
import type { LocalHttpServerHandle } from './lib/http/loopback-http.server.js';
import { MiniRouter } from './lib/http/mini-http.router.js';
import { runCliScenario } from './controllers/cli/cli-scenario.controller.js';
import { ConfigService } from './services/config/index.js';
import { registerGracefulShutdown } from './lib/process/graceful-shutdown.manager.js';
import { STOP_GRACE_MS } from './lib/process/child-process.spawner.js';
import { writeServerReadyMessage } from './lib/process/startup-banner.printer.js';
import { AdapterRegistryService } from './services/adapters/adapter-registry.service.js';
import { AgentService } from './services/agents/agent.service.js';
import { ResourceStoreService } from './services/resources/resource-store.service.js';
import { ScenarioRunnerService } from './services/runner/scenario-runner.service.js';
import { UserDocsService } from './services/docs/user-docs.service.js';
import { logServerFatalError } from './utils/logger/events/errors/server-error.event.js';

const EXIT_FAILURE = 1;

/** Services applicatifs partagés, instanciés une seule fois ici. */
interface AppServices {
  readonly store: ResourceStoreService;
  readonly agentService: AgentService;
  readonly adapterRegistry: AdapterRegistryService;
  readonly userDocs: UserDocsService;
}

/**
 * Instancie les services métier pour le point d'entrée.
 *
 * @param dataRoot - Répertoire racine des données.
 * @param docsRoot - Répertoire d'export de la documentation.
 */
function createServices(dataRoot: string, docsRoot: string) {
  const store = new ResourceStoreService({ dataRoot });
  return {
    store,
    agentService: new AgentService({ store }),
    adapterRegistry: new AdapterRegistryService([
      new CursorCLIAdapter(),
      new AntigravityCLIAdapter(),
      new CodexCLIAdapter(),
      new ClaudeCLIAdapter(),
    ]),
    userDocs: new UserDocsService({ docsRoot }),
  };
}

/**
 * Configure et enregistre les routes des contrôleurs sur le routeur HTTP.
 *
 * @param services - Conteneur des services applicatifs.
 * @param runnerHolder - Référence mutable vers l'exécuteur de scénario en cours.
 */
function createRouter(services: AppServices, runnerHolder: RunnerHolder) {
  const router = new MiniRouter();
  registerResourceRoutes({
    router,
    resourceStore: services.store,
    agentService: services.agentService,
    adapterRegistry: services.adapterRegistry,
  });
  registerExecutionRoutes(router, runnerHolder);
  registerStreamRoute(router, runnerHolder);
  registerDocsRoutes({ router, userDocs: services.userDocs });
  return router;
}

/**
 * Vérifie si une erreur dispose d'un code système spécifique.
 *
 * @param error - Valeur d'erreur interceptée.
 * @param code - Code technique attendu.
 */
function hasErrorCode(error: unknown, code: string) {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === code;
}

/**
 * Traduit une erreur de démarrage en message opérateur français (REQ-007, C-06).
 *
 * @param error - Erreur rencontrée au démarrage.
 */
function describeStartupError(error: unknown) {
  if (hasErrorCode(error, 'EADDRINUSE')) {
    return "le port demandé est déjà utilisé (aucun port alternatif n'est tenté).";
  }
  if (hasErrorCode(error, 'EACCES')) {
    return 'accès refusé au port demandé (utilisez un port supérieur ou égal à 1024).';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'erreur inconnue.';
}

function createEventEmitter() {
  const listeners = new Map<string, Set<(d: unknown) => void>>();
  const emit = (ev: string, data: unknown) => {
    listeners.get(ev)?.forEach((fn) => {
      try {
        fn(data);
      } catch {}
    });
  };
  return {
    emit,
    on: (ev: string, fn: (d: unknown) => void) => {
      if (!listeners.has(ev)) listeners.set(ev, new Set());
      listeners.get(ev)?.add(fn);
    },
    off: (ev: string, fn: (d: unknown) => void) => {
      listeners.get(ev)?.delete(fn);
    },
  };
}

function forwardRunnerEvents(
  runner: ScenarioRunnerService,
  emit: (ev: string, data: unknown) => void,
) {
  runner.on('chunkReceived', (d) => emit('chunkReceived', d));
  runner.on('statusChanged', (d) => emit('statusChanged', d));
  runner.on('blockStatusChanged', (d) => emit('blockStatusChanged', d));
}

/**
 * Exécute le scénario hors requête HTTP sans laisser de rejet non géré.
 * L'échec est déjà journalisé et diffusé en SSE (statusChanged: error) par le runner.
 *
 * @param runner Runner à exécuter
 * @param onSettled Callback appelé à la fin de l'exécution
 */
async function runInBackground(runner: ScenarioRunnerService, onSettled: () => void) {
  try {
    await runner.run();
  } catch (error: unknown) {
    void error;
  } finally {
    onSettled();
  }
}

function createRunnerHolder(
  services: AppServices,
  workspacePath: string,
  maxCallScenarioDepth: number,
) {
  const emitter = createEventEmitter();
  const holder = {
    on: emitter.on,
    off: emitter.off,
    activeRunner: null as ScenarioRunnerService | null,
    async startRunner(scenarioId: string) {
      const scenario = await services.store.getScenario(scenarioId);
      if (!scenario) throw new Error(`Scénario introuvable : ${scenarioId}`);
      const runner = new ScenarioRunnerService({
        scenario,
        adapters: services.adapterRegistry.listOperationalAdapters(),
        workspacePath,
        resourceStore: services.store,
        maxCallScenarioDepth,
      });
      forwardRunnerEvents(runner, emitter.emit);
      holder.activeRunner = runner;
      void runInBackground(runner, () => {
        if (holder.activeRunner === runner) holder.activeRunner = null;
      });
    },
    async stopActiveRunner() {
      if (holder.activeRunner) {
        await holder.activeRunner.stop();
        holder.activeRunner = null;
        emitter.emit('statusChanged', {
          status: 'stopped',
          message: 'Scénario interrompu par arrêt opérateur.',
        });
      }
    },
  };
  return holder;
}

/**
 * Exécute un scénario directement dans le terminal (mode headless) et quitte le processus.
 */
async function executeCliHeadless(
  execScene: string,
  services: AppServices,
  options: { workspacePath: string; maxCallScenarioDepth: number },
) {
  const abortController = new AbortController();
  process.on('SIGINT', () => {
    abortController.abort();
  });
  process.on('SIGTERM', () => {
    abortController.abort();
  });

  const exitCode = await runCliScenario({
    target: execScene,
    services,
    workspacePath: options.workspacePath,
    stdout: process.stdout,
    stderr: process.stderr,
    signal: abortController.signal,
    maxCallScenarioDepth: options.maxCallScenarioDepth,
  });
  process.exit(exitCode);
}

/**
 * Configure la cascade d'arrêt gracieux du serveur HTTP et de ses sous-processus.
 */
function bindServerShutdown(server: LocalHttpServerHandle, runnerHolder: RunnerHolder) {
  const shutdown = registerGracefulShutdown({
    shouldBindProcessSignals: false,
    closeHttpServer: () => server.close(),
    exit: (code) => process.exit(code),
    stopActiveRunners: async () => {
      const runner = runnerHolder.activeRunner;
      const hadRunner = runner !== null;
      if (runner) {
        await runner.stop();
        runnerHolder.activeRunner = null;
      }
      if (hadRunner) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, STOP_GRACE_MS);
        });
      }
    },
  });
  process.on('SIGINT', () => {
    void shutdown.emit('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown.emit('SIGTERM');
  });
}

/**
 * Point d'entrée principal de l'application ClientsBox.
 */
async function main() {
  const config = new ConfigService().deploy(process.argv.slice(2));
  const services = createServices(config.dataRoot, config.docsRoot);

  if (config.execScene !== undefined) {
    await executeCliHeadless(config.execScene, services, {
      workspacePath: config.workspacePath,
      maxCallScenarioDepth: config.maxCallScenarioDepth,
    });
    return;
  }

  const runnerHolder = createRunnerHolder(
    services,
    config.workspacePath,
    config.maxCallScenarioDepth,
  );

  const server: LocalHttpServerHandle = await createLocalHttpServer({
    port: config.port,
    host: config.host,
    router: createRouter(services, runnerHolder),
  });
  writeServerReadyMessage(config.port);
  bindServerShutdown(server, runnerHolder);
}

try {
  await main();
} catch (err: unknown) {
  logServerFatalError('startup', err);
  process.stderr.write(`Échec du démarrage de ClientsBox : ${describeStartupError(err)}\n`);
  process.exit(EXIT_FAILURE);
}
