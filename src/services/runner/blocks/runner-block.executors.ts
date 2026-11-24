/**
 * Exécution des blocs Run, If, ClearContext et CallScenario pour ScenarioRunnerService (SPEC-ENG-03).
 */

import type { CLIAdapter } from '../../../types/contracts/cli-adapter.contract.js';
import type { Connection } from '../../../types/models/connection.model.js';
import type { ScenarioNode } from '../../../types/models/node.model.js';
import type { BlockInputBag } from '../../../types/models/input-bag.model.js';
import type { ResourceStoreService } from '../../resources/resource-store.service.js';
import {
  broadcastMessage,
  isIfFalseBranch,
  type GraphEmission,
} from '../../../domain/graph/graph-topology.resolver.js';
import { buildBlockMessage } from '../../../domain/messages/block-message.factory.js';
import { distributeIfPower } from '../../../domain/messages/if-branch-power.dispatcher.js';
import { loadIfScript, runIfScript } from '../../../lib/fs/dynamic-module-loader.fs.js';
import { prepareRunContext, type PreparedRunContext } from '../process/runner-process.spawner.js';
import type { ScenarioSessionRegistry } from '../session/runner-session.registry.js';

/** Environnement complet d'exécution d'un bloc déclenché par le scheduler. */
export interface BlockExecutionEnv {
  readonly resourceStore: ResourceStoreService;
  readonly adapters: readonly CLIAdapter[];
  readonly workspacePath: string;
  readonly sac: BlockInputBag;
  readonly outgoing: readonly Connection[];
  readonly policyInjectionState: Map<string, boolean>;
  readonly sessions: ScenarioSessionRegistry;
  readonly spawn: (node: ScenarioNode, ctx: PreparedRunContext) => Promise<string>;
  /** Identifiant du scénario porté par ce runner (CallScenario / logs). */
  readonly scenarioId?: string;
  /** Lance et attend un sous-scénario (ADR-018). */
  readonly runCallScenario?: (targetScenarioId: string) => Promise<void>;
}

/**
 * Exécute un bloc CallScenario : await sous-scénario puis émission power 1 (R-46 / REQ-039).
 * Auto-appel autorisé (REQ-041) ; borne de profondeur gérée par le helper nested.
 *
 * @param node Bloc CallScenario
 * @param env Environnement d'exécution
 */
export async function executeCallScenarioBlock(node: ScenarioNode, env: BlockExecutionEnv) {
  const target = typeof node.targetScenarioId === 'string' ? node.targetScenarioId.trim() : '';
  if (!target) {
    throw new Error(`CallScenario "${node.id}" : targetScenarioId vide ou manquant (REQ-041)`);
  }
  if (!env.runCallScenario) {
    throw new Error(`CallScenario "${node.id}" : sous-runner non disponible`);
  }
  await env.runCallScenario(target);
  return broadcastMessage(env.outgoing, buildBlockMessage('callScenario', null, 1));
}

/**
 * Charge le script If du bloc et l'évalue sur le sac d'entrées complet (R-14).
 * Toute erreur (script absent, syntaxe, exception runtime) est requalifiée en message français.
 *
 * @param node Bloc If
 * @param sac Sac d'entrées du bloc
 * @param resourceStore Store pour résoudre le chemin du script
 * @returns Résultat booléen de la condition
 */
export async function evaluateIfBlock(
  node: ScenarioNode,
  sac: BlockInputBag,
  resourceStore: ResourceStoreService,
) {
  try {
    if (!node.ifScriptId) {
      throw new Error(`aucun script configuré pour le bloc "${node.id}"`);
    }
    const ifFn = await loadIfScript(resourceStore.resolveIfScriptPath(node.ifScriptId));
    return runIfScript(ifFn, sac);
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Erreur lors de l'exécution du script If : ${detail}`, { cause: err });
  }
}

/**
 * Efface la mémoire de l'agent du bloc (R-39) : sa session de scénario est oubliée,
 * son prochain Run en ouvrira une nouvelle, et l'injection `une_fois_jusqu_a_clear` est réarmée.
 * Aucune commande CLI n'est lancée ; un Run en cours de cet agent n'est pas affecté.
 *
 * @param node Bloc ClearContext
 * @param env Environnement d'exécution
 */
export function clearAgentContext(node: ScenarioNode, env: BlockExecutionEnv) {
  if (!node.agentId) {
    throw new Error(`Agent non configuré pour le bloc ClearContext "${node.id}".`);
  }
  env.sessions.forget(node.agentId);
  env.policyInjectionState.set(node.agentId, false);
}

/**
 * Répartit la puissance If sur les connexions sortantes : port 0 = vrai, port 1 = faux (R-15).
 *
 * @param isConditionMet Résultat du script If
 * @param outgoing Connexions sortantes du bloc If
 */
export function dispatchIfEmissions(isConditionMet: boolean, outgoing: readonly Connection[]) {
  const truePorts: string[] = [];
  const falsePorts: string[] = [];
  outgoing.forEach((connection, index) => {
    (isIfFalseBranch(connection) ? falsePorts : truePorts).push(String(index));
  });
  return distributeIfPower(isConditionMet, truePorts, falsePorts).map(
    (emission): GraphEmission => ({
      connection: outgoing[Number(emission.portId)] as Connection,
      message: emission.message,
    }),
  );
}

/**
 * Exécute un bloc dont le join est satisfait et retourne les émissions à acheminer.
 *
 * @param node Bloc à exécuter
 * @param env Environnement d'exécution
 */
export async function executeGraphBlock(node: ScenarioNode, env: BlockExecutionEnv) {
  if (node.type === 'run') {
    const ctx = await prepareRunContext({ node, ...env });
    const output = await env.spawn(node, ctx);
    return broadcastMessage(env.outgoing, buildBlockMessage('run', output ?? '', 1));
  }
  if (node.type === 'if') {
    return dispatchIfEmissions(
      await evaluateIfBlock(node, env.sac, env.resourceStore),
      env.outgoing,
    );
  }
  if (node.type === 'clearContext') {
    clearAgentContext(node, env);
    return broadcastMessage(env.outgoing, buildBlockMessage('clearContext', null, 1));
  }
  if (node.type === 'callScenario') {
    return executeCallScenarioBlock(node, env);
  }
  return [];
}
