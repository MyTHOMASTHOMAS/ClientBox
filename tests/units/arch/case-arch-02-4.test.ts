/**
 * CASE-ARCH-02-4 — Validation topologique pure par DOM-008
 * (unicité Start / degré entrant 0 per R-20) sans accès disque
 * (`AC-ARCH-02-4` / `SPEC-ARCH-02` / `DOM-008`).
 *
 * Module cible (signature-domain.md + disque) :
 * `src/domain/graph/graph-integrity.validator.ts` — la fiche CASE cite par erreur
 * `src/domain/scenarios/graph-integrity.validator.ts` ; Ground Truth = signature / disque.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi (POINT-013).
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

import type { Connection } from '../../../src/types/models/connection.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import { validateGraph } from '../../../src/domain/graph/graph-integrity.validator.js';

/** Oracle table CASE — rejet topologique en français. */
const EXPECTED_FRENCH_REJECTION = 'Erreur en français retournée';

/** Méthodes fs synchrones surveillées pendant validateGraph (zéro I/O). */
const FS_SYNC_METHODS = [
  'accessSync',
  'appendFileSync',
  'chmodSync',
  'copyFileSync',
  'existsSync',
  'lstatSync',
  'mkdirSync',
  'openSync',
  'readdirSync',
  'readFileSync',
  'renameSync',
  'rmSync',
  'rmdirSync',
  'statSync',
  'unlinkSync',
  'writeFileSync',
] as const;

type FsSyncMethod = (typeof FS_SYNC_METHODS)[number];

function node(partial: Pick<ScenarioNode, 'id' | 'type'> & Partial<ScenarioNode>): ScenarioNode {
  return {
    id: partial.id,
    type: partial.type,
    position: partial.position ?? { x: 0, y: 0 },
    agentId: partial.agentId,
    promptId: partial.promptId,
    exitId: partial.exitId,
    ifScriptId: partial.ifScriptId,
    inputs: partial.inputs,
    outputs: partial.outputs,
  };
}

function connection(
  partial: Partial<Connection> & Pick<Connection, 'key' | 'sourceNodeId' | 'targetNodeId'>,
): Connection {
  return {
    sourceNodeId: partial.sourceNodeId,
    sourcePortIndex: partial.sourcePortIndex ?? 0,
    targetNodeId: partial.targetNodeId,
    targetPortIndex: partial.targetPortIndex ?? 0,
    key: partial.key,
  };
}

/**
 * Erreur « explicite en français » : marqueurs lexicaux FR métier
 * (REQ-015 / R-20) ou diacritiques — sans figer le libellé exact.
 */
function isExplicitFrenchError(message: string): boolean {
  if (/[àâäéèêëïîôùûüçœ]/iu.test(message)) {
    return true;
  }
  return /\b(interdite|unique|plusieurs|absent|manquant|graphe|connexion|entrante|détectés|contenir)\b/iu.test(
    message,
  );
}

function hasFrenchRejection(errors: readonly string[]): boolean {
  return errors.length > 0 && errors.every((message) => isExplicitFrenchError(message));
}

/**
 * Compte les appels fs synchrones durant `run` (spies pass-through, ADR-006).
 */
function countDiskAccessDuring(run: () => void): number {
  const spies = FS_SYNC_METHODS.map((method: FsSyncMethod) => vi.spyOn(fs, method));
  try {
    run();
    return spies.reduce((sum, spy) => sum + spy.mock.calls.length, 0);
  } finally {
    for (const spy of spies) {
      spy.mockRestore();
    }
  }
}

describe('CASE-ARCH-02-4 — validateGraph Start unique / R-20 sans I/O (SPEC-ARCH-02)', () => {
  it('test_CASE_ARCH_02_4_graph_validator_start_rules_without_io', () => {
    const twoStarts: readonly ScenarioNode[] = [
      node({ id: 'start-a', type: 'start' }),
      node({ id: 'start-b', type: 'start' }),
    ];

    const startWithIncoming: readonly ScenarioNode[] = [
      node({ id: 'start-1', type: 'start' }),
      node({ id: 'run-1', type: 'run' }),
    ];
    const cableIntoStart: readonly Connection[] = [
      connection({
        key: '0',
        sourceNodeId: 'run-1',
        targetNodeId: 'start-1',
      }),
    ];

    const validNodes: readonly ScenarioNode[] = [
      node({ id: 'start-1', type: 'start' }),
      node({ id: 'run-1', type: 'run' }),
    ];
    const validConnections: readonly Connection[] = [
      connection({
        key: '0',
        sourceNodeId: 'start-1',
        targetNodeId: 'run-1',
      }),
    ];

    let multipleStartErrors: string[] = [];
    let incomingStartErrors: string[] = [];
    let validGraphErrors: string[] = [];

    const diskAccessCount = countDiskAccessDuring(() => {
      multipleStartErrors = validateGraph(twoStarts, []);
      incomingStartErrors = validateGraph(startWithIncoming, cableIntoStart);
      validGraphErrors = validateGraph(validNodes, validConnections);
    });

    const multipleStartRejected = hasFrenchRejection(multipleStartErrors);
    const incomingStartRejected = hasFrenchRejection(incomingStartErrors);

    const violations: ArchitectureViolation[] = [];
    if (!multipleStartRejected) {
      violations.push({
        file: 'src/domain/graph/graph-integrity.validator.ts',
        symbol: 'validateGraph',
        message: 'Rejet en français manquant pour graphe avec plusieurs nœuds Start',
      });
    }
    if (!incomingStartRejected) {
      violations.push({
        file: 'src/domain/graph/graph-integrity.validator.ts',
        symbol: 'validateGraph',
        message: 'Rejet en français manquant pour graphe avec Start à degré entrant > 0',
      });
    }
    if (diskAccessCount > 0) {
      violations.push({
        file: 'src/domain/graph/graph-integrity.validator.ts',
        symbol: 'validateGraph',
        message: `Appels système I/O fs (${diskAccessCount}) détectés pendant la validation pure`,
      });
    }

    const rejectionWithoutIoStatus =
      multipleStartRejected && incomingStartRejected && diskAccessCount === 0
        ? EXPECTED_FRENCH_REJECTION
        : 'REJET_INCOMPLET_OU_I/O';

    const validGraphViolations: ArchitectureViolation[] = validGraphErrors.map((err) => ({
      file: 'src/domain/graph/graph-integrity.validator.ts',
      symbol: 'validateGraph',
      message: `Erreur inattendue sur graphe valide : ${err}`,
    }));

    const validGraphErrorCount = validGraphErrors.length;

    // Alors la fonction retourne des erreurs explicites en français sans accéder au disque
    expect(
      rejectionWithoutIoStatus,
      formatViolationsMessage('Validation topologique sans I/O', violations),
    ).toBe(EXPECTED_FRENCH_REJECTION);

    // Et quand le graphe est valide (Start unique avec degré entrant 0), aucune erreur n'est retournée
    expect(
      validGraphErrorCount,
      formatViolationsMessage('Graphe valide rejeté à tort', validGraphViolations),
    ).toBe(0);
  });
});
