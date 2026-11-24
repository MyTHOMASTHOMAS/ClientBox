import { h, type ComponentChildren } from 'preact';

/** Propriétés du badge visuel. */
export interface BadgeProps {
  readonly children: ComponentChildren;
  readonly variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'agent' | 'primary';
  readonly className?: string;
  readonly dot?: true | false;
  readonly hasDot?: boolean;
}

function resolveBadgeStyles(variant: string) {
  if (variant === 'success') {
    return {
      colorClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      dotColor: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
    };
  }
  if (variant === 'warning') {
    return {
      colorClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      dotColor: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
    };
  }
  if (variant === 'error') {
    return {
      colorClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      dotColor: 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]',
    };
  }
  if (variant === 'info' || variant === 'primary') {
    return {
      colorClass: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      dotColor: 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]',
    };
  }
  if (variant === 'agent') {
    return {
      colorClass: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      dotColor: 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]',
    };
  }
  return {
    colorClass: 'bg-surface-elevated/90 text-on-surface-variant border-white/10',
    dotColor: 'bg-slate-400',
  };
}

/**
 * Badge d'état ou d'étiquetage stylisé avec pastille lumineuse optionnelle.
 * @param props Propriétés du composant
 */
export function Badge(props: BadgeProps) {
  const { children, variant = 'neutral', className = '', dot = false, hasDot } = props;
  const isDotted = dot || hasDot || false;
  const { colorClass, dotColor } = resolveBadgeStyles(variant);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-code-sm text-[11px] border font-medium whitespace-nowrap shadow-xs ${colorClass} ${className}`}
    >
      {isDotted && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      {children}
    </span>
  );
}
