/**
 * CASE-ARCH-07-3 — TSDoc obligatoire sur exports publics (prédicat par kind)
 * et zéro effet de bord à l'importation (`AC-ARCH-07-3` / `SPEC-ARCH-07`).
 *
 * Périmètre Données : symboles exportés sous `src/` ; règle d'import =
 * zéro I/O / logique exécutée au `import`.
 *
 * Gherkin : 2 assertions. L'item checklist « conventions de nommage »
 * est hors contrat (→ `CASE-ARCH-07-2`) — POINT-013 / aucune assertion
 * étrangère.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Résultat d'audit TSDoc exports + effets de bord à l'import. */
interface TsDocExportsAndImportSideEffectsAnalysis {
  /**
   * Exports publics sans TSDoc immédiatement précédent valide
   * (clause Alors / table Données).
   */
  readonly exportWithoutValidTsDocCount: number;
  /**
   * Effets de bord runtime détectés au chargement de module
   * (clause Et).
   */
  readonly importSideEffectCount: number;
}

const EXPORT_DECL_RE =
  /^export\s+(?:async\s+)?(?:function\b|class\b|interface\b|type\b|enum\b|const\b)/u;

/** Appels d'I/O / bootstrap typiques en initialiseur de module. */
const SIDE_EFFECT_CALL_RE =
  /\b(?:createRequire|require|fetch|setTimeout|setInterval|setImmediate|process\.on|fs\.|http\.createServer|createServer|listen)\s*\(/u;

function resolveSrcRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src');
}

