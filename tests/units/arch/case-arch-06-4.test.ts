/**
 * CASE-ARCH-06-4 — Immutabilité stricte des arguments reçus en entrée
 * et absence de mutation *in-place* (`AC-ARCH-06-4` / `SPEC-ARCH-06`).
 *
 * Périmètre Données : fonctions de `src/domain/`, `src/services/`, `src/utils/`
 * (structures complexes objets/tableaux ; `readonly`, clonage, méthodes non mutantes).
 *
 * Oracle : Object.freeze (table Données) + scan structurel des mutations /
 * réassignations de paramètres (checklist CASE).
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_and_no_mutation` ; la fiche CASE fait foi (POINT-013).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

import type { Connection } from '../../../src/types/models/connection.model.js';
import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import type { BlockMessage } from '../../../src/types/messages/block-message.message.js';
import type { PolicyInjectionState } from '../../../src/domain/prompt/injection-policy.evaluator.js';

import { putIncomingMessage } from '../../../src/domain/messages/input-bag.domain.js';
import { renumberDefaultKeys } from '../../../src/domain/keys/key-renumberer.domain.js';
import { updatePolicyState } from '../../../src/domain/prompt/injection-policy.evaluator.js';
import { distributeIfPower } from '../../../src/domain/messages/if-branch-power.dispatcher.js';
import { reindex } from '../../../src/utils/primitives/array.utils.js';

/** Résultat d'audit d'immutabilité des arguments. */
interface FunctionArgumentsImmutabilityAnalysis {
  /**
   * Mutations in-place / altérations d'entrées détectées
   * (clause Alors / table Données — Object.freeze).
   */
  readonly inPlaceMutationViolationCount: number;
  /**
   * Retours non distincts de l'argument d'entrée (même référence)
   * (clause Et).
   */
  readonly nonDistinctReturnViolationCount: number;
  /** Violations détaillées pour le reporting d'audit. */
  readonly violationsByCheck: {
    readonly inPlaceMutations: readonly ArchitectureViolation[];
    readonly nonDistinctReturns: readonly ArchitectureViolation[];
  };
}

const TARGET_LAYER_DIRS = ['domain', 'services', 'utils'] as const;

const MUTATING_METHOD_NAMES = 'push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin';

function resolveSrcRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src');
}

function listLayerTypeScriptFiles(srcRoot: string): readonly string[] {
  const collected: string[] = [];

  for (const layer of TARGET_LAYER_DIRS) {
    const layerRoot = path.join(srcRoot, layer);
    if (!fs.existsSync(layerRoot)) {
      continue;
    }
    const walk = (dir: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(absolute);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          collected.push(path.normalize(absolute));
        }
      }
    };
    walk(layerRoot);
  }

  return collected;
}

function stripCommentsAndStrings(source: string): string {
  const output: string[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (char === '/' && source[index + 1] === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (char === '/' && source[index + 1] === '*') {
      index += 2;
      while (index + 1 < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index += 2;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        if (quote === '`' && source[index] === '$' && source[index + 1] === '{') {
          index += 2;
          let depth = 1;
          while (index < source.length && depth > 0) {
            if (source[index] === '{') {
              depth += 1;
            } else if (source[index] === '}') {
              depth -= 1;
            }
            index += 1;
          }
          continue;
        }
        index += 1;
      }
      continue;
    }

    output.push(char ?? '');
    index += 1;
  }

  return output.join('');
}

function skipBalancedParens(source: string, openIndex: number): number {
  let depth = 0;
  let index = openIndex;
  while (index < source.length) {
    const char = source[index];
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
    index += 1;
  }
  return source.length;
}

function skipBalancedBraces(source: string, openIndex: number): number {
  let depth = 0;
  let index = openIndex;
  while (index < source.length) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
    index += 1;
  }
  return source.length;
}

function extractParamNames(paramList: string): readonly string[] {
  const names: string[] = [];
  const parts = paramList.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const withoutModifiers = trimmed
      .replace(/^readonly\s+/u, '')
      .replace(/^.*\}\s*:\s*/u, '')
      .replace(/^.*\]\s*:\s*/u, '');
    const nameMatch = /^([A-Za-z_$][\w$]*)/u.exec(withoutModifiers);
    if (nameMatch?.[1] !== undefined) {
      names.push(nameMatch[1]);
    }
  }
  return names;
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

