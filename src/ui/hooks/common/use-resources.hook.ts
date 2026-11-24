/**
 * Hook générique de gestion d'état et opérations CRUD asynchrones pour les ressources UI.
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import type { HttpClient } from '../../api/http.client.js';
import { createHttpClient } from '../../api/http.client.js';
import type { ResourceKind } from '../../types/ui.types.js';

/**
 * Extrait le contenu texte significatif d'un objet ressource brut.
 * @param raw Données brutes de la ressource
 */
export function resolveResourceText(raw: Record<string, unknown>) {
  if (typeof raw.template === 'string') return raw.template;
  if (typeof raw.pattern === 'string') return raw.pattern;
  if (typeof raw.content === 'string') return raw.content;
  return typeof raw.type === 'string' ? raw.type : '';
}

/**
 * Normalise un élément brut d'API en élément typé ResourceItem.
 * @param d Donnée brute reçue de l'API
 * @param kind Type de la ressource (prompts, exits, scripts)
 */
export function formatResourceRaw(d: unknown, kind: ResourceKind) {
  if (typeof d === 'string') return { id: d, name: `${d}.js`, content: '', kind };
  const raw = d as Record<string, unknown>;
  const id = String(raw.id || '');
  return { id, name: String(raw.name || id), content: resolveResourceText(raw), kind };
}

/**
 * Génère un identifiant slugifié à partir d'un nom de ressource.
 * @param name Nom source à slugifier
 */
export function slugifyId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Construit la charge utile JSON pour les créations/mises à jour de ressources.
 * @param opts Paramètres de mutation de la ressource
 */
export function buildMutationPayload(opts: {
  kind: ResourceKind;
  id: string;
  name: string;
  content: string;
}) {
  return { id: opts.id, name: opts.name, content: opts.content };
}

async function performCrudMutation(
  action: () => Promise<unknown>,
  onSuccess: () => Promise<void>,
  onError: (msg?: string) => void,
) {
  try {
    await action();
    await onSuccess();
    return true;
  } catch (err: unknown) {
    onError(err instanceof Error ? err.message : String(err));
    return false;
  }
}

interface ResourceMutationsOptions {
  readonly http: HttpClient;
  readonly endpoint: string;
  readonly reload: () => Promise<void>;
  readonly setError: (msg?: string) => void;
}

function useResourceMutations<T extends { id: string }>(options: ResourceMutationsOptions) {
  const { http, endpoint, reload, setError } = options;
  const createItem = useCallback(
    (item: T) => performCrudMutation(() => http.post(endpoint, item), reload, setError),
    [endpoint, http, reload, setError],
  );
  const updateItem = useCallback(
    (id: string, item: Partial<T>) =>
      performCrudMutation(() => http.put(`${endpoint}/${id}`, item), reload, setError),
    [endpoint, http, reload, setError],
  );
  const removeItem = useCallback(
    (id: string) => performCrudMutation(() => http.del(`${endpoint}/${id}`), reload, setError),
    [endpoint, http, reload, setError],
  );
  return { createItem, updateItem, removeItem };
}

/**
 * Hook de chargement et de synchronisation CRUD d'une collection d'entités via l'API REST.
 * @param endpoint Chemin d'accès de la ressource API
 * @param client Client HTTP optionnel
 */
export function useResources<T extends { id: string }>(endpoint: string, client?: HttpClient) {
  const http = client ?? createHttpClient();
  const [items, setItems] = useState<readonly T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const data = await http.get<T[]>(endpoint);
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données.');
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, http]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const { createItem, updateItem, removeItem } = useResourceMutations<T>({
    http,
    endpoint,
    reload,
    setError,
  });

  return { items, isLoading, error, reload, createItem, updateItem, removeItem };
}
