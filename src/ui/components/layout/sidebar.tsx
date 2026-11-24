import { h } from 'preact';

/**
 * Description d'un élément de navigation de la barre latérale.
 */
export interface NavItem {
  readonly route: string;
  readonly label: string;
  readonly icon: string;
  readonly pathId: string;
  readonly sectionId: string;
}

/**
 * Liste des routes principales de la navigation globale ClientsBox.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    route: '#/scenarios',
    label: 'Scénarios',
    icon: 'account_tree',
    pathId: 'workflows',
    sectionId: 'scenarios',
  },
  {
    route: '#/agents',
    label: 'Agents',
    icon: 'terminal',
    pathId: 'agents-catalog',
    sectionId: 'agents',
  },
  {
    route: '#/profiles',
    label: 'Profils',
    icon: 'psychology',
    pathId: 'profiles',
    sectionId: 'profils',
  },
  {
    route: '#/resources',
    label: 'Prompts',
    icon: 'description',
    pathId: 'resources',
    sectionId: 'prompts',
  },
  {
    route: '#/resources/exits',
    label: 'Conditions Exit',
    icon: 'verified',
    pathId: 'exits',
    sectionId: 'exit',
  },
  {
    route: '#/resources/scripts',
    label: 'Scripts If',
    icon: 'alt_route',
    pathId: 'scripts',
    sectionId: 'if',
  },
  {
    route: '#/parametres',
    label: 'Paramètres',
    icon: 'tune',
    pathId: 'parametres',
    sectionId: 'parametres',
  },
  {
    route: '#/instructions',
    label: 'Instructions',
    icon: 'menu_book',
    pathId: 'instructions',
    sectionId: 'instructions',
  },
];

/**
 * Propriétés du composant VDOM Sidebar.
 */
export interface SidebarProps {
  readonly currentRoute?: string;
  readonly onNavigate?: (route: string) => void;
}

/**
 * Rail de navigation latéral 48px avec icônes Material Symbols et infobulles.
 * @param props Propriétés du composant sidebar
 */
export function Sidebar(props: SidebarProps) {
  const { currentRoute = '#/scenarios', onNavigate } = props;

  return (
    <aside className="sticky top-0 h-screen w-12 shrink-0 bg-surface-container-lowest border-r border-white/10 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col items-center w-full">
        <div className="h-12 w-full flex items-center justify-center border-b border-white/10">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30 flex items-center justify-center text-primary font-bold text-xs font-mono shadow-xs">
            CB
          </div>
        </div>

        <nav className="sidebar-nav w-full flex flex-col items-center py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentRoute.startsWith(item.route);
            return (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).blur();
                  onNavigate?.(item.route);
                }}
                data-path={item.pathId}
                data-section={item.sectionId}
                aria-label={item.label}
                className={`group relative flex items-center justify-center w-full h-10 transition-colors ${
                  isActive
                    ? 'bg-white/5 text-blue-400 border-l-2 border-blue-500'
                    : 'text-on-surface-variant hover:bg-white/[0.04] hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="absolute left-12 ml-1.5 px-2.5 py-1 bg-surface-panel/95 backdrop-blur-md text-on-surface border border-white/10 rounded-lg text-[11px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-50 shadow-lg">
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col items-center w-full pb-2 border-t border-white/10 pt-2">
        <div className="group relative flex items-center justify-center w-full h-9">
          <div className="w-2 h-2 rounded-full bg-status-success animate-pulse shadow-[0_0_6px_#10b981]" />
          <div className="absolute left-12 ml-1.5 px-2.5 py-1 bg-surface-panel/95 backdrop-blur-md text-on-surface border border-white/10 rounded-lg font-mono text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
            <span className="text-tertiary font-bold">SRV : En ligne</span>
            <span className="text-outline">:2974</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
