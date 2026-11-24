/**
 * Exécuteur du bloc Command (commande shell native OS, power 1 / value null per ADR-019 / SPEC-ENG-03 / SPEC-ENG-04).
 */

import type { Connection } from '../../../types/models/connection.model.js';
import type { ScenarioNode } from '../../../types/models/node.model.js';
import {
  broadcastMessage,
  type GraphEmission,
} from '../../../domain/graph/graph-topology.resolver.js';
import { buildBlockMessage } from '../../../domain/messages/block-message.factory.js';
import { spawnNativeCommand } from '../../../lib/process/command-shell.spawner.js';
import type { ActiveProcessBag } from '../process/runner-active-processes.js';

/** Dépendances pour l'exécution d'un bloc Command. */
export interface CommandExecutionEnv {
  readonly workspacePath: string;
  readonly outgoing: readonly Connection[];
  readonly isHalted: () => boolean;
  readonly processBag: ActiveProcessBag;
}

function validateCommandLine(node: ScenarioNode) {
  const raw = node.commandLine;
  const cmd = typeof raw === 'string' ? raw.trim() : '';
  if (!cmd) {
    throw new Error(`Command "${node.id}" : commandLine vide ou manquant (REQ-043)`);
  }
  return cmd;
}

/**
 * Exécute un bloc Command en lançant la commande shell native dans le workspace.
 *
 * @param node Nœud Command
 * @param env Dépendances d'exécution
 * @returns Émissions graphe avec message power 1 et value null
 */
export function executeCommandBlock(node: ScenarioNode, env: CommandExecutionEnv) {
  const command = validateCommandLine(node);
  if (env.isHalted()) return Promise.resolve<readonly GraphEmission[]>([]);

  return new Promise<readonly GraphEmission[]>((resolve, reject) => {
    const handle = spawnNativeCommand({
      command,
      cwd: env.workspacePath,
      onChunk: (chunk, stream) => {
        env.processBag.emitChunk(node.id, chunk, stream, undefined);
      },
      onExit: (code, err) => {
        env.processBag.activeSpawnHandles.delete(handle);
        if (err) {
          reject(err);
        } else if (env.isHalted()) {
          resolve([]);
        } else if (code === 0) {
          resolve(broadcastMessage(env.outgoing, buildBlockMessage('command', null, 1)));
        } else {
          reject(new Error(`Command "${node.id}" a échoué avec le code de sortie ${String(code)}`));
        }
      },
    });

    env.processBag.activeSpawnHandles.add(handle);
  });
}
