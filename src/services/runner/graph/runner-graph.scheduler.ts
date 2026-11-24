/**
 * Ordonnanceur de graphe de SVC-001 : acheminement des messages par connexion,
 * join `sum(power) === N` (R-42), mise en pause (R-42b) et exécution parallèle des branches.
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type { ScenarioNode } from '../../../types/models/node.model.js';
import type { BlockInputBag } from '../../../types/models/input-bag.model.js';
import {
  getTargetNodeId,
  listIncomingConnections,
  listOutgoingConnections,
  type GraphEmission,
} from '../../../domain/graph/graph-topology.resolver.js';
import { evaluateJoin } from '../../../domain/join/join-barrier.evaluator.js';
import { putIncomingMessage } from '../../../domain/messages/input-bag.domain.js';

/** Points d'extension fournis par le runner à l'ordonnanceur. */
export interface GraphSchedulerHooks {
  /** Exécute un bloc dont le join est satisfait ; ne doit jamais rejeter. */
  readonly processBlock: (node: ScenarioNode) => Promise<void>;
  /** Bloc ayant reçu des messages sans pouvoir démarrer (waiting ou pause). */
  readonly onBlockPaused: (nodeId: string) => void;
  /** Vrai après Stop ou erreur globale : plus aucun bloc n'est déclenché. */
  readonly isHalted: () => boolean;
}

/**
 * Ordonnanceur événementiel : un bloc n'est évalué que lorsqu'un message lui parvient,
 * jamais selon l'ordre du tableau `nodes[]`.
 */
export class GraphScheduler {
  private readonly scenario: Scenario;
  private readonly hooks: GraphSchedulerHooks;
  private readonly nodesById: ReadonlyMap<string, ScenarioNode>;
  private readonly inputBags = new Map<string, BlockInputBag>();
  private readonly runningNodes = new Set<string>();
  private readonly pendingReevaluation = new Set<string>();
  private readonly tasks = new Set<Promise<void>>();

  constructor(scenario: Scenario, hooks: GraphSchedulerHooks) {
    this.scenario = scenario;
    this.hooks = hooks;
    this.nodesById = new Map(scenario.nodes.map((node) => [node.id, node]));
  }

  /** Sac d'entrées courant d'un bloc (dernier message reçu par clé — Last-Write-Wins). */
  inputBag(nodeId: string) {
    return this.inputBags.get(nodeId) ?? {};
  }

  /** Connexions sortantes d'un bloc. */
  outgoing(nodeId: string) {
    return listOutgoingConnections(this.scenario.connections, nodeId);
  }

  /** Achemine des émissions vers leurs blocs cibles puis réévalue leur join. */
  deliver(emissions: readonly GraphEmission[]) {
    for (const { connection, message } of emissions) {
      const targetId = getTargetNodeId(connection);
      this.inputBags.set(
        targetId,
        putIncomingMessage(this.inputBag(targetId), connection.key, message),
      );
      this.evaluate(targetId);
    }
  }

  /** Attend la fin de toutes les branches, y compris celles déclenchées en cours d'attente. */
  async drain() {
    while (this.tasks.size > 0) {
      await Promise.allSettled([...this.tasks]);
    }
  }

  private evaluate(nodeId: string) {
    const node = this.nodesById.get(nodeId);
    if (this.hooks.isHalted() || !node || node.type === 'start') return;
    if (this.runningNodes.has(nodeId)) {
      this.pendingReevaluation.add(nodeId);
      return;
    }
    const incoming = listIncomingConnections(this.scenario.connections, nodeId);
    if (evaluateJoin(this.inputBag(nodeId), incoming) !== 'trigger') {
      this.hooks.onBlockPaused(nodeId);
      return;
    }
    this.launch(node);
  }

  private launch(node: ScenarioNode) {
    this.runningNodes.add(node.id);
    const task: Promise<void> = this.hooks.processBlock(node).finally(() => {
      this.runningNodes.delete(node.id);
      this.tasks.delete(task);
      if (this.pendingReevaluation.delete(node.id)) this.evaluate(node.id);
    });
    this.tasks.add(task);
  }
}
