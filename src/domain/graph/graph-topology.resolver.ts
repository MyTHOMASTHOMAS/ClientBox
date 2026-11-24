/**
 * Résolution pure des connexions entrantes / sortantes d'un nœud pour le scheduler SVC-001.
 * Ports de sortie If : index 0 = branche vraie, index 1 = branche fausse (R-15).
 */

import type { Connection } from '../../types/models/connection.model.js';
import type { BlockMessage } from '../../types/messages/block-message.message.js';

/** Index du port de sortie correspondant à la branche fausse d'un bloc If. */
export const IF_FALSE_PORT_INDEX = 1;

/** Message à acheminer le long d'une connexion précise. */
export interface GraphEmission {
  readonly connection: Connection;
  readonly message: BlockMessage;
}

/**
 * Émet le même message sur toutes les connexions sortantes fournies (fan-out).
 *
 * @param outgoing Connexions sortantes du bloc émetteur
 * @param message Message à émettre
 */
export function broadcastMessage(outgoing: readonly Connection[], message: BlockMessage) {
  return outgoing.map((connection): GraphEmission => ({ connection, message }));
}

/**
 * Identifiant du nœud source d'une connexion (champs canoniques ou hérités).
 *
 * @param connection Connexion à lire
 */
export function getSourceNodeId(connection: Connection) {
  return connection.sourceNodeId || connection.from || '';
}

/**
 * Identifiant du nœud cible d'une connexion (champs canoniques ou hérités).
 *
 * @param connection Connexion à lire
 */
export function getTargetNodeId(connection: Connection) {
  return connection.targetNodeId || connection.to || '';
}

/**
 * Liste les connexions entrantes d'un nœud (N du join).
 *
 * @param connections Connexions du scénario
 * @param nodeId Nœud cible
 */
export function listIncomingConnections(connections: readonly Connection[], nodeId: string) {
  return connections.filter((connection) => getTargetNodeId(connection) === nodeId);
}

/**
 * Liste les connexions sortantes d'un nœud.
 *
 * @param connections Connexions du scénario
 * @param nodeId Nœud source
 */
export function listOutgoingConnections(connections: readonly Connection[], nodeId: string) {
  return connections.filter((connection) => getSourceNodeId(connection) === nodeId);
}

/**
 * Indique si une connexion sortante d'un bloc If appartient à la branche fausse.
 *
 * @param connection Connexion sortante du bloc If
 */
export function isIfFalseBranch(connection: Connection) {
  return connection.sourcePortIndex === IF_FALSE_PORT_INDEX || connection.outputPort === 'false';
}
