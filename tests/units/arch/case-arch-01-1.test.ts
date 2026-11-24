/**
 * CASE-ARCH-01-1 — Validation de l'acyclicité stricte du graphe de dépendances
 * statique (DAG) de l'ensemble de `src/` (`AC-ARCH-01-1` / `SPEC-ARCH-01`).
 *
 * Sujet sous test : totalité des modules TypeScript sous src/ (glob *.ts récursif)
 * (163 modules signés — `tdd/docs/signature/signature.md`), analysés par
 * extraction des imports/exports statiques inter-fichiers.
 * Aucun module analyseur dédié n'existe dans les signatures ; l'analyse
 * statique est réalisée dans ce harnais (réf. `ARCH.md` §SPEC-ARCH-01 —
 * outil d'analyse type madge / eslint-plugin-import).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

/** Statut DAG attendu (oracle CASE-ARCH-01-1, table « Résultat attendu »). */
type DagStatus = 'CONFORME (Acyclique)';

/** Résultat d'analyse du graphe de dépendances statique sous `src/`. */
interface DependencyGraphAnalysis {
  /** Nombre de cycles directs ou transitifs détectés. */
  readonly cycleCount: number;
  /** Statut DAG : conforme uniquement si le graphe est acyclique. */
  readonly status: DagStatus | 'NON_CONFORME';
  /** Profondeur architecturale de référence (8 couches — `signature.md` §3.1). */
  readonly layerCount: number;
  /** Liste détaillée des violations pour le reporting d'audit. */
  readonly violations: readonly ArchitectureViolation[];
}

/** Nombre de couches du DAG architectural ClientsBox (`signature.md` §3.1). */
const ARCH_DAG_LAYER_COUNT = 8;

/** Oracle CASE — nombre de cycles attendu. */
const EXPECTED_CYCLE_COUNT = 0;

/** Oracle CASE — statut DAG attendu. */
const EXPECTED_DAG_STATUS: DagStatus = 'CONFORME (Acyclique)';

/**
 * Capture les spécificateurs d'imports/exports statiques relatifs uniquement
 * (`import … from './x.js'`, `export … from '../y.js'`, `import './side.js'`).
 * Les `import()` dynamiques sont exclus (hors périmètre Gherkin).
 */
const STATIC_RELATIVE_SPECIFIER_RE =
  /(?:import|export)(?:\s+type)?\s+(?:[^'"\n;]+?\s+from\s+)?['"](\.[^'"]+)['"]/g;

function resolveSrcRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src');
}

function listTypeScriptFiles(rootDir: string): readonly string[] {
  const collected: string[] = [];

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        collected.push(path.normalize(absolute));
      }
    }
  }

  walk(rootDir);
  return collected;
}

function resolveRelativeImport(fromFile: string, specifier: string): string | null {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates: readonly string[] = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    base.replace(/\.js$/u, '.ts'),
    base.replace(/\.js$/u, '.tsx'),
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && (candidate.endsWith('.ts') || candidate.endsWith('.tsx'))) {
      return path.normalize(candidate);
    }
  }

  return null;
}

function extractStaticRelativeImports(sourceText: string): readonly string[] {
  const specifiers: string[] = [];
  for (const match of sourceText.matchAll(STATIC_RELATIVE_SPECIFIER_RE)) {
    const specifier = match[1];
    if (specifier !== undefined) {
      specifiers.push(specifier);
    }
  }
  return specifiers;
}

function buildDependencyGraph(
  srcRoot: string,
  files: readonly string[],
): ReadonlyMap<string, readonly string[]> {
  const graph = new Map<string, readonly string[]>();
  const srcPrefix = path.normalize(srcRoot) + path.sep;

  for (const file of files) {
    const sourceText = fs.readFileSync(file, 'utf8');
    const deps = new Set<string>();

    for (const specifier of extractStaticRelativeImports(sourceText)) {
      const resolved = resolveRelativeImport(file, specifier);
      if (
        resolved !== null &&
        (resolved.startsWith(srcPrefix) || resolved === path.normalize(srcRoot))
      ) {
        deps.add(resolved);
      }
    }

    graph.set(file, [...deps]);
  }

  return graph;
}

/**
 * Détection de cycles par DFS (gris = en cours, noir = terminé).
 * Compte chaque cycle simple (retour vers un nœud gris) une fois et collecte la violation.
 */
function findCycles(
  graph: ReadonlyMap<string, readonly string[]>,
  srcRoot: string,
): { cycleCount: number; violations: ArchitectureViolation[] } {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const node of graph.keys()) {
    color.set(node, WHITE);
  }

  let cycleCount = 0;
  const violations: ArchitectureViolation[] = [];

  function dfs(node: string, pathStack: string[]): void {
    color.set(node, GRAY);
    pathStack.push(node);
    const neighbours = graph.get(node) ?? [];
    for (const neighbour of neighbours) {
      if (!graph.has(neighbour)) {
        continue;
      }
      const neighbourColor = color.get(neighbour) ?? WHITE;
      if (neighbourColor === GRAY) {
        cycleCount += 1;
        const cyclePath = pathStack.slice(pathStack.indexOf(neighbour));
        const cycleRel = cyclePath
          .map((p) => path.relative(srcRoot, p))
          .concat(path.relative(srcRoot, neighbour))
          .join(' -> ');
        violations.push({
          file: path.relative(srcRoot, node),
          message: `Cycle de dépendance détecté dans le DAG : ${cycleRel}`,
        });
      } else if (neighbourColor === WHITE) {
        dfs(neighbour, pathStack);
      }
    }
    pathStack.pop();
    color.set(node, BLACK);
  }

  for (const node of graph.keys()) {
    if ((color.get(node) ?? WHITE) === WHITE) {
      dfs(node, []);
    }
  }

  return { cycleCount, violations };
}

function analyzeSrcDependencyGraph(srcRoot: string): DependencyGraphAnalysis {
  const files = listTypeScriptFiles(srcRoot);
  const graph = buildDependencyGraph(srcRoot, files);
  const { cycleCount, violations } = findCycles(graph, srcRoot);
  const isAcyclic = cycleCount === EXPECTED_CYCLE_COUNT;

  return {
    cycleCount,
    status: isAcyclic ? EXPECTED_DAG_STATUS : 'NON_CONFORME',
    layerCount: ARCH_DAG_LAYER_COUNT,
    violations,
  };
}

describe('CASE-ARCH-01-1 — acyclicité stricte du graphe de dépendances src/ (SPEC-ARCH-01)', () => {
  it('test_CASE_ARCH_01_1_dag_acyclic_dependency_graph', () => {
    const srcRoot = resolveSrcRoot();
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire source introuvable : ${srcRoot}`);
    }

    const analysis = analyzeSrcDependencyGraph(srcRoot);

    // Alors le graphe de dépendances complet est strictement acyclique (DAG à 8 niveaux)
    expect(
      {
        status: analysis.status,
        layerCount: analysis.layerCount,
      },
      formatViolationsMessage('Acyclicité du graphe de dépendances (DAG)', analysis.violations),
    ).toEqual({
      status: EXPECTED_DAG_STATUS,
      layerCount: ARCH_DAG_LAYER_COUNT,
    });

    // Et aucun cycle de dépendance direct ou transitif n'est détecté
    expect(
      analysis.cycleCount,
      formatViolationsMessage('Cycles de dépendance statiques (DAG)', analysis.violations),
    ).toBe(EXPECTED_CYCLE_COUNT);
  });
});
