/**
 * Client EventSource pour le streaming temps réel SSE des exécutions de scénarios.
 */

import type { AgentStreamEvent } from '../../types/contracts/cli-adapter.contract.js';

/**
 * Handle de gestion de la connexion client SSE.
 */
export interface SseClientHandle {
  readonly close: () => void;
  readonly isConnected: () => boolean;
}

/**
 * Callback de réception d'événement streamé.
 */
export type StreamEventCallback = (event: AgentStreamEvent) => void;

/**
 * Callback de capture d'erreur réseau de flux SSE.
 */
export type StreamErrorCallback = (error: unknown) => void;

function parseStreamPayload(rawData: string) {
  try {
    const parsed = JSON.parse(rawData);
    if (parsed && typeof parsed.type === 'string') {
      return parsed as AgentStreamEvent;
    }
  } catch {
    // Si données brutes non JSON, repli sur chunk stdout standard
  }
  return { type: 'stdout', chunk: rawData } as AgentStreamEvent;
}

/**
 * Initialise un client SSE pour écouter le flux d'exécution d'un scénario.
 * @param url URL de l'endpoint SSE
 * @param onEvent Callback appelé pour chaque chunk ou événement reçu
 * @param onError Callback optionnel déclenché en cas d'erreur de transport
 */
export function createSseClient(
  url: string,
  onEvent: StreamEventCallback,
  onError?: StreamErrorCallback,
) {
  let connected = false;
  const source = new globalThis.EventSource(url);

  source.onopen = () => {
    connected = true;
  };

  source.onmessage = (messageEvent: MessageEvent) => {
    const event = parseStreamPayload(messageEvent.data);
    onEvent(event);
  };

  source.onerror = (err) => {
    connected = false;
    onError?.(err);
  };

  return {
    close() {
      connected = false;
      source.close();
    },
    isConnected() {
      return connected;
    },
  };
}