function listTypeScriptFiles(rootDir: string): readonly string[] {
  const collected: string[] = [];

  function walk(dir: string): void {
    if (!fs.existsSync(dir)) {
      return;
    }
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

/**
 * Extrait le bloc TSDoc immédiatement précédent la ligne `lineIndex`
 * (0-based), ou `null`.
 */
function extractPrecedingTsDoc(lines: readonly string[], lineIndex: number): string | null {
  let index = lineIndex - 1;
  while (index >= 0 && lines[index]?.trim() === '') {
    index -= 1;
  }
  if (index < 0) {
    return null;
  }
  const endLine = lines[index] ?? '';
  if (!endLine.includes('*/')) {
    return null;
  }

  let start = index;
  while (start >= 0) {
    const line = lines[start] ?? '';
    if (line.includes('/**')) {
      return lines.slice(start, index + 1).join('\n');
    }
    start -= 1;
  }
  return null;
}

function tsDocHasDescription(tsDoc: string): boolean {
  const lines = tsDoc.split(/\r?\n/u);
  for (const line of lines) {
    const trimmed = line
      .replace(/^\s*\/\*\*\s*/u, '')
      .replace(/^\s*\*\s?/u, '')
      .replace(/\*\/\s*$/u, '')
      .trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (trimmed.startsWith('@')) {
      continue;
    }
    return true;
  }
  return false;
}

function functionArityFromLine(line: string): number {
  const open = line.indexOf('(');
  const close = line.indexOf(')');
  if (open < 0 || close < 0 || close <= open) {
    // signature multi-lignes : considérer arity > 0 si `(` présent sans `)`
    if (open >= 0 && close < 0) {
      return 1;
    }
    return 0;
  }
  const inner = line.slice(open + 1, close).trim();
  if (inner.length === 0) {
    return 0;
  }
  return inner.split(',').filter((part) => part.trim().length > 0).length;
}

function isValidTsDocForExport(tsDoc: string | null, exportLine: string): boolean {
  if (tsDoc === null) {
    return false;
  }
  if (!tsDocHasDescription(tsDoc)) {
    return false;
  }

  const isFunction =
    /\bexport\s+(?:async\s+)?function\b/u.test(exportLine) ||
    /\bexport\s+const\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?\(/u.test(exportLine);

  if (isFunction) {
    const arity = functionArityFromLine(exportLine);
    if (arity > 0 && !/@param\b/u.test(tsDoc)) {
      return false;
    }
  }

  return true;
}

function countExportsWithoutValidTsDoc(source: string): number {
  const lines = source.split(/\r?\n/u);
  let count = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = (lines[index] ?? '').trim();
    if (!EXPORT_DECL_RE.test(trimmed)) {
      continue;
    }
    // `export type { ... }` / `export { ... }` : réexport — hors prédicat kind
    if (/^export\s+type\s*\{/u.test(trimmed) || /^export\s*\{/u.test(trimmed)) {
      continue;
    }
    const tsDoc = extractPrecedingTsDoc(lines, index);
    if (!isValidTsDocForExport(tsDoc, trimmed)) {
      count += 1;
    }
  }

  return count;
}

/**
 * Effets de bord au chargement : appels I/O / bootstrap en portée module
 * (profondeur d'accolades = 0), typiquement `createRequire` / `require` /
 * timers / listen.
 */
function countImportSideEffects(source: string): number {
  const code = stripCommentsAndStrings(source);
  let depth = 0;
  let count = 0;
  let index = 0;

  while (index < code.length) {
    const char = code[index];

    if (char === '{') {
      depth += 1;
      index += 1;
      continue;
    }
    if (char === '}') {
      depth = Math.max(0, depth - 1);
      index += 1;
      continue;
    }

    if (depth !== 0) {
      index += 1;
      continue;
    }

    // Éviter les signatures `function foo(` / `class X` / contrôles
    const ahead = code.slice(index);
    if (
      /^(?:export\s+)?(?:async\s+)?function\b/u.test(ahead) ||
      /^(?:export\s+)?(?:abstract\s+)?class\b/u.test(ahead) ||
      /^(?:export\s+)?(?:interface|type|enum)\b/u.test(ahead) ||
      /^(?:if|for|while|switch|catch|return|typeof|throw|new|await)\b/u.test(ahead)
    ) {
      index += 1;
      continue;
    }

    const callMatch = SIDE_EFFECT_CALL_RE.exec(ahead);
    if (callMatch !== null && callMatch.index === 0) {
      count += 1;
      index += callMatch[0].length;
      continue;
    }

    // `const x = createRequire(...)` / `= require(...)`
    const assignCall = /^(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*/u.exec(ahead);
    if (assignCall !== null) {
      const rest = ahead.slice(assignCall[0].length);
      const side = SIDE_EFFECT_CALL_RE.exec(rest);
      if (side !== null && side.index === 0) {
        count += 1;
        index += assignCall[0].length + side[0].length;
        continue;
      }
    }

    index += 1;
  }

  return count;
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface TsDocExportsAndImportSideEffectsAnalysis {
  readonly exportWithoutValidTsDocCount: number;
  readonly importSideEffectCount: number;
  readonly exportViolations: readonly ArchitectureViolation[];
  readonly sideEffectViolations: readonly ArchitectureViolation[];
}

function collectExportsWithoutValidTsDoc(
  filePath: string,
  source: string,
): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const lines = source.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = (lines[index] ?? '').trim();
    if (!EXPORT_DECL_RE.test(trimmed)) {
      continue;
    }
    if (/^export\s+type\s*\{/u.test(trimmed) || /^export\s*\{/u.test(trimmed)) {
      continue;
    }
    const tsDoc = extractPrecedingTsDoc(lines, index);
    if (!isValidTsDocForExport(tsDoc, trimmed)) {
      const symMatch =
        /(?:export\s+)?(?:declare\s+)?(?:async\s+)?(?:function|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)/u.exec(
          trimmed,
        );
      const sym = symMatch?.[1] ?? 'exported symbol';
      violations.push({
        file: filePath,
        line: index + 1,
        symbol: sym,
        message: `Symbole exporté "${sym}" sans bloc TSDoc valide (description et @param si fonction à paramètres)`,
      });
    }
  }

  return violations;
}

function analyzeTsDocExportsAndImportSideEffects(
  srcRoot: string,
): TsDocExportsAndImportSideEffectsAnalysis {
  const exportViolations: ArchitectureViolation[] = [];
  const sideEffectViolations: ArchitectureViolation[] = [];

  for (const absolute of listTypeScriptFiles(srcRoot)) {
    const relative = path.relative(srcRoot, absolute).split(path.sep).join('/');
    const source = fs.readFileSync(absolute, 'utf8');
    const expV = collectExportsWithoutValidTsDoc(`src/${relative}`, source);
    exportViolations.push(...expV);

    const sideCount = countImportSideEffects(source);
    if (sideCount > 0) {
      sideEffectViolations.push({
        file: `src/${relative}`,
        message: `${sideCount} appel(s) de fonction avec effet de bord détecté(s) au niveau racine du module`,
      });
    }
  }

  return {
    exportWithoutValidTsDocCount: exportViolations.length,
    importSideEffectCount: sideEffectViolations.length,
    exportViolations,
    sideEffectViolations,
  };
}

describe('CASE-ARCH-07-3 — TSDoc exports + zéro effet de bord import (SPEC-ARCH-07)', () => {
  it('test_CASE_ARCH_07_3_tsdoc_exports_and_zero_import_side_effects', () => {
    const srcRoot = resolveSrcRoot();
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire src introuvable : ${srcRoot}`);
    }

    const analysis = analyzeTsDocExportsAndImportSideEffects(srcRoot);
    const expMsg = formatViolationsMessage(
      'Symboles exportés sans bloc TSDoc complet adjacent',
      analysis.exportViolations,
    );
    const sideMsg = formatViolationsMessage(
      'Effets de bord détectés au chargement de module',
      analysis.sideEffectViolations,
    );

    // Alors chaque symbole exporté est immédiatement précédé d'un bloc TSDoc valide
    expect(analysis.exportWithoutValidTsDocCount, expMsg).toBe(0);

    // Et l'importation de n'importe quel module sous "src/" ne produit aucun
    // effet de bord runtime
    expect(analysis.importSideEffectCount, sideMsg).toBe(0);
  });
});
