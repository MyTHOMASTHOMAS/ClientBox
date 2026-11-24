/**
 * Découverte et autocomplétion des modèles d'IA pour formulaire agent (SPEC-UI-01 / CR-003).
 */

import type { AutocompleteSuggestion } from './autocomplete.helper.js';

/** Modèles de secours par défaut si l'API REST est indisponible. */
export const DEFAULT_MODEL_SUGGESTIONS: readonly string[] = [];

async function fetchRemoteModels(cliId?: string) {
  if (typeof globalThis.fetch !== 'function') return null;
  try {
    const url =
      cliId && cliId.trim() !== ''
        ? `/api/models?cliId=${encodeURIComponent(cliId.trim())}`
        : '/api/models';
    const res = await globalThis.fetch(url);
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return Array.isArray(data) && data.length > 0 ? (data as readonly string[]) : null;
  } catch {
    return null;
  }
}

/**
 * Fabrique une fonction de recherche de modèles interrogeant /api/models avec filtrage par CLI.
 *
 * @param getCliId Fonction de résolution ou identifiant du CLI cible
 * @param fallbackModels Liste optionnelle de modèles de secours
 */
export function createModelSearch(
  getCliId?: string | (() => string | undefined),
  fallbackModels: readonly string[] = DEFAULT_MODEL_SUGGESTIONS,
) {
  return async (query: string) => {
    const cliId = typeof getCliId === 'function' ? getCliId() : getCliId;
    const remote = await fetchRemoteModels(cliId);
    const models = remote ?? fallbackModels;
    const q = query.trim().toLowerCase();
    const results: readonly AutocompleteSuggestion[] = models
      .filter((m) => !q || m.toLowerCase().includes(q))
      .map((m) => ({
        value: m,
        label: m,
        badge: 'Modèle',
      }));
    return results;
  };
}