/**
 * Scan structurel : réassignation / méthodes mutantes / écriture de propriété
 * sur un identifiant de paramètre dans le corps de fonction.
 */
function findParamMutationSites(
  relPath: string,
  rawSource: string,
  body: string,
  bodyOffset: number,
  params: readonly string[],
): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  for (const param of params) {
    const escaped = param.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const reassignRe = new RegExp(`(?<![.\\w$])${escaped}\\s*=(?!=)`, 'gu');
    const mutatingMethodRe = new RegExp(
      `\\b${escaped}\\s*\\.\\s*(?:${MUTATING_METHOD_NAMES})\\s*\\(`,
      'gu',
    );
    const propWriteRe = new RegExp(`\\b${escaped}\\s*\\.\\s*[A-Za-z_$][\\w$]*\\s*=(?!=)`, 'gu');
    const indexWriteRe = new RegExp(`\\b${escaped}\\s*\\[[^\\]]+\\]\\s*=(?!=)`, 'gu');
    const deleteRe = new RegExp(`\\bdelete\\s+${escaped}\\b`, 'gu');

    for (const pattern of [reassignRe, mutatingMethodRe, propWriteRe, indexWriteRe, deleteRe]) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(body)) !== null) {
        const line = lineAtOffset(rawSource, bodyOffset + (m.index ?? 0));
        violations.push({
          file: relPath,
          line,
          symbol: param,
          message: `Mutation directe du paramètre "${param}" interdite : ${m[0]}`,
        });
      }
    }
  }
  return violations;
}

function findStaticParamMutations(srcRoot: string): {
  count: number;
  violations: ArchitectureViolation[];
} {
  let total = 0;
  const violations: ArchitectureViolation[] = [];

  for (const absolute of listLayerTypeScriptFiles(srcRoot)) {
    const raw = fs.readFileSync(absolute, 'utf8');
    const code = stripCommentsAndStrings(raw);
    const relPath = path.relative(srcRoot, absolute);
    let index = 0;

    while (index < code.length) {
      const fnMatch = /(?:export\s+)?(?:async\s+)?function\b\s*[A-Za-z_$][\w$]*\s*/gu.exec(
        code.slice(index),
      );
      if (fnMatch === null) {
        break;
      }
      const absStart = index + (fnMatch.index ?? 0);
      let cursor = absStart + fnMatch[0].length;
      if (code[cursor] === '<') {
        let depth = 0;
        for (; cursor < code.length; cursor += 1) {
          if (code[cursor] === '<') {
            depth += 1;
          } else if (code[cursor] === '>') {
            depth -= 1;
            if (depth === 0) {
              cursor += 1;
              break;
            }
          }
        }
      }
      while (cursor < code.length && /\s/u.test(code[cursor] ?? '')) {
        cursor += 1;
      }
      if (code[cursor] !== '(') {
        index = absStart + fnMatch[0].length;
        continue;
      }
      const closeParen = skipBalancedParens(code, cursor);
      const paramList = code.slice(cursor + 1, closeParen);
      const params = extractParamNames(paramList);
      let bodyOpen = closeParen + 1;
      while (bodyOpen < code.length && /\s/u.test(code[bodyOpen] ?? '')) {
        bodyOpen += 1;
      }
      if (code[bodyOpen] === ':') {
        bodyOpen += 1;
        let depthAngle = 0;
        while (bodyOpen < code.length) {
          const ch = code[bodyOpen];
          if (ch === '<') {
            depthAngle += 1;
          } else if (ch === '>') {
            depthAngle -= 1;
          } else if (ch === '{' && depthAngle === 0) {
            break;
          }
          bodyOpen += 1;
        }
      }
      if (code[bodyOpen] !== '{') {
        index = closeParen + 1;
        continue;
      }
      const bodyEnd = skipBalancedBraces(code, bodyOpen);
      const body = code.slice(bodyOpen + 1, bodyEnd - 1);
      const muts = findParamMutationSites(relPath, raw, body, bodyOpen + 1, params);
      total += muts.length;
      violations.push(...muts);
      index = bodyEnd;
    }
  }

  return { count: total, violations };
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return value;
}

