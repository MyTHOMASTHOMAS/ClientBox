import { describe, it, expect } from 'vitest';
import { h } from 'preact';
import { AppLayout } from '../../../src/ui/components/layout/app-layout.js';
import { mountApp, App } from '../../../src/ui/app.js';
import { AgentsPage } from '../../../src/ui/pages/agents-page.js';
import { ProfilesPage } from '../../../src/ui/pages/profiles-page.js';

describe('CASE-UI-01-4 — Navigation globale en français, montage racine et vues de liste (SPEC-UI-01)', () => {
  it('test_CASE_UI_01_4_global_layout_navigation_and_list_views_compliance', () => {
    // 1. Validation du composant Preact déclaratif <AppLayout />
    const layoutVNode = h(AppLayout as any, null);
    expect(layoutVNode).toBeDefined();

    // Évaluation du composant fonctionnel Preact AppLayout (VDOM)
    expect(typeof AppLayout).toBe('function');
    const evaluatedLayout = (AppLayout as any)({});
    const layoutContent = JSON.stringify(evaluatedLayout);

    expect(layoutContent).toMatch(/Scénarios/i);
    expect(layoutContent).toMatch(/Agents/i);
    expect(layoutContent).toMatch(/Profils/i);
    expect(layoutContent).toMatch(/Prompts/i);
    expect(layoutContent).toMatch(/Conditions Exit/i);
    expect(layoutContent).toMatch(/Scripts If/i);

    // Conformité linguistique (REQ-007, C-06) : aucun terme anglais interdit
    expect(layoutContent).not.toMatch(/\b(Dashboard|Settings|Submit|Cancel)\b/i);

    // 2. Validation de la page Preact <AgentsPage agents={...} />
    const sampleAgents = [
      { id: 'ag-1', name: 'Agent Test', profilId: 'p-1', cliId: 'cursor-cli' },
    ];
    const agentVNode = h(AgentsPage as any, { agents: sampleAgents });
    expect(agentVNode).toBeDefined();

    expect(typeof AgentsPage).toBe('function');
    const evaluatedAgent = (AgentsPage as any)({ agents: sampleAgents });
    const agentContent = JSON.stringify(evaluatedAgent);

    expect(agentContent).toMatch(/Nom/);
    expect(agentContent).toMatch(/Profil/);
    expect(agentContent).toMatch(/CLI/);
    expect(agentContent).toMatch(/Agent Test/);
    expect(agentContent).toMatch(/Créer/i);
    expect(agentContent).toMatch(/Modifier/i);
    expect(agentContent).toMatch(/Supprimer/i);

    // 3. Validation de la page Preact <ProfilesPage profiles={...} />
    const sampleProfiles = [
      { id: 'p-1', name: 'Profil Expert', systemPrompt: 'System', policy: 'chaque_prompt' as const },
    ];
    const profileVNode = h(ProfilesPage as any, { profiles: sampleProfiles });
    expect(profileVNode).toBeDefined();

    expect(typeof ProfilesPage).toBe('function');
    const evaluatedProfile = (ProfilesPage as any)({ profiles: sampleProfiles });
    const profileContent = JSON.stringify(evaluatedProfile);

    expect(profileContent).toMatch(/Profil Expert/);
    expect(profileContent).toMatch(/chaque_prompt|Chaque prompt/i);
    expect(profileContent).toMatch(/Créer|Modifier|Supprimer/i);

    // 4. Validation de l'arbre racine Preact <App /> et de mountApp(rootEl)
    const appVNode = h(App as any, null);
    expect(appVNode).toBeDefined();

    const fakeRoot = {
      innerHTML: '',
      appendChild: () => {},
      addEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
    };
    expect(() => mountApp(fakeRoot as unknown as HTMLElement)).not.toThrow();
  });
});

