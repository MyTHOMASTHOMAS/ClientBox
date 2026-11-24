/**
 * @fileExemption Dépassement du seuil nominal de 150 lignes justifié par le composant d'autocomplétion générique avec dropdown et navigation clavier.
 */

import { h } from 'preact';
import {
  safeUseState,
  safeUseRef,
  safeUseEffect,
} from '../../hooks/studio/studio-preact-safe.helper.js';
import {
  type AutocompleteSuggestion,
  type AutocompleteInputProps,
  resolveInputState,
  executeAutocompleteSearch,
  handleAutocompleteKeyDown,
} from '../../hooks/common/autocomplete.helper.js';

export type {
  AutocompleteSuggestion,
  AutocompleteKeyEvent,
  AutocompleteKeyboardState,
  AutocompleteInputProps,
} from '../../hooks/common/autocomplete.helper.js';

export {
  createResourceSearch,
  executeAutocompleteSearch,
  handleAutocompleteKeyDown,
} from '../../hooks/common/autocomplete.helper.js';

function renderSuggestionItem(
  item: AutocompleteSuggestion,
  isSelected: boolean,
  onSelect: (item: AutocompleteSuggestion) => void,
) {
  const itemClass = isSelected
    ? 'bg-primary/20 text-on-surface'
    : 'hover:bg-surface-elevated text-on-surface-variant';
  return (
    <div
      key={item.value}
      role="option"
      data-suggestion-value={item.value}
      aria-selected={isSelected ? 'true' : 'false'}
      onMouseDown={(e: MouseEvent) => {
        e.preventDefault();
        onSelect(item);
      }}
      onClick={() => onSelect(item)}
      className={`px-3 py-1.5 flex flex-col cursor-pointer transition-colors ${itemClass}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium text-on-surface">
          {item.label || item.value}
        </span>
        {item.badge && (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-elevated text-primary border border-primary/20">
            {item.badge}
          </span>
        )}
      </div>
      {item.description && (
        <span className="text-[11px] text-outline truncate">{item.description}</span>
      )}
    </div>
  );
}

/**
 * Composant de saisie prédictive libre avec recherche modulaire synchrone ou asynchrone.
 * @param props Propriétés du composant
 */
export function AutocompleteInput(props: AutocompleteInputProps) {
  const {
    id,
    name,
    label,
    value = '',
    placeholder,
    disabled = false,
    readOnly = false,
    className = '',
    dataAction,
    search,
    onChange,
    onSelect,
    minChars = 0,
  } = props;

  const [internalValue, setInternalValue] = safeUseState(value);
  const [internalIsOpen, setInternalIsOpen] = safeUseState(false);
  const [internalSuggestions, setInternalSuggestions] = safeUseState<
    readonly AutocompleteSuggestion[]
  >([]);
  const [internalHighlighted, setInternalHighlighted] = safeUseState(-1);
  const searchSeqRef = safeUseRef(0);

  safeUseEffect(() => {
    if (props.value !== undefined) {
      setInternalValue(props.value);
    }
  }, [props.value]);

  const { isLocked, effValue, effOpen, effSuggestions, effHighlighted, showDropdown } =
    resolveInputState(props, {
      val: internalValue,
      isOpen: internalIsOpen,
      sug: internalSuggestions,
      idx: internalHighlighted,
    });

  const handleSelect = (item: AutocompleteSuggestion) => {
    setInternalValue(item.value);
    setInternalIsOpen(false);
    setInternalHighlighted(-1);
    onChange?.(item.value);
    onSelect?.(item);
  };

  const triggerSearch = async (query: string) => {
    if (isLocked) return;
    const currentSeq = ++searchSeqRef.current;
    const results = await executeAutocompleteSearch(query, search, minChars);
    if (searchSeqRef.current === currentSeq) {
      setInternalSuggestions(results);
      setInternalIsOpen(results.length > 0);
      setInternalHighlighted(-1);
    }
  };

  const handleFocus = async () => {
    if (isLocked) return;
    await triggerSearch('');
  };

  const handleClick = async () => {
    if (isLocked) return;
    if (!effOpen) {
      await triggerSearch('');
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setInternalIsOpen(false);
    }, 150);
  };

  const handleInput = async (e: Event) => {
    const nextVal = (e.target as HTMLInputElement)?.value ?? '';
    setInternalValue(nextVal);
    onChange?.(nextVal);
    await triggerSearch(nextVal);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isLocked) return;
    if (
      (e.key === 'ArrowDown' || e.key === 'ArrowUp') &&
      (!effOpen || effSuggestions.length === 0)
    ) {
      e.preventDefault();
      void triggerSearch('');
      return;
    }
    const currentState = {
      isOpen: effOpen,
      highlightedIndex: effHighlighted,
      suggestions: effSuggestions,
      value: effValue,
    };
    const next = handleAutocompleteKeyDown(e, currentState, handleSelect, () =>
      setInternalIsOpen(false),
    );
    if (next.isOpen !== effOpen) setInternalIsOpen(next.isOpen);
    if (next.highlightedIndex !== effHighlighted) setInternalHighlighted(next.highlightedIndex);
  };

  return (
    <div
      data-component="autocomplete-input"
      className={`relative flex flex-col gap-1 w-full ${className}`}
    >
      {label && (
        <label
          htmlFor={id}
          className="block text-outline text-[11px] font-mono uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown ? 'true' : 'false'}
        data-action={dataAction}
        value={effValue}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete="off"
        onFocus={handleFocus}
        onClick={handleClick}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="w-full px-2.5 py-1.5 bg-surface-base text-on-surface font-code-sm text-code-sm rounded border border-border-default focus:outline-none focus:border-border-focus disabled:opacity-50 transition-colors"
      />
      {showDropdown && (
        <div
          data-section="autocomplete-dropdown"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface-panel border border-border-default rounded-md shadow-2xl max-h-56 overflow-y-auto py-1"
        >
          {effSuggestions.map((item, index) =>
            renderSuggestionItem(item, index === effHighlighted, handleSelect),
          )}
        </div>
      )}
    </div>
  );
}
