/**
 * Traces de diagnostic approfondi pour les flux d'entrées/sorties des agents.
 * @module utils/logger/events/debug/agent
 */

import { createLogger } from '../../logger.factory.js';

const agentDebugLog = createLogger('agent', 'stream');

/**
 * Consigne la réception d'un tronçon brut de données sur stdout ou stderr.
 *
 * @param nodeId - Identifiant du bloc de scénario.
 * @param streamType - Type de flux ('stdout' ou 'stderr').
 * @param byteLength - Nombre d'octets reçus.
 */
export function logAgentStreamChunkTrace(nodeId: string, streamType: string, byteLength: number) {
  agentDebugLog.debug(`Tronçon reçu sur ${streamType} pour le bloc "${nodeId}" (${byteLength}o)`, {
    tags: ['debug', 'chunk'],
    data: { nodeId, streamType, byteLength },
  });
}
