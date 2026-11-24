import { describe, it, expect } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { CanvasDocument } from '../../../src/ui/types/canvas.types.js';
import { CanvasToolbar } from '../../../src/ui/components/canvas/canvas-toolbar.js';
import {
  computeScenarioSnapshot,
  isScenarioSaved,
  useScenarioSaveState,
} from '../../../src/ui/hooks/studio/use-scenario-save-state.hook.js';

describe('use-scenario-save-state — Suivi réactif de synchronisation et blocage du lancement', () => {
  const baseDoc: CanvasDocument = {
    scenarioId: 'sc-test-save',
    name: 'Scénario Test Sauvegarde',
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 50, y: 50 } },
      { id: 'run-1', type: 'run', position: { x: 250, y: 50 }, agentId: 'ag-1' },
    ],
    connections: [
      {
        sourceNodeId: 'start-1',
        sourcePortIndex: 0,
        targetNodeId: 'run-1',
        targetPortIndex: 0,
        key: '0',
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  it('calcule une empreinte déterministe indépendante de la caméra et des statuts de run', () => {
    const snap1 = computeScenarioSnapshot(baseDoc);
    expect(snap1).toBeTruthy();

    // Modification du viewport (Pan / Zoom) : l'empreinte de persistance ne doit pas changer
    const docWithPanZoom: CanvasDocument = {
      ...baseDoc,
      viewport: { x: 340, y: -120, zoom: 1.75 },
    };
    expect(computeScenarioSnapshot(docWithPanZoom)).toBe(snap1);

    // Statut d'exécution éphémère d'un nœud (running/completed) : nettoyé par stripScenarioNodesNoSave
    const docWithRunStatus: CanvasDocument = {
      ...baseDoc,
      nodes: [
        { ...baseDoc.nodes[0]!, status: 'running' } as any,
        { ...baseDoc.nodes[1]!, status: 'idle' } as any,
      ],
    };
    expect(computeScenarioSnapshot(docWithRunStatus)).toBe(snap1);
  });

  it('détecte le statut non-sauvegardé sur un nouveau draft ou après modification', () => {
    // 1. Nouveau draft jamais enregistré (snapshot null) : isSaved = false
    expect(isScenarioSaved(baseDoc, null)).toBe(false);

    // 2. Document synchronisé avec le dernier snapshot : isSaved = true
    const savedSnapshot = computeScenarioSnapshot(baseDoc);
    expect(isScenarioSaved(baseDoc, savedSnapshot)).toBe(true);

    // 3. Déplacement d'un bloc : isSaved devient false
    const movedDoc: CanvasDocument = {
      ...baseDoc,
      nodes: [
        baseDoc.nodes[0]!,
        { ...baseDoc.nodes[1]!, position: { x: 300, y: 100 } },
      ],
    };
    expect(isScenarioSaved(movedDoc, savedSnapshot)).toBe(false);

    // 4. Renommage du scénario : isSaved devient false
    const renamedDoc: CanvasDocument = {
      ...baseDoc,
      name: 'Nouveau Nom Modifié',
    };
    expect(isScenarioSaved(renamedDoc, savedSnapshot)).toBe(false);

    // 5. Ajout d'un bloc : isSaved devient false
    const addedNodeDoc: CanvasDocument = {
      ...baseDoc,
      nodes: [
        ...baseDoc.nodes,
        { id: 'if-1', type: 'if', position: { x: 500, y: 50 } },
      ],
    };
    expect(isScenarioSaved(addedNodeDoc, savedSnapshot)).toBe(false);

    // 6. Suppression de bloc : isSaved devient false
    const removedNodeDoc: CanvasDocument = {
      ...baseDoc,
      nodes: [baseDoc.nodes[0]!],
    };
    expect(isScenarioSaved(removedNodeDoc, savedSnapshot)).toBe(false);

    // 7. Rétablissement de l'état d'origine : isSaved redevient true
    expect(isScenarioSaved(baseDoc, savedSnapshot)).toBe(true);
  });

  it('gère le cycle de vie complet de persistance', () => {
    let savedSnapshot: string | null = null;

    // 1. Initialisation (draft non sauvegardé)
    expect(isScenarioSaved(baseDoc, savedSnapshot)).toBe(false);

    // 2. Chargement d'un scénario existant depuis le disque
    savedSnapshot = computeScenarioSnapshot(baseDoc);
    expect(isScenarioSaved(baseDoc, savedSnapshot)).toBe(true);

    // 3. Modification en mémoire
    const modifiedDoc: CanvasDocument = {
      ...baseDoc,
      name: 'Scénario Modifié',
    };
    expect(isScenarioSaved(modifiedDoc, savedSnapshot)).toBe(false);

    // 4. Sauvegarde réussie (PUT / POST)
    savedSnapshot = computeScenarioSnapshot(modifiedDoc);
    expect(isScenarioSaved(modifiedDoc, savedSnapshot)).toBe(true);

    // 5. Instanciation du hook sans erreur
    const hook = useScenarioSaveState(baseDoc);
    expect(hook).toBeDefined();
    expect(typeof hook.markSaved).toBe('function');
    expect(typeof hook.markLoaded).toBe('function');
  });

  it('active l animation de pulsation sobre sur le bouton Enregistrer quand le lancement est bloque par un schema non sauvegarde', () => {
    // 1. Schéma sauvegardé : bouton Enregistrer standard
    const savedToolbar = (CanvasToolbar as any)({
      canLaunch: true,
      isSaved: true,
      onSave: () => {},
    });
    const container = savedToolbar.props.children;
    const saveBtnSaved = container.props.children.find(
      (child: any) => child?.props?.['data-action'] === 'save-scenario',
    );
    expect(saveBtnSaved.props.className).not.toContain('animate-save-pulse');

    // 2. Schéma non sauvegardé bloquant le lancement : pulsation sobre active
    const unsavedToolbar = (CanvasToolbar as any)({
      canLaunch: false,
      isSaved: false,
      isSavePrompted: true,
      onSave: () => {},
    });
    const unsavedContainer = unsavedToolbar.props.children;
    const saveBtnUnsaved = unsavedContainer.props.children.find(
      (child: any) => child?.props?.['data-action'] === 'save-scenario',
    );
    expect(saveBtnUnsaved.props.className).toContain('animate-save-pulse');
    expect(saveBtnUnsaved.props.title).toBe(
      'Veuillez enregistrer le scénario pour pouvoir le lancer.',
    );
  });
});
