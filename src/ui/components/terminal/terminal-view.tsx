import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { HttpClient } from '../../api/http.client.js';
import type { BooleanFlag } from '../../types/ui.types.js';
import {
  type TerminalLine,
  type TerminalViewState,
  createTerminalView,
  appendStreamEvent,
} from '../../hooks/studio/use-execution-stream.hook.js';

function safeUseState<T>(initial: T | (() => T)) {
  try {
    return useState(initial);
  } catch {
    const initVal = typeof initial === 'function' ? (initial as () => T)() : initial;
    const noop = () => {};
    return [initVal, noop] as [T, (val: T | ((prev: T) => T)) => void];
  }
}

function safeUseEffect(cb: () => void | (() => void), deps?: readonly unknown[]) {
  try {
    useEffect(cb, deps as Parameters<typeof useEffect>[1]);
  } catch {
    // Appel direct de la fonction hors rendu Preact
  }
}

function safeUseRef<T>(initial: T) {
  try {
    return useRef(initial);
  } catch {
    return { current: initial };
  }
}

/** Propriétés de la vue console terminal. */
export interface TerminalViewProps {
  readonly scenarioId?: string;
  readonly client?: HttpClient;
  readonly lines?: readonly TerminalLine[];
  readonly autoScroll?: BooleanFlag;
  readonly onClear?: () => void;
}

/**
 * Console temps réel affichant les flux stdout/stderr sans persistance disque.
 * @param props Propriétés du composant
 */
export function TerminalView(props: TerminalViewProps) {
  const {
    scenarioId,
    client,
    lines: propLines,
    autoScroll: propAutoScroll = true,
    onClear,
  } = props;
  const [internalState, setInternalState] = safeUseState<TerminalViewState>(() => {
    const base = createTerminalView(scenarioId ?? 'global');
    return {
      ...base,
      lines: [
        {
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          text: "[ClientsBox] Terminal d'exécution prêt.",
          stream: 'stdout',
          cssClass: 'text-tertiary font-mono',
        },
      ],
    };
  });
  const [autoScroll, setAutoScroll] = safeUseState<boolean>(propAutoScroll);
  const containerRef = safeUseRef<HTMLDivElement | null>(null);

  // Synchronisation flux SSE si client et scenarioId fournis
  safeUseEffect(() => {
    if (!client || !scenarioId || !client.subscribeStream) return undefined;

    const streamUrl = `/api/scenarios/${scenarioId}/stream`;
    const unsubscribe = client.subscribeStream(streamUrl, {
      onStdout: (chunk: string) => {
        setInternalState((prev) => appendStreamEvent(prev, { type: 'stdout', chunk }));
      },
      onStderr: (chunk: string) => {
        setInternalState((prev) => appendStreamEvent(prev, { type: 'stderr', chunk }));
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err || 'Connexion interrompue');
        setInternalState((prev) =>
          appendStreamEvent(prev, {
            type: 'stderr',
            chunk: `[Erreur flux] ${msg}\n`,
          }),
        );
      },
    });

    return () => {
      unsubscribe();
    };
  }, [client, scenarioId]);

  const activeLines = propLines ?? internalState.lines;

  // Auto-scroll réactif
  safeUseEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activeLines, autoScroll]);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      setInternalState(createTerminalView(scenarioId ?? 'global'));
    }
  };

  return (
    <div className="terminal-view flex flex-col h-full bg-surface-canvas border-t border-border-default select-text">
      {/* Barre supérieure du terminal */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-panel border-b border-border-subtle text-caption select-none">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-tertiary">terminal</span>
          <span className="font-semibold text-on-surface uppercase tracking-wider text-[11px]">
            Terminal d'exécution temps réel
          </span>
          <span className="flex items-center gap-1 text-[10px] text-accent-agent font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-agent animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoScroll((prev) => !prev)}
            title="Activer/Désactiver le défilement automatique"
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
              autoScroll
                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                : 'text-on-surface-variant hover:bg-surface-elevated'
            }`}
          >
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={handleClear}
            title="Effacer le terminal"
            className="flex items-center gap-1 px-2.5 py-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-elevated rounded-md text-[11px] font-mono transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
            <span>Effacer</span>
          </button>
        </div>
      </div>

      {/* Zone de logs fluide et non persistée */}
      <div
        id="terminal-output"
        ref={containerRef}
        tabIndex={0}
        aria-label="Sortie du terminal"
        className="flex-1 overflow-y-auto p-3 font-mono text-body-sm leading-relaxed space-y-0.5 outline-none"
      >
        {activeLines.length === 0 ? (
          <div className="text-on-surface-variant/40 italic py-2">
            En attente de messages d'exécution...
          </div>
        ) : (
          activeLines.map((line, idx) => (
            <div
              key={`${line.timestamp}-${idx}`}
              data-stream={line.stream}
              className={`flex items-start gap-2 whitespace-pre-wrap break-all ${line.cssClass}`}
            >
              <span className="text-outline/40 text-[10px] select-none pt-0.5">
                {line.timestamp}
              </span>
              <span className="flex-1">{line.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