function snapshotJson(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Sondes runtime Object.freeze sur fonctions manipulant des structures
 * (Données : domain / utils ; services I/O exclus des appels — scan statique seul).
 */
function runFrozenProbes(): {
  readonly inPlaceMutationViolationCount: number;
  readonly nonDistinctReturnViolationCount: number;
  readonly mutationViolations: readonly ArchitectureViolation[];
  readonly returnViolations: readonly ArchitectureViolation[];
} {
  let inPlaceMutationViolationCount = 0;
  let nonDistinctReturnViolationCount = 0;
  const mutationViolations: ArchitectureViolation[] = [];
  const returnViolations: ArchitectureViolation[] = [];

  type Probe = () => void;
  const probes: readonly Probe[] = [
    () => {
      const bag: BlockInputBag = deepFreeze({
        '0': { blockType: 'start', value: null, power: 1 },
      });
      const message: BlockMessage = deepFreeze({
        blockType: 'run',
        value: 'x',
        power: 1,
      });
      const before = snapshotJson(bag);
      let result: BlockInputBag;
      try {
        result = putIncomingMessage(bag, '1', message);
      } catch {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/domain/messages/input-bag.domain.ts',
          symbol: 'putIncomingMessage',
          message: "Erreur lors de la manipulation d'un BlockInputBag figé (Object.freeze)",
        });
        return;
      }
      if (snapshotJson(bag) !== before) {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/domain/messages/input-bag.domain.ts',
          symbol: 'putIncomingMessage',
          message: 'Mutation in-place détectée sur BlockInputBag',
        });
      }
      if (Object.is(result, bag)) {
        nonDistinctReturnViolationCount += 1;
        returnViolations.push({
          file: 'src/domain/messages/input-bag.domain.ts',
          symbol: 'putIncomingMessage',
          message: "Retourne la même référence au lieu d'un nouvel objet",
        });
      }
    },
    () => {
      const connections: Connection[] = deepFreeze([
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-1',
          targetPortIndex: 0,
          key: '0',
        },
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 1,
          targetNodeId: 'run-1',
          targetPortIndex: 0,
          key: '1',
        },
      ]);
      const before = snapshotJson(connections);
      let result: Connection[];
      try {
        result = renumberDefaultKeys(connections, '0');
      } catch {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/domain/keys/key-renumberer.domain.ts',
          symbol: 'renumberDefaultKeys',
          message: "Erreur lors de la manipulation d'un tableau Connection[] figé",
        });
        return;
      }
      if (snapshotJson(connections) !== before) {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/domain/keys/key-renumberer.domain.ts',
          symbol: 'renumberDefaultKeys',
          message: 'Mutation in-place du tableau connections',
        });
      }
      if (Object.is(result, connections)) {
        nonDistinctReturnViolationCount += 1;
        returnViolations.push({
          file: 'src/domain/keys/key-renumberer.domain.ts',
          symbol: 'renumberDefaultKeys',
          message: 'Retourne la même référence Connection[]',
        });
      }
    },
    () => {
      const state: PolicyInjectionState = deepFreeze({
        hasInjectedOnce: false,
        hasInjectedThisScenario: false,
      });
      const before = snapshotJson(state);
      let result: PolicyInjectionState;
      try {
        result = updatePolicyState('chaque_prompt', state, 'run');
      } catch {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/domain/prompt/injection-policy.evaluator.ts',
          symbol: 'updatePolicyState',
          message: 'Erreur lors de la manipulation de PolicyInjectionState figé',
        });
        return;
      }
      if (snapshotJson(state) !== before) {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/domain/prompt/injection-policy.evaluator.ts',
          symbol: 'updatePolicyState',
          message: 'Mutation in-place de PolicyInjectionState',
        });
      }
      if (Object.is(result, state)) {
        nonDistinctReturnViolationCount += 1;
        returnViolations.push({
          file: 'src/domain/prompt/injection-policy.evaluator.ts',
          symbol: 'updatePolicyState',
          message: 'Retourne la même référence PolicyInjectionState',
        });
      }
    },
    () => {
      const truePorts = deepFreeze(['t0', 't1']);
      const falsePorts = deepFreeze(['f0']);
      const beforeTrue = snapshotJson(truePorts);
      const beforeFalse = snapshotJson(falsePorts);
      let result: unknown;
      try {
        result = distributeIfPower(true, truePorts, falsePorts);
      } catch {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/domain/messages/if-branch-power.dispatcher.ts',
          symbol: 'distributeIfPower',
          message: 'Erreur lors de la manipulation de ports figés',
        });
        return;
      }
      if (snapshotJson(truePorts) !== beforeTrue || snapshotJson(falsePorts) !== beforeFalse) {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/domain/messages/if-branch-power.dispatcher.ts',
          symbol: 'distributeIfPower',
          message: 'Mutation in-place des tableaux de ports',
        });
      }
      if (Object.is(result, truePorts) || Object.is(result, falsePorts)) {
        nonDistinctReturnViolationCount += 1;
        returnViolations.push({
          file: 'src/domain/messages/if-branch-power.dispatcher.ts',
          symbol: 'distributeIfPower',
          message: 'Retourne la même référence de tableau de ports',
        });
      }
    },
    () => {
      const arr = deepFreeze([{}, {}, {}]);
      const before = snapshotJson(arr);
      let result: readonly string[];
      try {
        result = reindex(arr);
      } catch {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/utils/array.utils.ts',
          symbol: 'reindex',
          message: "Erreur lors de la manipulation d'un tableau figé",
        });
        return;
      }
      if (snapshotJson(arr) !== before) {
        inPlaceMutationViolationCount += 1;
        mutationViolations.push({
          file: 'src/utils/array.utils.ts',
          symbol: 'reindex',
          message: 'Mutation in-place de tableau dans reindex',
        });
      }
      if (Object.is(result, arr)) {
        nonDistinctReturnViolationCount += 1;
        returnViolations.push({
          file: 'src/utils/array.utils.ts',
          symbol: 'reindex',
          message: 'reindex retourne la même référence de tableau',
        });
      }
    },
  ];

  for (const probe of probes) {
    probe();
  }

  return {
    inPlaceMutationViolationCount,
    nonDistinctReturnViolationCount,
    mutationViolations,
    returnViolations,
  };
}

