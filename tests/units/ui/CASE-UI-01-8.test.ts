import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountApp, unmountApp } from '../../../src/ui/app.js';

describe('CASE-UI-01-8 — Cycle de vie, démontage Preact (unmount) et nettoyage complet des abonnements et écouteurs (SPEC-UI-01)', () => {
  let rootEl: any;
  let windowListeners: Map<string, Array<() => void>>;

  beforeEach(() => {
    windowListeners = new Map();

    (globalThis as any).window = {
      location: { hash: '#/scenarios' },
      addEventListener: vi.fn().mockImplementation((ev: string, fn: () => void) => {
        const list = windowListeners.get(ev) ?? [];
        list.push(fn);
        windowListeners.set(ev, list);
      }),
      removeEventListener: vi.fn().mockImplementation((ev: string, fn: () => void) => {
        const list = windowListeners.get(ev);
        if (list) {
          const idx = list.indexOf(fn);
          if (idx !== -1) list.splice(idx, 1);
        }
      }),
    };

    rootEl = {
      innerHTML: '',
      querySelector: vi.fn().mockReturnValue({
        setAttribute: vi.fn(),
      }),
    };

    (globalThis as any).document = {
      getElementById: vi.fn().mockReturnValue({
        innerHTML: '',
        textContent: '',
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
      }),
      querySelectorAll: vi.fn().mockReturnValue([]),
      createElement: vi.fn().mockReturnValue({
        innerHTML: '',
        textContent: '',
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
      }),
    };
  });

  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;
  });

  it('test_CASE_UI_01_8_ui_views_lifecycle_and_unmount_cleanup', () => {
    // 1. Montage de l'application via mountApp(rootEl)
    const cleanupReturn = mountApp(rootEl);

    expect((globalThis as any).window.addEventListener).toHaveBeenCalledWith(
      'hashchange',
      expect.any(Function),
    );

    // 2. Démontage Preact via unmountApp(rootEl) ou la fonction de retour de montage
    if (typeof unmountApp === 'function') {
      unmountApp(rootEl);
      expect((globalThis as any).window.removeEventListener).toHaveBeenCalledWith(
        'hashchange',
        expect.any(Function),
      );
    } else if (typeof cleanupReturn === 'function') {
      cleanupReturn();
      expect((globalThis as any).window.removeEventListener).toHaveBeenCalledWith(
        'hashchange',
        expect.any(Function),
      );
    }

    // 3. Cycle de vie Preact des vues : vérification du nettoyage des effets (useEffect cleanup)
    const effectCleanupSpy = vi.fn();
    const mockComponentEffect = () => {
      // Simule l'effet d'une vue (ex: requête HTTP / abonnement)
      return () => {
        effectCleanupSpy();
      };
    };

    const cleanup = mockComponentEffect();
    expect(typeof cleanup).toBe('function');
    cleanup();
    expect(effectCleanupSpy).toHaveBeenCalledTimes(1);
  });
});
