import { h, type ComponentChildren } from 'preact';

/** Propriétés du bouton standard de l'application. */
export interface ButtonProps {
  readonly children: ComponentChildren;
  readonly onClick?: (e: MouseEvent) => void;
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'kill';
  readonly type?: 'button' | 'submit' | 'reset';
  readonly disabled?: true | false;
  readonly className?: string;
  readonly title?: string;
  readonly icon?: string;
  readonly dataAction?: string;
  readonly 'data-action'?: string;
}

function resolveVariantClass(variant: string) {
  if (variant === 'secondary') {
    return 'bg-surface-elevated/90 hover:bg-surface-overlay text-on-surface border border-white/10 hover:border-white/20 shadow-sm active:scale-[0.98]';
  }
  if (variant === 'danger') {
    return 'bg-status-error/10 hover:bg-status-error/20 text-status-error border border-status-error/25 active:scale-[0.98]';
  }
  if (variant === 'ghost') {
    return 'bg-transparent hover:bg-white/5 text-on-surface-variant hover:text-on-surface active:scale-[0.98]';
  }
  if (variant === 'kill') {
    return 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold shadow-sm shadow-red-500/30 border border-red-400/20 active:scale-[0.98]';
  }
  return 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-sm shadow-blue-500/25 border border-blue-400/25 active:scale-[0.98]';
}

/**
 * Bouton interactif standard avec gestion des variantes d'action et micro-animations.
 * @param props Propriétés du composant
 */
export function Button(props: ButtonProps) {
  const {
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    disabled = false,
    className = '',
    title,
    icon,
    dataAction,
  } = props;
  const resolvedAction = dataAction ?? props['data-action'];
  const variantClass = resolveVariantClass(variant);

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      data-action={resolvedAction}
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-body-sm transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantClass} ${className}`}
    >
      {icon && <span className="material-symbols-outlined text-[16px] leading-none">{icon}</span>}
      {children}
    </button>
  );
}
