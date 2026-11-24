import { describe, it, expect, vi } from 'vitest';
import { h } from 'preact';

import {
  AutocompleteInput,
  type AutocompleteSuggestion,
  type AutocompleteInputProps,
  executeAutocompleteSearch,
  handleAutocompleteKeyDown,
} from '../../../src/ui/components/common/autocomplete-input.js';

/**
 * Fonction utilitaire récursive pour trouver un VNode possédant une propriété donnée.
 */
function findVNode(vnode: any, predicate: (vnode: any) => boolean): any {
  if (!vnode || typeof vnode !== 'object') return null;
  if (predicate(vnode)) return vnode;
  const children = Array.isArray(vnode.props?.children)
    ? vnode.props.children
    : vnode.props?.children
      ? [vnode.props.children]
      : [];
  for (const child of children) {
    const found = findVNode(child, predicate);
    if (found) return found;
  }
  return null;
}

/**
 * Recherche d'un VNode par attribut et valeur.
 */
function findVNodeByAttr(vnode: any, attr: string, value?: string): any {
  return findVNode(vnode, (v) => {
    if (!v.props) return false;
    if (value === undefined) return attr in v.props;
    return v.props[attr] === value;
  });
}

/**
 * Recherche d'un VNode par type de balise HTML.
 */
function findVNodeByTag(vnode: any, tag: string): any {
  return findVNode(vnode, (v) => v.type === tag);
}

