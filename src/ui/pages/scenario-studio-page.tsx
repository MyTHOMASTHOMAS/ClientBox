/**
 * @fileExemption Dépassement nominal justifié par l'orchestration studio (hydratation, câblage, SSE, persistance).
 */

import { h } from 'preact';
import type { Scenario } from '../../types/models/scenario.model.js';
import type { NodeType, ScenarioNode } from '../../types/models/node.model.js';
import type { HttpClient } from '../api/http.client.js';
import {
  type CanvasDocument,
  createCanvasDocument,
  buildScenarioPersistPayload,
  isStudioGraphLocked,
  addBlock,
  removeBlock,
  removeConnection,
  tryLaunchScenario,
  wireOriented,
} from '../hooks/canvas/use-canvas-state.hook.js';
import { safeUseState, safeUseEffect } from '../hooks/studio/studio-preact-safe.helper.js';
import { useScenarioExecution } from '../hooks/studio/use-scenario-execution.hook.js';
import { useScenarioSaveState } from '../hooks/studio/use-scenario-save-state.hook.js';
import { fetchScenarioSelectOptions } from '../hooks/studio/studio-loader.helper.js';
import { useKeyboardDeleteNode } from '../hooks/studio/studio-keyboard.effect.js';
import { CanvasBoard } from '../components/canvas/canvas-board.js';
import { CanvasToolbar } from '../components/canvas/canvas-toolbar.js';
import { InspectorPanel, type ScenarioSelectOption } from '../components/canvas/inspector-panel.js';
import { TerminalView } from '../components/terminal/terminal-view.js';

interface PendingPort {
  readonly nodeId: string;
  readonly portIndex: number;
}

/** Propriétés de la page du Studio de scénario. */
export interface ScenarioStudioPageProps {
  readonly scenarioId: string;
  readonly client?: HttpClient;
  readonly onBack?: () => void;
}

/**
 * @functionExemption Dépassement du seuil nominal en TSX justifié par la coordination du canvas nodal, des interactions pointer, du streaming terminal et du cycle de vie d'exécution.
 * Page dédiée au Studio de conception et d'exécution nodale de scénarios.
 * @param props Propriétés du composant
 */
