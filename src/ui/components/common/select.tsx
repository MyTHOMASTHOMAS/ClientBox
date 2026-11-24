import { h } from 'preact';
import type { SelectOption } from '../../types/ui.types.js';

/** Propriétés du composant de sélection déroulante Select. */
export interface SelectProps {
  readonly id?: string;
  readonly label?: string;
  readonly value?: string;
  readonly options: readonly SelectOption[];
  readonly error?: string;
  readonly disabled?: true | false;
  readonly className?: string;
  readonly dataAction?: string;
  readonly onChange?: (val: string) => void;
}

/**
 * Sélecteur déroulant stylisé pour les options de formulaire.
 * @param props Propriétés du composant
 */
export function Select(props: SelectProps) {
  const {
    id,
    label,
    value,
    options,
    error,
    disabled = false,
    className = '',
    dataAction,
    onChange,
  } = props;

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange?.(target.value);
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="font-label-sm text-label-sm text-outline uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={id}
          value={value}
          disabled={disabled}
          data-action={dataAction}
          onChange={handleChange}
          className={`w-full px-2.5 py-1 bg-surface-base text-on-surface font-code-sm text-code-sm rounded border appearance-none cursor-pointer pr-7 ${
            error ? 'border-status-error' : 'border-border-default'
          } focus:outline-none focus:border-border-focus disabled:opacity-50`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined text-outline text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          expand_more
        </span>
      </div>
      {error && <span className="text-status-error text-[11px] font-mono">{error}</span>}
    </div>
  );
}
