/**
 * Client HTTP REST typé pour navigateur avec normalisation des erreurs en français.
 */

/** Callbacks de notification pour les abonnements aux flux SSE. */
export interface StreamSubscriptionCallbacks {
  readonly onStdout?: (chunk: string) => void;
  readonly onStderr?: (chunk: string) => void;
  readonly onBlockStatus?: (status: unknown) => void;
  readonly onStatusChange?: (status: string) => void;
  readonly onError?: (error: unknown) => void;
}

/** Fonction de désabonnement à un flux d'exécution. */
export type UnsubscribeFn = () => void;

/** Contrat d'interface du client HTTP navigateur pour l'UI. */
export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body?: unknown): Promise<T>;
  put<T>(url: string, body?: unknown): Promise<T>;
  del<T>(url: string): Promise<T>;
  subscribeStream?(url: string, callbacks: StreamSubscriptionCallbacks): UnsubscribeFn;
  connectSse?(url: string): { close: () => void };
}

function normalizeErrorMessage(status: number, serverMsg?: string) {
  if (serverMsg && serverMsg.trim().length > 0) return serverMsg;
  if (status === 404) return "Ressource introuvable. L'élément demandé n'existe pas.";
  if (status === 503)
    return 'Service temporairement indisponible. Veuillez réessayer ultérieurement.';
  if (status === 409) return 'Conflit : une ressource identique ou liée existe déjà.';
  if (status >= 500) return 'Erreur interne du serveur local. Opération interrompue.';
  return `Erreur réseau ou requête invalide (code HTTP ${status}).`;
}

function normalizeUrl(url: string) {
  if (url.startsWith('/api/profiles')) {
    return url.replace('/api/profiles', '/api/profils');
  }
  return url;
}

async function executeRequest<T>(url: string, options: RequestInit) {
  let response: Response;
  const targetUrl = normalizeUrl(url);
  try {
    response = await globalThis.fetch(targetUrl, options);
  } catch {
    throw new Error('Service temporairement indisponible. Erreur de connexion réseau.');
  }
  if (!response.ok) {
    let errorMsg: string | undefined;
    try {
      const data = (await response.json()) as { message?: string; error?: string };
      errorMsg = data?.message || data?.error;
    } catch {
      // Pas de corps JSON, utilisation du fallback normalisé
    }
    throw new Error(normalizeErrorMessage(response.status, errorMsg));
  }
  return response.json() as Promise<T>;
}

interface EventSourceInstance {
  close: () => void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((err: unknown) => void) | null;
}

function instantiateEventSource(url: string) {
  const globalObj = globalThis as { EventSource?: new (u: string) => EventSourceInstance };
  const ctor = globalObj.EventSource;
  if (typeof ctor === 'function') {
    try {
      return new ctor(url);
    } catch {
      return (ctor as unknown as (u: string) => EventSourceInstance)(url);
    }
  }
  throw new Error('EventSource non disponible dans cet environnement.');
}

function dispatchStreamPayload(
  payload: Record<string, unknown>,
  callbacks: StreamSubscriptionCallbacks,
) {
  const stream = payload.stream || payload.type;
  const chunk = typeof payload.chunk === 'string' ? payload.chunk : '';
  if (stream === 'stdout') callbacks.onStdout?.(chunk);
  if (stream === 'stderr') callbacks.onStderr?.(chunk);
  if (payload.nodeId !== undefined) {
    callbacks.onBlockStatus?.(payload);
  } else if (payload.status) {
    callbacks.onStatusChange?.(String(payload.status));
  }
  if (payload.message && payload.status === 'stopped') {
    callbacks.onStderr?.(`[Arrêt] ${payload.message}\n`);
  }
}

function handleStreamSubscription(url: string, callbacks: StreamSubscriptionCallbacks) {
  const source = instantiateEventSource(url);
  source.onmessage = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data);
      dispatchStreamPayload(payload, callbacks);
    } catch (err: unknown) {
      void err;
      callbacks.onStdout?.(event.data);
    }
  };
  source.onerror = (err: unknown) => callbacks.onError?.(err);
  return () => source.close();
}

/**
 * Fabrique d'instanciation du client HTTP navigateur pour les opérations CRUD et le streaming.
 */
export function createHttpClient() {
  return {
    async get<T>(url: string) {
      return executeRequest<T>(url, { method: 'GET' });
    },
    async post<T>(url: string, body?: unknown) {
      return executeRequest<T>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    },
    async put<T>(url: string, body?: unknown) {
      return executeRequest<T>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    },
    async del<T>(url: string) {
      return executeRequest<T>(url, { method: 'DELETE' });
    },
    subscribeStream(url: string, callbacks: StreamSubscriptionCallbacks) {
      return handleStreamSubscription(url, callbacks);
    },
    connectSse(url: string) {
      const source = instantiateEventSource(url);
      return { close: () => source.close() };
    },
  };
}
