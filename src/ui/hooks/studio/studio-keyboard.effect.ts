/**
 * Effet clavier Delete/Backspace pour suppression de nœud Studio (extraction volumétrie UI-031).
 */

import { useEffect } from 'preact/hooks';

/** Options de l'effet suppression clavier. */
export interface KeyboardDeleteNodeOptions {
  readonly isGraphLocked: boolean;
  readonly selectedNodeId: string | null;
  readonly onDeleteNode: (nodeId: string) => void;
}

/**
 * Supprime le nœud sélectionné via Delete / Backspace (hors champs éditables).
 *
 * @param options Verrou graphe, sélection et callback
 */
export function useKeyboardDeleteNode(options: KeyboardDeleteNodeOptions) {
  const { isGraphLocked, selectedNodeId, onDeleteNode } = options;
  try {
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (isGraphLocked || !selectedNodeId) return;
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT' ||
            (activeEl as HTMLElement).isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        onDeleteNode(selectedNodeId);
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [isGraphLocked, selectedNodeId, onDeleteNode]);
  } catch (err: unknown) {
    void err;
    // Évaluation hors cycle Preact
  }
}
