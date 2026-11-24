import { h } from 'preact';

/** Propriétés du champ de saisie texte Input. */
export interface InputProps {
  readonly id?: string;
  readonly label?: string;
  readonly value?: string | number;
  readonly placeholder?: string;
  readonly type?: 'text' | 'password' | 'number' | 'search' | 'email' | 'tel' | 'url' | 'hidden';
  readonly error?: string;
  readonly readOnly?: true | false;
  readonly disabled?: true | false;
  readonly className?: string;
  readonly dataAction?: string;
  readonly onChange?: (val: string) => void;
  readonly onInput?: (e: Event) => void;
}

/**
 * Champ de saisie texte accessible avec gestion de label, d'erreur et de style moderne.
 * @param props Propriétés du composant
 */
export function Input(props: InputProps) {
  const {
    id,
    label,
    value,
    placeholder,
    type = 'text',
    error,
    readOnly = false,
    disabled = false,
    className = '',
    dataAction,
    onChange,
    onInput,
  } = props;

  const handleInput = (e: Event) => {
    onInput?.(e);
    const target = e.target as HTMLInputElement;
    onChange?.(target.value);
  };

  const borderClass = error
    ? 'border-status-error focus:border-status-error focus:ring-status-error/20'
    : 'border-white/10 focus:border-blue-500/80 focus:ring-blue-500/20';

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="font-mono text-[11px] text-outline uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        type={(type || 'text') as 'text'}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        data-action={dataAction}
        onInput={handleInput}
        className={`w-full px-3 py-1.5 bg-surface-panel/90 text-on-surface font-body-sm text-body-sm rounded-lg border shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-40 disabled:cursor-not-allowed ${borderClass}`}
      />
      {error && <span className="text-status-error text-[11px] font-mono">{error}</span>}
    </div>
  );
}
