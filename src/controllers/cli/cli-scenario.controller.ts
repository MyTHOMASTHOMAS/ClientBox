/**
 * Contrôleur d'exécution directe de scénario en ligne de commande (CLI Headless) sans socket HTTP (SPEC-SRV-01 / ADR-020).
 * Orchestration terminale et streaming console Option B.
 */

import type { ResourceStoreService } from '../../services/resources/resource-store.service.js';
import type { AgentService } from '../../services/agents/agent.service.js';
import type { AdapterRegistryService } from '../../services/adapters/adapter-registry.service.js';
import { ScenarioRunnerService } from '../../services/runner/scenario-runner.service.js';

/** Options de démarrage pour l'exécution d'un scénario en direct dans le terminal. */
export interface CliScenarioRunnerOptions {
  readonly target: string;
  readonly services: {
    readonly store: ResourceStoreService;
    readonly agentService?: AgentService;
    readonly adapterRegistry?: AdapterRegistryService;
    readonly userDocs?: unknown;
  };
  readonly workspacePath: string;
  readonly stdout?: { write: (chunk: string) => boolean };
  readonly stderr?: { write: (chunk: string) => boolean };
  readonly signal?: AbortSignal;
  readonly maxCallScenarioDepth?: number;
}

/**
 * Résout le scénario cible dans le store par identifiant exact puis par nom insensible à la casse.
 *
 * @param store - Service de stockage des ressources.
 * @param target - Identifiant ou nom du scénario recherché.
 */
async function resolveTargetScenario(store: ResourceStoreService, target: string) {
  const direct = await store.getScenario(target);
  if (direct) {
    return direct;
  }
  const allScenarios = await store.listScenarios();
  const lower = target.toLowerCase();
  const found = allScenarios.find((s) => s.name.toLowerCase() === lower);
  return found ?? null;
}

/**
 * Attache les écouteurs de streaming Option B au runner.
 *
 * @param runner - Instance du moteur de scénario.
 * @param stdout - Flux de sortie standard.
 */
function attachStreamListeners(
  runner: ScenarioRunnerService,
  stdout: { write: (chunk: string) => boolean },
) {
  runner.on('chunkReceived', (data: unknown) => {
    const chunkData = data as { chunk?: string } | undefined;
    if (chunkData?.chunk) {
      stdout.write(chunkData.chunk);
    }
  });

  runner.on('blockStatusChanged', (data: unknown) => {
    const b = data as
      | {
          blockId?: string;
          status?: string;
          blockType?: string;
          power?: number;
        }
      | undefined;
    if (!b?.blockId) return;
    if (b.status === 'running') {
      stdout.write(`[Bloc: ${b.blockId}] Début d'exécution (${b.blockType ?? 'inconnu'})\n`);
    } else if (b.status === 'completed') {
      stdout.write(`[Bloc: ${b.blockId}] Terminé avec succès (power: ${b.power ?? 1})\n`);
    }
  });
}

/**
 * Exécute le runner en surveillant un éventuel signal d'abandon.
 *
 * @param runner - Instance du ScenarioRunnerService.
 * @param signal - Signal d'abandon optionnel.
 */
async function executeWithAbort(runner: ScenarioRunnerService, signal?: AbortSignal) {
  let wasAborted = false;
  const onAbort = () => {
    wasAborted = true;
    void runner.stop();
  };

  if (signal?.aborted) {
    void runner.stop();
    return { status: 'stopped' as const, error: undefined };
  }

  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    await runner.run();
    const finalStatus = wasAborted ? 'stopped' : runner.getStatus();
    return { status: finalStatus, error: undefined };
  } catch (err: unknown) {
    if (wasAborted || signal?.aborted) {
      void runner.stop();
      return { status: 'stopped' as const, error: undefined };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { status: 'error' as const, error: message };
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * Exécute un scénario en direct dans le terminal sans serveur HTTP (CLI Headless).
 *
 * @param options - Paramètres d'exécution en ligne de commande.
 */
export async function runCliScenario(options: CliScenarioRunnerOptions) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  const scenario = await resolveTargetScenario(options.services.store, options.target);
  if (!scenario) {
    stderr.write(`[ClientsBox] Scénario introuvable : "${options.target}".\n`);
    return 1;
  }

  stdout.write(`[ClientsBox] Démarrage du scénario "${scenario.name}" (${scenario.id})...\n`);

  const runner = new ScenarioRunnerService({
    scenario,
    adapters: options.services.adapterRegistry?.listOperationalAdapters() ?? [],
    workspacePath: options.workspacePath,
    resourceStore: options.services.store,
    maxCallScenarioDepth: options.maxCallScenarioDepth ?? 5,
  });

  attachStreamListeners(runner, stdout);

  const execRes = await executeWithAbort(runner, options.signal);

  if (execRes.status === 'completed') {
    stdout.write('[ClientsBox] Exécution terminée avec succès.\n');
    return 0;
  }
  if (execRes.status === 'stopped') {
    stderr.write('[ClientsBox] Scénario interrompu par signal système.\n');
    return 130;
  }
  const detail = execRes.error ? ` : ${execRes.error}` : '';
  stderr.write(`[ClientsBox] Échec de l'exécution du scénario${detail}.\n`);
  return 1;
}
