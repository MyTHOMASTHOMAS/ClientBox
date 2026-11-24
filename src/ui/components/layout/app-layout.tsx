import { h, type ComponentChildren } from 'preact';
import { Sidebar } from './sidebar.js';

/** Propriétés de la disposition globale AppLayout. */
export interface AppLayoutProps {
  readonly currentRoute?: string;
  readonly onNavigate?: (route: string) => void;
  readonly title?: string;
  readonly children?: ComponentChildren;
}

/**
 * Coquille maîtresse de l'application avec sidebar de navigation et topbar de statut.
 * @param props Propriétés du composant
 */
export function AppLayout(props: AppLayoutProps) {
  const { currentRoute = '#/scenarios', onNavigate, title, children } = props;

  return (
    <div className="w-full min-h-screen bg-surface-base text-on-surface font-body-md text-body-md selection:bg-primary-container selection:text-on-primary-container flex">
      <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />
      <nav className="sr-only" aria-label="Sections principales">
        Scénarios Agents Profils Prompts Conditions Exit Scripts If
      </nav>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 h-12 bg-surface-panel border-b border-border-default z-40 flex items-center justify-between px-6 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-3 border-r border-border-subtle">
              <span className="font-label-md text-label-md text-on-surface font-bold tracking-wide">
                ClientsBox
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-outline text-[10px] font-mono border border-border-subtle tracking-wider">
                CLI IDE
              </span>
            </div>

            <nav className="flex items-center gap-2 text-xs font-mono text-outline">
              <span className="material-symbols-outlined text-[16px]">folder_open</span>
              <span className="hover:text-on-surface cursor-pointer">workflows /</span>
              <span id="view-title" className="text-on-surface font-semibold">
                {title ?? 'Orchestration v1'}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success shadow-[0_0_4px_#10b981]" />
                Stockage Local-First (.agents/data)
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated/80 border border-border-default text-xs font-mono shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success shadow-[0_0_6px_#10b981]" />
              </span>
              <span className="text-outline">SRV:</span>
              <span className="text-emerald-400 font-semibold">En ligne :2974</span>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full bg-surface-base flex flex-col relative overflow-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
