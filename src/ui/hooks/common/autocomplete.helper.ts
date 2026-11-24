/**
 * Fonctions utilitaires, types et moteur de navigation pour le composant AutocompleteInput.
 */

/** Suggestion fournie par la fonction de recherche d'autocomplétion. */
export interface AutocompleteSuggestion {
  readonly value: string;
  readonly label?: string;
  readonly description?: string;
  readonly badge?: string;
}

/** Événement clavier synthétique pour la navigation d'autocomplétion. */
export interface AutocompleteKeyEvent {
  readonly key: string;
  readonly preventDefault?: () => void;
  readonly stopPropagation?: () => void;
}

/** État de navigation au clavier de l'autocomplétion. */
export interface AutocompleteKeyboardState {
  readonly isOpen: boolean;
  readonly highlightedIndex: number;
  readonly suggestions: readonly AutocompleteSuggestion[];
  readonly value: string;
}

/** Propriétés du champ d'autocomplétion générique libre. */
export interface AutocompleteInputProps {
  readonly id?: string;
  readonly name?: string;
  readonly label?: string;
  readonly value?: string;
  readonly placeholder?: string;
  readonly disabled?: true | false;
  readonly readOnly?: true | false;
  readonly className?: string;
  readonly dataAction?: string;
  readonly search: (
    query: string,
  ) => Promise<readonly AutocompleteSuggestion[]> | readonly AutocompleteSuggestion[];
  readonly onChange?: (val: string) => void;
  readonly onSelect?: (suggestion: AutocompleteSuggestion) => void;
  readonly debounceMs?: number;
  readonly minChars?: number;
  readonly isOpen?: boolean;
  readonly suggestions?: readonly AutocompleteSuggestion[];
  readonly highlightedIndex?: number;
}

/**
 * Calcule le prochain index de surbrillance lors de la navigation clavier.
 * @param key Touche pressée (ArrowDown ou ArrowUp)
 * @param current Index actuel en surbrillance
 * @param total Nombre total de suggestions disponibles
 */
export function stepHighlight(key: string, current: number, total: number) {
  if (total <= 0) return -1;
  return key === 'ArrowDown' ? (current + 1) % total : current <= 0 ? total - 1 : current - 1;
}

/**
 * Résout l'état combiné effectif du champ en respectant les priorités contrôlées/non contrôlées.
 * @param props Propriétés du composant d'autocomplétion
 * @param internal État interne du composant
 */
export function resolveInputState(
  props: AutocompleteInputProps,
  internal: { val: string; isOpen: boolean; sug: readonly AutocompleteSuggestion[]; idx: number },
) {
  const isLocked = Boolean(props.disabled || props.readOnly);
  const effValue = props.value !== undefined ? props.value : internal.val;
  const effOpen = !isLocked && (props.isOpen !== undefined ? props.isOpen : internal.isOpen);
  const effSuggestions = props.suggestions !== undefined ? props.suggestions : internal.sug;
  const effHighlighted =
    props.highlightedIndex !== undefined ? props.highlightedIndex : internal.idx;
  return {
    isLocked,
    effValue,
    effOpen,
    effSuggestions,
    effHighlighted,
    showDropdown: Boolean(effOpen && effSuggestions.length > 0),
  };
}

/**
 * Fabrique une fonction de recherche pour un endpoint de ressource REST standard.
 * @param endpoint URL de l'API (ex: /api/agents)
 * @param badge Libellé du badge de suggestion
 */
export function createResourceSearch(endpoint: string, badge: string) {
  return async (query: string) => {
    if (typeof globalThis.fetch !== 'function') return [];
    try {
      const res = await globalThis.fetch(endpoint);
      if (!res.ok) return [];
      const items = (await res.json()) as Array<{
        id: string;
        name?: string;
        description?: string;
      }>;
      const q = query.trim().toLowerCase();
      return items
        .filter(
          (i) =>
            !q || i.id.toLowerCase().includes(q) || (i.name && i.name.toLowerCase().includes(q)),
        )
        .map((i) => ({
          value: i.id,
          label: i.name ? `${i.name} (${i.id})` : i.id,
          description: i.description,
          badge,
        }));
    } catch {
      return [];
    }
  };
}

/**
 * Exécute une recherche de suggestions d'autocomplétion synchrone ou asynchrone.
 * @param query Texte recherché
 * @param searchFn Fonction de recherche modulaire injectée
 * @param minChars Seuil minimal de caractères pour déclencher la recherche (défaut: 0)
 */
export async function executeAutocompleteSearch(
  query: string,
  searchFn: (
    q: string,
  ) => Promise<readonly AutocompleteSuggestion[]> | readonly AutocompleteSuggestion[],
  minChars = 0,
) {
  if (query.length < minChars) return [];
  const result = searchFn(query);
  return typeof (result as Promise<readonly AutocompleteSuggestion[]>).then === 'function'
    ? await (result as Promise<readonly AutocompleteSuggestion[]>)
    : (result as readonly AutocompleteSuggestion[]);
}

/**
 * Gère les interactions clavier standards sur un champ d'autocomplétion libre.
 * @param event Événement clavier avec touches et méthodes d'annulation
 * @param state État courant de la navigation
 * @param handlers Handlers optionnels de sélection et fermeture
 */
export function handleAutocompleteKeyDown(
  event: AutocompleteKeyEvent,
  state: AutocompleteKeyboardState,
  ...handlers: [((s: AutocompleteSuggestion) => void)?, (() => void)?]
) {
  const [onSelect, onClose] = handlers;
  const { suggestions, highlightedIndex, isOpen } = state;

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault?.();
    return {
      ...state,
      isOpen: true,
      highlightedIndex: stepHighlight(event.key, highlightedIndex, suggestions.length),
    };
  }
  if (event.key === 'Enter') {
    const isTargetValid = isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length;
    if (isTargetValid) {
      event.preventDefault?.();
      const chosen = suggestions[highlightedIndex]!;
      onSelect?.(chosen);
      return { ...state, isOpen: false, highlightedIndex: -1, value: chosen.value };
    }
  }
  if (event.key === 'Escape' && isOpen) {
    event.stopPropagation?.();
    onClose?.();
    return { ...state, isOpen: false, highlightedIndex: -1 };
  }
  return state;
}