function ScenarioStudioPage(props: ScenarioStudioPageProps) {
  const { scenarioId, client } = props;
  const [doc, setDoc] = safeUseState<CanvasDocument>(() => createCanvasDocument(scenarioId));
  const [selectedNodeId, setSelectedNodeId] = safeUseState<string | null>(null);
  const [selectedConnectionIndex, setSelectedConnectionIndex] = safeUseState<number | null>(null);
  const [pendingPort, setPendingPort] = safeUseState<PendingPort | null>(null);
  const [isRunning, setIsRunning] = safeUseState<boolean>(false);
  const [isLaunchLocked, setLaunchLocked] = safeUseState(false);
  const [saveMessage, setSaveMessage] = safeUseState<string | null>(null);
  const [scenarioOptions, setScenarioOptions] = safeUseState<readonly ScenarioSelectOption[]>([]);
  const isGraphLocked = isStudioGraphLocked({ isRunning, isLaunchLocked });
  const { isSaved, markSaved, markLoaded } = useScenarioSaveState(doc);

  safeUseEffect(() => {
    if (isGraphLocked) setPendingPort(null);
  }, [isGraphLocked]);

  safeUseEffect(() => {
    if (!client) return;
    let cancelled = false;
    void (async () => {
      try {
        const options = await fetchScenarioSelectOptions(client);
        if (!cancelled) setScenarioOptions(options);
      } catch (err: unknown) {
        void err;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const { boardContainerRef, wirePreview, viewport } = useScenarioExecution({
    scenarioId,
    client,
    doc,
    setDoc: (fn) => setDoc(fn),
    setIsRunning,
    setLaunchLocked,
    isGraphLocked,
    setBusyMessage: (message) => {
      if (message) setSaveMessage(message);
    },
    onSelectNode: (nodeId) => setSelectedNodeId(nodeId),
    onLoaded: markLoaded,
  });

  const handleAddNode = (type: NodeType) => {
    if (isGraphLocked) return;
    setDoc((prev) => {
      const res = addBlock(prev, type, { x: 80 + prev.nodes.length * 280, y: 120 });
      return res.ok ? res.document : prev;
    });
  };

  const handlePortClick = (nodeId: string, type: 'input' | 'output', portIndex: number) => {
    if (isGraphLocked) {
      setPendingPort(null);
      return;
    }
    if (!pendingPort) {
      if (type === 'output') setPendingPort({ nodeId, portIndex });
      return;
    }
    if (type === 'input' && pendingPort.nodeId !== nodeId) {
      setDoc((prev) => {
        const res = wireOriented(prev, {
          sourceNodeId: pendingPort.nodeId,
          sourcePortIndex: pendingPort.portIndex,
          targetNodeId: nodeId,
          targetPortIndex: portIndex,
        });
        return res.ok ? res.document : prev;
      });
    }
    setPendingPort(null);
  };

  const handleSave = async () => {
    if (!client || isGraphLocked) return;
    const payload = buildScenarioPersistPayload(doc);
    try {
      await client.put(`/api/scenarios/${scenarioId}`, payload);
      markSaved();
      setSaveMessage('Scénario enregistré.');
      setTimeout(() => setSaveMessage(null), 2500);
      const options = await fetchScenarioSelectOptions(client);
      setScenarioOptions(options);
    } catch (err: unknown) {
      try {
        await client.post('/api/scenarios', payload);
        markSaved();
        setSaveMessage('Scénario créé.');
        setTimeout(() => setSaveMessage(null), 2500);
        const options = await fetchScenarioSelectOptions(client);
        setScenarioOptions(options);
      } catch (inner: unknown) {
        setSaveMessage(inner instanceof Error ? inner.message : String(err));
      }
    }
  };

  const handleLaunch = async () => {
    if (isRunning || isLaunchLocked || !client) return;
    if (!isSaved) {
      setSaveMessage('Veuillez enregistrer le scénario avant de le lancer.');
      return;
    }
    setIsRunning(true);
    setLaunchLocked(true);
    try {
      const res = await tryLaunchScenario(doc, client);
      if (!res.ok) {
        setIsRunning(false);
        setLaunchLocked(false);
        if (res.error) setSaveMessage(res.error);
      }
    } catch (err: unknown) {
      setIsRunning(false);
      setLaunchLocked(false);
      setSaveMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStop = async () => {
    if (!client) return;
    try {
      await client.del(`/api/scenarios/${scenarioId}/run`);
      setIsRunning(false);
      setLaunchLocked(false);
      setSaveMessage(null);
    } catch (err: unknown) {
      void err;
      setIsRunning(false);
      setLaunchLocked(false);
    }
  };

  const handleUpdateNode = (updated: ScenarioNode) => {
    if (isGraphLocked) return;
    setDoc((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === updated.id ? updated : n)),
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    if (isGraphLocked) return;
    setDoc((prev) => removeBlock(prev, nodeId));
    setSelectedNodeId(null);
  };

  useKeyboardDeleteNode({ isGraphLocked, selectedNodeId, onDeleteNode: handleDeleteNode });

  const handleRenameScenario = (newName: string) => {
    if (isGraphLocked) return;
    setDoc((prev) => ({ ...prev, name: newName }));
  };

  const scenarioView: Scenario = {
    id: doc.scenarioId,
    name: doc.name || doc.scenarioId,
    nodes: [...doc.nodes],
    connections: [...doc.connections],
  };

  return (
    <div
      className="scenario-studio relative w-full h-[calc(100vh-48px)] flex flex-col overflow-hidden bg-surface-canvas select-none"
      data-graph-locked={isGraphLocked ? 'true' : 'false'}
    >
      <div data-action="run-scenario">
        <CanvasToolbar
          scenarioName={doc.name || doc.scenarioId}
          onRenameScenario={handleRenameScenario}
          isRunning={isRunning || isLaunchLocked}
          isGraphLocked={isGraphLocked}
          canLaunch={doc.nodes.length > 0 && !isLaunchLocked && isSaved}
          isSaved={isSaved}
          isSavePrompted={doc.nodes.length > 0 && !isLaunchLocked && isSaved === false}
          hasStartNode={doc.nodes.some((n) => n.type === 'start')}
          onAddNode={handleAddNode}
          onLaunch={handleLaunch}
          onStop={handleStop}
          onSave={handleSave}
        />
      </div>

      {saveMessage && (
        <div
          role="status"
          className="absolute top-14 left-6 z-40 px-3 py-1.5 rounded bg-surface-panel border border-border-default text-xs text-on-surface"
        >
          {saveMessage}
        </div>
      )}

      <div className="relative flex-1 w-full h-full overflow-hidden" ref={boardContainerRef}>
        <CanvasBoard
          scenario={scenarioView}
          viewport={viewport}
          selectedNodeId={selectedNodeId}
          selectedConnectionIndex={selectedConnectionIndex}
          wirePreview={wirePreview}
          isInteractionLocked={isGraphLocked}
          onSelectNode={(nodeId) => {
            setSelectedNodeId(nodeId);
            setSelectedConnectionIndex(null);
          }}
          onSelectConnection={(index) => {
            if (isGraphLocked) return;
            setSelectedConnectionIndex(index);
            setSelectedNodeId(null);
          }}
          onDeleteConnection={(index) => {
            if (isGraphLocked) return;
            setDoc((prev) => removeConnection(prev, index));
            setSelectedConnectionIndex(null);
          }}
          onClearConnectionSelection={() => setSelectedConnectionIndex(null)}
          onPortClick={handlePortClick}
        />

        <InspectorPanel
          scenario={scenarioView}
          selectedNodeId={selectedNodeId}
          isReadOnly={isGraphLocked}
          onUpdate={handleUpdateNode}
          onClose={() => setSelectedNodeId(null)}
          onDeleteNode={handleDeleteNode}
          currentScenarioId={scenarioId}
          scenarioOptions={scenarioOptions}
        />
      </div>

      <div className="h-48 transition-all duration-200 z-30">
        <TerminalView scenarioId={scenarioId} client={client} />
      </div>
    </div>
  );
}

export { ScenarioStudioPage };