describe("CASE-UI-01-13 — Composant générique d'autocomplétion libre à recherche modulaire locale/distante (SPEC-UI-01 / AC-UI-01-5)", () => {
  it('test_CASE_UI_01_13_autocomplete_generic_input_modular_search_and_freeform', async () => {
    const sampleSuggestions: readonly AutocompleteSuggestion[] = [
      {
        value: 'agent-codeur',
        label: 'Agent Codeur',
        badge: 'dev',
        description: 'Génère et modifie le code',
      },
      {
        value: 'agent-architecte',
        label: 'Agent Architecte',
        badge: 'archi',
        description: 'Conçoit la structure système',
      },
      {
        value: 'agent-testeur',
        label: 'Agent Testeur',
        badge: 'qa',
        description: 'Valide les scénarios et exigences',
      },
    ];

    const localSearch = (query: string): readonly AutocompleteSuggestion[] => {
      const q = query.trim().toLowerCase();
      if (!q) return sampleSuggestions;
      return sampleSuggestions.filter(
        (s) => s.value.toLowerCase().includes(q) || (s.label && s.label.toLowerCase().includes(q)),
      );
    };

    // 1. Rendu initial : label, placeholder, value et sélecteurs de base
    const initialProps: AutocompleteInputProps = {
      id: 'input-agent',
      name: 'agentId',
      label: 'Identifiant Agent',
      value: 'agent-1',
      placeholder: 'Saisir ou sélectionner un agent...',
      dataAction: 'select-agent',
      search: localSearch,
    };

    const initialVNode = (AutocompleteInput as any)(initialProps);
    const initialJson = JSON.stringify(initialVNode);

    expect(initialJson).toMatch(/data-component":"autocomplete-input"/);
    expect(initialJson).toMatch(/Identifiant Agent/);
    expect(initialJson).toMatch(/Saisir ou sélectionner un agent\.\.\./);
    expect(initialJson).toMatch(/agent-1/);

    const inputElement = findVNodeByTag(initialVNode, 'input');
    expect(inputElement).toBeDefined();
    expect(inputElement.props.id).toBe('input-agent');
    expect(inputElement.props.name).toBe('agentId');
    expect(inputElement.props.value).toBe('agent-1');
    expect(inputElement.props.role).toBe('combobox');
    expect(inputElement.props['aria-autocomplete']).toBe('list');
    expect(inputElement.props['data-action']).toBe('select-agent');

    // Déclenchement automatique dès la prise de focus ou le clic (chargement suggestions sans saisie préalable)
    expect(typeof inputElement.props.onFocus).toBe('function');
    expect(typeof inputElement.props.onClick).toBe('function');
    expect(typeof inputElement.props.onBlur).toBe('function');

    const focusSearchSpy = vi.fn(localSearch);
    const focusProps: AutocompleteInputProps = {
      ...initialProps,
      search: focusSearchSpy,
    };
    const focusVNode = (AutocompleteInput as any)(focusProps);
    const focusInput = findVNodeByTag(focusVNode, 'input');
    await focusInput.props.onFocus?.();
    expect(focusSearchSpy).toHaveBeenCalledWith('');

    // Respect strict d'une valeur contrôlée vide
    const emptyControlledProps: AutocompleteInputProps = {
      ...initialProps,
      value: '',
    };
    const emptyControlledVNode = (AutocompleteInput as any)(emptyControlledProps);
    const emptyControlledInput = findVNodeByTag(emptyControlledVNode, 'input');
    expect(emptyControlledInput.props.value).toBe('');

    // Dropdown fermé initialement
    expect(initialJson).not.toMatch(/data-section":"autocomplete-dropdown"/);

    // 2. Recherche modulaire synchrone & affichage du menu déroulant
    const syncSearchResults = await executeAutocompleteSearch('code', localSearch);
    expect(syncSearchResults).toHaveLength(1);
    expect(syncSearchResults[0]?.value).toBe('agent-codeur');

    const openSyncProps: AutocompleteInputProps = {
      ...initialProps,
      value: 'code',
      isOpen: true,
      suggestions: syncSearchResults,
    };
    const openSyncVNode = (AutocompleteInput as any)(openSyncProps);
    const openSyncJson = JSON.stringify(openSyncVNode);

    expect(openSyncJson).toMatch(/data-section":"autocomplete-dropdown"/);
    expect(openSyncJson).toMatch(/data-suggestion-value":"agent-codeur"/);
    expect(openSyncJson).toMatch(/Agent Codeur/);
    expect(openSyncJson).toMatch(/Génère et modifie le code/);
    expect(openSyncJson).toMatch(/dev/);

    // 3. Recherche asynchrone (retour Promise) avec délai et protection de concurrence
    const asyncSearch = vi.fn(async (query: string): Promise<readonly AutocompleteSuggestion[]> => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return localSearch(query);
    });

    const asyncResults = await executeAutocompleteSearch('architecte', asyncSearch);
    expect(asyncSearch).toHaveBeenCalledWith('architecte');
    expect(asyncResults).toHaveLength(1);
    expect(asyncResults[0]?.value).toBe('agent-architecte');

    // 4. Pré-remplissage lors du clic sur une suggestion (sélection)
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const openWithMultipleProps: AutocompleteInputProps = {
      ...initialProps,
      isOpen: true,
      suggestions: sampleSuggestions,
      onChange,
      onSelect,
    };

    const renderedWithMultiple = (AutocompleteInput as any)(openWithMultipleProps);
    const suggestionNode = findVNodeByAttr(
      renderedWithMultiple,
      'data-suggestion-value',
      'agent-testeur',
    );
    expect(suggestionNode).toBeDefined();

    // Déclenchement de la sélection (onMouseDown ou onClick)
    const triggerSelect = suggestionNode.props.onMouseDown || suggestionNode.props.onClick;
    expect(typeof triggerSelect).toBe('function');
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    triggerSelect(mockEvent);

    expect(onChange).toHaveBeenCalledWith('agent-testeur');
    expect(onSelect).toHaveBeenCalledWith(sampleSuggestions[2]);

    // 5. Maintien strict de la saisie libre (Freeform non bloquant)
    const freeformOnChange = vi.fn();
    const freeformProps: AutocompleteInputProps = {
      ...initialProps,
      value: '',
      onChange: freeformOnChange,
    };
    const freeformVNode = (AutocompleteInput as any)(freeformProps);
    const freeformInput = findVNodeByTag(freeformVNode, 'input');
    expect(freeformInput).toBeDefined();

    // Saisie d'un identifiant arbitraire non répertorié dans les suggestions
    const customValue = 'agent-custom-hors-catalogue-99';
    freeformInput.props.onInput({
      target: { value: customValue },
      currentTarget: { value: customValue },
    });
    expect(freeformOnChange).toHaveBeenCalledWith(customValue);

    // 6. Navigation au clavier (ArrowDown, ArrowUp, Enter, Escape)
    const keySelectSpy = vi.fn();
    const keyCloseSpy = vi.fn();
    let keyboardState = {
      isOpen: true,
      highlightedIndex: -1,
      suggestions: sampleSuggestions,
      value: 'agent-',
    };

    // Flèche bas -> surbrillance index 0
    keyboardState = handleAutocompleteKeyDown(
      { key: 'ArrowDown', preventDefault: vi.fn(), stopPropagation: vi.fn() },
      keyboardState,
      keySelectSpy,
      keyCloseSpy,
    );
    expect(keyboardState.highlightedIndex).toBe(0);

    // Flèche bas -> surbrillance index 1
    keyboardState = handleAutocompleteKeyDown(
      { key: 'ArrowDown', preventDefault: vi.fn(), stopPropagation: vi.fn() },
      keyboardState,
      keySelectSpy,
      keyCloseSpy,
    );
    expect(keyboardState.highlightedIndex).toBe(1);

    // Flèche haut -> retour surbrillance index 0
    keyboardState = handleAutocompleteKeyDown(
      { key: 'ArrowUp', preventDefault: vi.fn(), stopPropagation: vi.fn() },
      keyboardState,
      keySelectSpy,
      keyCloseSpy,
    );
    expect(keyboardState.highlightedIndex).toBe(0);

    // Touche Entrée -> sélection de la suggestion active (index 0 : agent-codeur)
    const enterEvent = { key: 'Enter', preventDefault: vi.fn(), stopPropagation: vi.fn() };
    keyboardState = handleAutocompleteKeyDown(
      enterEvent,
      keyboardState,
      keySelectSpy,
      keyCloseSpy,
    );
    expect(enterEvent.preventDefault).toHaveBeenCalled();
    expect(keySelectSpy).toHaveBeenCalledWith(sampleSuggestions[0]);
    expect(keyboardState.isOpen).toBe(false);
    expect(keyboardState.value).toBe('agent-codeur');

    // Touche Échap -> fermeture du menu et propagation stoppée sans altérer la valeur
    const escEvent = { key: 'Escape', preventDefault: vi.fn(), stopPropagation: vi.fn() };
    const escState = handleAutocompleteKeyDown(
      escEvent,
      { isOpen: true, highlightedIndex: 0, suggestions: sampleSuggestions, value: 'agent-garde' },
      keySelectSpy,
      keyCloseSpy,
    );
    expect(escEvent.stopPropagation).toHaveBeenCalled();
    expect(keyCloseSpy).toHaveBeenCalled();
    expect(escState.isOpen).toBe(false);
    expect(escState.value).toBe('agent-garde');

    // 7. Lecture seule et désactivation (disabled={true} / readOnly={true})
    const disabledVNode = (AutocompleteInput as any)({
      ...initialProps,
      disabled: true,
      isOpen: true,
      suggestions: sampleSuggestions,
    });
    const disabledJson = JSON.stringify(disabledVNode);
    expect(disabledJson).not.toMatch(/data-section":"autocomplete-dropdown"/);
    const disabledInput = findVNodeByTag(disabledVNode, 'input');
    expect(disabledInput.props.disabled).toBe(true);

    const readOnlyVNode = (AutocompleteInput as any)({
      ...initialProps,
      readOnly: true,
      isOpen: true,
      suggestions: sampleSuggestions,
    });
    const readOnlyJson = JSON.stringify(readOnlyVNode);
    expect(readOnlyJson).not.toMatch(/data-section":"autocomplete-dropdown"/);
    const readOnlyInput = findVNodeByTag(readOnlyVNode, 'input');
    expect(readOnlyInput.props.readOnly).toBe(true);
  });
});

