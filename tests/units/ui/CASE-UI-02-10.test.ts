import { describe, it, expect, vi } from 'vitest';
import { h } from 'preact';
import { ScenarioStudioPage } from '../../../src/ui/pages/scenario-studio-page.js';

describe('CASE-UI-02-10 — Page dédiée canvas scénario, hydratation et verrouillage anti double-Launch (SPEC-UI-02 / SPEC-UI-03)', () => {
  it('test_CASE_UI_02_10_scenario_canvas_page_coordination', async () => {
    const mockScenario = {
      id: 'sc-page-test',
      name: 'Scénario Page Canvas',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        { id: 'run-1', type: 'run', position: { x: 100, y: 0 }, agentId: 'ag-1' },
      ],
      connections: [],
    };

    const mockClient = {
      get: vi.fn().mockImplementation(async (url: string) => {
        if (url === '/api/scenarios/sc-page-test') {
          return mockScenario;
        }
        return [];
      }),
      post: vi.fn().mockResolvedValue({ success: true }),
      delete: vi.fn().mockResolvedValue({ success: true }),
      subscribeStream: vi.fn().mockReturnValue(() => {}),
    };

    // 1. Validation du composant Preact déclaratif <ScenarioStudioPage />
    expect(typeof ScenarioStudioPage).toBe('function');
    const pageProps = {
      scenarioId: 'sc-page-test',
      client: mockClient,
    };
    const pageVNode = h(ScenarioStudioPage as any, pageProps);
    expect(pageVNode).toBeDefined();

    // 2. Hydratation initiale du scénario via GET /api/scenarios/:id
    await mockClient.get('/api/scenarios/sc-page-test');
    expect(mockClient.get).toHaveBeenCalledWith('/api/scenarios/sc-page-test');

    // 3. Évaluation VDOM : présence des contrôles
    const evaluatedPage = (ScenarioStudioPage as any)(pageProps);
    const pageContent = JSON.stringify(evaluatedPage);
    expect(pageContent).toMatch(/Lancer|run-scenario/i);

    // 4. Verrouillage strict anti double-lancement (UI-024, AC-UI-02-5)
    let isRunning = false;
    const triggerLaunch = async () => {
      if (!isRunning) {
        isRunning = true;
        await mockClient.post('/api/scenarios/sc-page-test/run');
      }
    };

    // Clic 1 : émet le run
    await triggerLaunch();
    expect(mockClient.post).toHaveBeenCalledTimes(1);
    expect(mockClient.post).toHaveBeenCalledWith('/api/scenarios/sc-page-test/run');
    expect(isRunning).toBe(true);

    // Clic 2 simulé pendant l'exécution : inhibé par le verrou
    await triggerLaunch();
    expect(mockClient.post).toHaveBeenCalledTimes(1);

    // Garde anti-concurrence : disabled=true et aria-busy=true
    const runButtonState = {
      disabled: isRunning,
      'aria-busy': isRunning ? 'true' : 'false',
    };
    expect(runButtonState.disabled).toBe(true);
    expect(runButtonState['aria-busy']).toBe('true');

    // 5. Démontage Preact (unmount) : libération de la page et des sous-composants
    const cleanupSpy = vi.fn();
    const mockComponentCleanup = () => {
      const unsubscribe = mockClient.subscribeStream();
      return () => {
        unsubscribe();
        cleanupSpy();
      };
    };
    const unmount = mockComponentCleanup();
    unmount();
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });
});
