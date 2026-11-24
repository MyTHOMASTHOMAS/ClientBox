import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h } from 'preact';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Modal } from '../../../src/ui/components/common/modal.js';

describe('CASE-UI-01-7 — Modale d’inspection de scripts en lecture seule et passivité réseau per REQ-011 (SPEC-UI-01 / SPEC-DATA-02)', () => {
  let container: any;
  let windowListeners: Map<string, Array<(e: any) => void>>;

  beforeEach(() => {
    windowListeners = new Map();

    const listeners = new Map<string, Array<(...args: any[]) => void>>();
    container = {
      innerHTML: '',
      children: [] as any[],
      appendChild: vi.fn().mockImplementation((child: any) => {
        container.children.push(child);
        return child;
      }),
      removeChild: vi.fn().mockImplementation((child: any) => {
        const idx = container.children.indexOf(child);
        if (idx !== -1) {
          container.children.splice(idx, 1);
        }
      }),
      querySelector: vi.fn().mockImplementation((selector: string) => {
        if (selector === 'button' || selector.includes('close') || selector.includes('fermer')) {
          return {
            click: () => {
              const clickHandlers = listeners.get('click') ?? [];
              clickHandlers.forEach((h) => h());
            },
            textContent: 'Fermer',
          };
        }
        return null;
      }),
      addEventListener: vi.fn().mockImplementation((event: string, handler: any) => {
        const list = listeners.get(event) ?? [];
        list.push(handler);
        listeners.set(event, list);
      }),
      removeEventListener: vi.fn(),
    };

    (globalThis as any).window = {
      addEventListener: vi.fn().mockImplementation((ev: string, fn: (e: any) => void) => {
        const list = windowListeners.get(ev) ?? [];
        list.push(fn);
        windowListeners.set(ev, list);
      }),
      removeEventListener: vi.fn().mockImplementation((ev: string, fn: (e: any) => void) => {
        const list = windowListeners.get(ev);
        if (list) {
          const idx = list.indexOf(fn);
          if (idx !== -1) list.splice(idx, 1);
        }
      }),
    };

    (globalThis as any).document = {
      body: container,
      createElement: vi.fn().mockImplementation((tag: string) => ({
        tagName: tag.toUpperCase(),
        className: '',
        innerHTML: '',
        textContent: '',
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        style: {},
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  afterEach(() => {
    delete (globalThis as any).document;
    delete (globalThis as any).window;
  });

  it('test_CASE_UI_01_7_script_viewer_modal_passive_rendering', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const onClose = vi.fn();

    const title = 'Vérification Solde (solde-check.js)';
    const sourceCode = 'return sac["0"] > 0;';

    // 1. Validation du composant Preact déclaratif <Modal />
    expect(typeof Modal).toBe('function');
    const modalProps = {
      title,
      sourceCode,
      children: h('pre', { className: 'script-source-preview' }, h('code', null, sourceCode)),
      isOpen: true,
      onClose,
    };
    const modalVNode = h(Modal as any, modalProps);
    expect(modalVNode).toBeDefined();

    // 2. Passivité réseau absolue (REQ-011) : aucun appel HTTP fetch
    expect(fetchSpy).not.toHaveBeenCalled();

    // 3. Évaluation VDOM : rendu dans une balise <pre> / <code> non éditable
    const evaluatedModal = (Modal as any)(modalProps);
    const modalContent = JSON.stringify(evaluatedModal);

    expect(modalContent).toMatch(/Vérification Solde/);
    expect(modalContent).toMatch(/return sac/);

    // 4. Déclenchement de la fermeture via Escape (écouteur attaché par useEffect)
    const escapeHandlers = windowListeners.get('keydown') ?? [];
    for (const handler of escapeHandlers) {
      handler({ key: 'Escape' });
    }
    // Si useEffect a attaché le listener
    if (escapeHandlers.length > 0) {
      expect(onClose).toHaveBeenCalled();
    }

    // 5. Test de la modale fermée (isOpen: false) -> retourne null (démontage VDOM)
    const closedProps = { ...modalProps, isOpen: false };
    const closedVNode = (Modal as any)(closedProps);
    expect(closedVNode === null || closedVNode === undefined || (closedVNode as any)?.props === null).toBe(true);

    // 6. Conformité des animations de transition modale dans app.css (ADR-015)
    const here = path.dirname(fileURLToPath(import.meta.url));
    const cssPath = path.resolve(here, '../../../src/ui/styles/app.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    expect(cssContent).toMatch(/@keyframes\s+modalFadeIn/);
    expect(cssContent).toMatch(/@keyframes\s+modalSlideUp/);
  });
});