function analyzeFunctionArgumentsImmutability(
  srcRoot: string,
): FunctionArgumentsImmutabilityAnalysis {
  const staticResult = findStaticParamMutations(srcRoot);
  const runtime = runFrozenProbes();

  return {
    inPlaceMutationViolationCount: staticResult.count + runtime.inPlaceMutationViolationCount,
    nonDistinctReturnViolationCount: runtime.nonDistinctReturnViolationCount,
    violationsByCheck: {
      inPlaceMutations: [...staticResult.violations, ...runtime.mutationViolations],
      nonDistinctReturns: runtime.returnViolations,
    },
  };
}

describe('CASE-ARCH-06-4 — immutabilité des arguments (SPEC-ARCH-06)', () => {
  it('test_CASE_ARCH_06_4_function_arguments_immutability', () => {
    const srcRoot = resolveSrcRoot();
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire src introuvable : ${srcRoot}`);
    }

    const analysis = analyzeFunctionArgumentsImmutability(srcRoot);

    // Alors l'objet passé en entrée conserve exactement ses références et valeurs initiales
    expect(
      analysis.inPlaceMutationViolationCount,
      formatViolationsMessage(
        "Mutations in-place d'arguments de fonction",
        analysis.violationsByCheck.inPlaceMutations,
      ),
    ).toBe(0);

    // Et la fonction retourne un nouvel objet distinct
    expect(
      analysis.nonDistinctReturnViolationCount,
      formatViolationsMessage(
        'Fonctions ne retournant pas de référence distincte',
        analysis.violationsByCheck.nonDistinctReturns,
      ),
    ).toBe(0);
  });
});
