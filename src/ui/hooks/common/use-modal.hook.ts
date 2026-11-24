/**
 * Hook de gestion d'état et cycle de vie des boîtes de dialogue modales.
 */

import { useState, useCallback } from 'preact/hooks';

/**
 * Contrat d'état et actions exposé par le hook useModal.
 */
export interface UseModalState<T = unknown> {
  readonly isOpen: boolean;
  readonly data?: T;
  readonly open: (payload?: T) => void;
  readonly close: () => void;
}

/**
 * Gère l'ouverture, la fermeture et le payload de données associé à une modale.
 * @param initialOpen État d'ouverture initial
 */
export function useModal<T = unknown>(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<T | undefined>(undefined);

  const open = useCallback((payload?: T) => {
    setData(payload);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(undefined);
  }, []);

  return { isOpen, data, open, close } as UseModalState<T>;
}
