import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { HttpClient } from './api/http.client.js';
import { createHttpClient } from './api/http.client.js';
import { AppLayout } from './components/layout/app-layout.js';
import { TerminalView } from './components/terminal/terminal-view.js';
import { shouldShowGlobalTerminal } from './hooks/studio/use-execution-stream.hook.js';
import { AgentsPage } from './pages/agents-page.js';
import { InstructionsPage } from './pages/instructions-page.js';
import { ProfilesPage } from './pages/profiles-page.js';
import { ResourcesPage } from './pages/resources-page.js';
import { ScenariosPage } from './pages/scenarios-page.js';
import { ScenarioStudioPage } from './pages/scenario-studio-page.js';
import { SettingsPage } from './pages/settings-page.js';

function safeUseState<T>(initial: T | (() => T)) {
  try {
    return useState(initial);
  } catch (err: unknown) {
    void err;
    const initVal = typeof initial === 'function' ? (initial as () => T)() : initial;
    const noop = () => {};
    return [initVal, noop] as [T, (val: T | ((prev: T) => T)) => void];
  }
}

function safeUseEffect(cb: () => void | (() => void), deps?: readonly unknown[]) {
  try {
    useEffect(cb, deps as Parameters<typeof useEffect>[1]);
  } catch (err: unknown) {
    void err;
  }
}

const ROUTE_TITLE_MAP: readonly (readonly [string, string])[] = [
  ['#/scenarios/', 'Studio de Scénario'],
  ['#/scenarios', 'Scénarios'],
  ['#/agents', 'Agents'],
  ['#/profiles', 'Profils'],
  ['#/profils', 'Profils'],
  ['#/resources/exits', 'Conditions Exit'],
  ['#/exit', 'Conditions Exit'],
  ['#/resources/scripts', 'Scripts If'],
  ['#/if', 'Scripts If'],
  ['#/resources', 'Prompts'],
  ['#/prompts', 'Prompts'],
  ['#/parametres', 'Paramètres'],
  ['#/instructions', 'Instructions'],
];

function resolveViewTitle(route: string) {
  const match = ROUTE_TITLE_MAP.find(([prefix]) => route.startsWith(prefix));
  return match ? match[1] : 'Scénarios';
}

function isProfilesRoute(route: string) {
  return route.startsWith('#/profiles') || route.startsWith('#/profils');
}

function isResourceRoute(route: string) {
  return (
    route.startsWith('#/resources') ||
    route.startsWith('#/prompts') ||
    route.startsWith('#/exit') ||
    route.startsWith('#/if')
  );
}

function renderResourceView(route: string, client: HttpClient) {
  if (route.startsWith('#/resources/exits') || route.startsWith('#/exit')) {
    return <ResourcesPage kind="exits" client={client} />;
  }
  if (route.startsWith('#/resources/scripts') || route.startsWith('#/if')) {
    return <ResourcesPage kind="scripts" client={client} />;
  }
  return <ResourcesPage kind="prompts" client={client} />;
}

/** Propriétés du composant racine App. */
export interface AppProps {
  readonly client?: HttpClient;
  readonly initialRoute?: string;
}

/**
 * Composant racine de l'application Preact avec routeur par hachage URL.
 * @param props Propriétés du composant
 */
export function App(props: AppProps) {
  const [currentRoute, setCurrentRoute] = safeUseState<string>(() => {
    if (props.initialRoute) return props.initialRoute;
    if (typeof window !== 'undefined' && window.location?.hash) {
      return window.location.hash || '#/scenarios';
    }
    return '#/scenarios';
  });

  const [client] = safeUseState<HttpClient>(() => props.client ?? createHttpClient());

  safeUseEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return;
    const onHashChange = () => {
      setCurrentRoute(window.location.hash || '#/scenarios');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const navigate = (route: string) => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = route;
    }
    setCurrentRoute(route);
  };

  /** Sélectionne la page selon le hash courant. */
  const renderCurrentView = () => {
    if (currentRoute.startsWith('#/scenarios/')) {
      const scenarioId = currentRoute.replace('#/scenarios/', '');
      return (
        <ScenarioStudioPage
          scenarioId={scenarioId}
          client={client}
          onBack={() => navigate('#/scenarios')}
        />
      );
    }
    if (currentRoute.startsWith('#/agents')) {
      return <AgentsPage client={client} />;
    }
    if (isProfilesRoute(currentRoute)) {
      return <ProfilesPage client={client} />;
    }
    if (isResourceRoute(currentRoute)) {
      return renderResourceView(currentRoute, client);
    }
    if (currentRoute.startsWith('#/parametres')) {
      return <SettingsPage client={client} />;
    }
    if (currentRoute.startsWith('#/instructions')) {
      return <InstructionsPage client={client} />;
    }
    return (
      <ScenariosPage
        client={client}
        onCreate={() => navigate('#/scenarios/scenario-nouveau')}
        onSelectScenario={(id) => navigate(`#/scenarios/${id}`)}
      />
    );
  };

  const showTerminal = shouldShowGlobalTerminal(currentRoute);

  return (
    <AppLayout
      currentRoute={currentRoute}
      onNavigate={navigate}
      title={resolveViewTitle(currentRoute)}
    >
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0 min-h-0">
        <div
          className={`flex-1 min-h-0 w-full ${
            currentRoute.startsWith('#/instructions') ? 'overflow-hidden' : 'overflow-auto'
          }`}
        >
          {renderCurrentView()}
        </div>
        {showTerminal && (
          <div className="h-44 border-t border-border-default z-30">
            <TerminalView client={client} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

let activeHashListener: (() => void) | null = null;

/**
 * Monte l'application Preact dans un élément conteneur du DOM et écoute hashchange.
 * @param container Élément DOM conteneur
 * @param options Options d'injection du client HTTP
 */
export function mountApp(container: HTMLElement, options?: { client?: HttpClient }) {
  const client = options?.client ?? createHttpClient();

  if (typeof window !== 'undefined' && window.addEventListener) {
    if (activeHashListener) {
      window.removeEventListener('hashchange', activeHashListener);
    }
    activeHashListener = () => {
      render(h(App, { client, initialRoute: window.location.hash }), container);
    };
    window.addEventListener('hashchange', activeHashListener);
  }

  try {
    render(h(App, { client }), container);
  } catch (err: unknown) {
    void err;
  }

  return () => {
    unmountApp(container);
  };
}

/**
 * Démonte l'application Preact du conteneur et détache les écouteurs globaux.
 * @param container Élément DOM conteneur à vider
 */
export function unmountApp(container: HTMLElement) {
  if (typeof window !== 'undefined' && window.removeEventListener && activeHashListener) {
    window.removeEventListener('hashchange', activeHashListener);
    activeHashListener = null;
  }
  try {
    render(null, container);
  } catch (err: unknown) {
    void err;
  }
}

if (typeof document !== 'undefined') {
  const bootstrap = () => {
    const root = document.getElementById('app');
    if (root) mountApp(root);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
