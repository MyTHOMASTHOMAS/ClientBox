import { h, type ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

function safeUseEffect(cb: () => void | (() => void), deps?: readonly unknown[]) {
  try {
    useEffect(cb, deps as Parameters<typeof useEffect>[1]);
  } catch {
    cb();
  }
}

/** Propriétés de la modale déclarative. */
export interface ModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children?: ComponentChildren;
  readonly sourceCode?: string;
  readonly className?: string;
}

/**
 * Modale accessible avec fermeture via touche Escape et déchargement VDOM.
 * @param props Propriétés du composant
 */
export function Modal(props: ModalProps) {
  const { isOpen, title, onClose, children, sourceCode, className = '' } = props;

  safeUseEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('keydown', handleKeyDown, true);
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="modal-overlay script-viewer-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-base/80 backdrop-blur-sm"
    >
      <div
        className={`relative w-full max-w-2xl bg-surface-panel rounded-xl shadow-2xl border border-border-default overflow-hidden flex flex-col max-h-[90vh] ${className}`}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-surface-container-high border-b border-border-subtle shrink-0">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            title="Fermer"
            className="px-2 py-1 flex items-center gap-1 rounded text-outline hover:text-on-surface hover:bg-surface-elevated transition-colors text-xs font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            <span>Fermer</span>
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {sourceCode !== undefined && (
            <pre className="script-source-preview p-3 bg-surface-base rounded border border-border-subtle font-mono text-code-sm text-terminal-text overflow-x-auto select-text whitespace-pre-wrap break-words">
              <code>{sourceCode}</code>
            </pre>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
