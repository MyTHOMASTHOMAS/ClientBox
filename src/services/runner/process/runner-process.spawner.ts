/**
 * Exécution sous-processus CLI et résolution de contexte pour ScenarioRunnerService (SPEC-ENG-04).
 */

import type {
  CLIAdapter,
  CommandSpawnOptions,
} from '../../../types/contracts/cli-adapter.contract.js';
import type { ScenarioNode } from '../../../types/models/node.model.js';
import type { ResourceStoreService } from '../../resources/resource-store.service.js';
import type { ScenarioSessionRegistry } from '../session/runner-session.registry.js';
import { assemblePrompt } from '../../../domain/prompt/prompt.assembler.js';
import { shouldInjectSystemPrompt } from '../../../domain/prompt/injection-policy.evaluator.js';
import { spawnAgent, type SpawnAgentHandle } from '../../../lib/process/child-process.spawner.js';
import {
  logAgentProcessStarted,
  logAgentPromptGenerated,
} from '../../../utils/logger/events/info/agent-info.event.js';
import { createRunnerSpawnHandlers, type ExecuteSpawnParams } from './runner-process.handlers.js';

export type { ExecuteSpawnParams };

/**
 * Paramètres pour la préparation du contexte d'exécution d'un nœud.
 */
export interface PrepareRunContextParams {
  readonly node: ScenarioNode;
  readonly resourceStore: ResourceStoreService;
  readonly adapters: readonly CLIAdapter[];
  readonly workspacePath: string;
  readonly policyInjectionState: Map<string, boolean>;
  readonly sessions: ScenarioSessionRegistry;
}

/**
 * Contexte préparé prêt à être exécuté par un adaptateur CLI.
 */
export interface PreparedRunContext {
  readonly adapter: CLIAdapter;
  readonly commandSpec: CommandSpawnOptions;
  readonly agentId?: string;
}

function updateInjectionState(
  state: Map<string, boolean>,
  agentId: string,
  policy?: 'chaque_prompt' | 'debut_scenario' | 'une_fois_jusqu_a_clear',
) {
  const hasOnce = state.get(agentId) ?? false;
  const hasScenario = state.get('scenario:' + agentId) ?? false;
  const needed = shouldInjectSystemPrompt(policy ?? 'chaque_prompt', {
    hasInjectedOnce: hasOnce,
    hasInjectedThisScenario: hasScenario,
  });
  if (needed) {
    state.set(agentId, true);
    state.set('scenario:' + agentId, true);
  }
  return needed;
}

async function resolveRunResources(
  node: ScenarioNode,
  store: ResourceStoreService,
  adapters: readonly CLIAdapter[],
) {
  const agent = node.agentId ? await store.getAgent(node.agentId) : null;
  if (!agent) {
    throw new Error(`Agent inexistant "${String(node.agentId)}" pour le bloc "${node.id}".`);
  }
  const adapter = adapters.find((a) => a.cliId === agent.cliId);
  if (!adapter) {
    throw new Error(`Adapter CLI "${agent.cliId}" introuvable ou non disponible.`);
  }
  const profile = agent.profilId ? await store.getProfil(agent.profilId) : null;
  const prompt = node.promptId ? await store.getPrompt(node.promptId) : null;
  const exitCondition = node.exitId ? await store.getExitCondition(node.exitId) : null;
  return { agent, adapter, profile, prompt, exitCondition };
}

/** Segment d'ordre de sortie : chaîne vide si la ressource exit est absente. */
function exitSegment(content: string | undefined) {
  if (content === undefined) {
    return '';
  }
  return content;
}

/**
 * Résout les ressources et prépare les options de commande pour l'exécution d'un bloc.
 *
 * @param params Paramètres de préparation
 */
export async function prepareRunContext(params: PrepareRunContextParams) {
  const res = await resolveRunResources(params.node, params.resourceStore, params.adapters);
  const needed = updateInjectionState(
    params.policyInjectionState,
    res.agent.id,
    res.profile?.policy,
  );
  const systemPrompt = needed && res.profile?.systemPrompt ? res.profile.systemPrompt : '';
  const assembled = assemblePrompt(
    systemPrompt,
    res.prompt?.content ?? '',
    exitSegment(res.exitCondition?.content),
  );
  logAgentPromptGenerated(res.agent.id, res.prompt?.name ?? 'défaut');
  const sessionId = await params.sessions.resolve(res.agent.id, res.adapter, params.workspacePath);
  const effectiveModel = res.agent.model ?? res.profile?.model;
  const commandSpec = res.adapter.buildCommand({
    agentId: res.agent.id,
    assembledPrompt: assembled,
    workspacePath: params.workspacePath,
    sessionId,
    ...(effectiveModel ? { model: effectiveModel } : {}),
  });
  return {
    adapter: res.adapter,
    commandSpec,
    agentId: res.agent.id,
  };
}

/**
 * Construit le callback `onActiveHandle` maintenant l'ensemble des processus actifs d'un runner
 * (plusieurs branches peuvent exécuter un Run en parallèle).
 * Un handle enregistré alors que le runner est déjà arrêté est stoppé immédiatement.
 *
 * @param activeHandles Ensemble mutable des processus en cours
 * @param isHalted Indique si le runner est arrêté (Stop manuel ou échec)
 */
export function trackActiveHandle(activeHandles: Set<SpawnAgentHandle>, isHalted: () => boolean) {
  let ownHandle: SpawnAgentHandle | null = null;
  return (handle: SpawnAgentHandle | null) => {
    if (handle) {
      if (isHalted()) {
        handle.stop();
        return;
      }
      ownHandle = handle;
      activeHandles.add(handle);
    } else if (ownHandle) {
      activeHandles.delete(ownHandle);
    }
  };
}

/**
 * Lance le sous-processus CLI et attend sa fin naturelle.
 *
 * @param params Paramètres d'exécution
 * @returns Texte CLI accumulé (payload émis par le bloc Run)
 */
export function executeRunnerSpawn(params: ExecuteSpawnParams) {
  if (params.isStopped()) {
    return Promise.resolve('');
  }
  const spawnStartMs = Date.now();
  logAgentProcessStarted(params.node.id, 0);
  return new Promise<string>((resolve, reject) => {
    const { onChunk, onExit } = createRunnerSpawnHandlers({
      params,
      spawnStartMs,
      resolve,
      reject,
    });
    const handle = spawnAgent({
      command: params.commandSpec.command,
      args: params.commandSpec.args,
      cwd: params.commandSpec.cwd,
      env: params.commandSpec.env,
      onChunk,
      onExit,
    });
    params.onActiveHandle(handle);
  });
}
