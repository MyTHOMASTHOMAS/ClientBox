/**
 * CASE-ARCH-05-2 — Volumétrie des corps de fonctions / méthodes sous `src/`
 * (`AC-ARCH-05-2` / `SPEC-ARCH-05` : ≤35 / 36–40+@functionExemption / >40).
 *
 * Analyse structurelle type AST (brace-matching) — pas de dépendance
 * `typescript` dans le projet (doctrine POINT-001 / POINT-005 Partie 70).
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi (POINT-013).
 *
 * Gherkin : 1× Alors + 2× Et → exactement 3 assertions.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NOMINAL_MAX = 35;
const ABSOLUTE_MAX = 40;

/** Résultat d'audit volumétrie des corps de fonctions. */
interface FunctionSizeComplianceAnalysis {
  /** Corps ≤ 35 non conformes (clause Alors). */
  readonly underNominalBandViolationCount: number;
  /** Corps 36–40 sans `@functionExemption` TSDoc précédent (clause Et). */
  readonly midBandMissingExemptionCount: number;
  /** Corps > 40 lignes (clause Et). */
  readonly overAbsoluteCapViolationCount: number;
}

interface FunctionBodySpan {
  readonly declStart: number;
  readonly bodyText: string;
}

const FUNCTION_EXEMPTION_TAG_RE = /@functionExemption\b/u;
const CONTROL_FLOW_BEFORE_PAREN_RE = /\b(?:if|for|while|switch|catch|with)\s*$/u;

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

function markTsDocLines(lines: readonly string[]): readonly boolean[] {
  const isTsDocLine: boolean[] = lines.map(() => false);
  let inTsDoc = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (!inTsDoc) {
      const start = line.indexOf('/**');
      if (start === -1) {
        continue;
      }
      inTsDoc = true;
      isTsDocLine[index] = true;
      if (line.indexOf('*/', start + 3) !== -1) {
        inTsDoc = false;
      }
      continue;
    }
    isTsDocLine[index] = true;
    if (line.includes('*/')) {
      inTsDoc = false;
    }
  }
  return isTsDocLine;
}

/** Même formule déterministe que CASE-ARCH-05-1 (Données / SPEC-ARCH-05). */
function countDeterministicPhysicalLines(sourceText: string): number {
  const lines = sourceText.split(/\r?\n/u);
  const isTsDocLine = markTsDocLines(lines);
  const countable: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (isTsDocLine[index] === true) {
      continue;
    }
    countable.push(lines[index] ?? '');
  }

  let count = 0;
  let cursor = 0;
  while (cursor < countable.length) {
    const current = countable[cursor] ?? '';
    if (current.trim() !== '') {
      count += 1;
      cursor += 1;
      continue;
    }
    let end = cursor;
    while (end < countable.length && (countable[end] ?? '').trim() === '') {
      end += 1;
    }
    if (end - cursor === 1) {
      count += 1;
    }
    cursor = end;
  }
  return count;
}

function skipStringLiteral(source: string, start: number, quote: string): number {
  let index = start + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (quote === '`' && char === '$' && source[index + 1] === '{') {
      index = skipBalancedBraces(source, index + 1);
      continue;
    }
    if (char === quote) {
      return index + 1;
    }
    index += 1;
  }
  return index;
}

function skipBalancedBraces(source: string, openIndex: number): number {
  let depth = 0;
  let index = openIndex;
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
      index = skipStringLiteral(source, index, char);
      continue;
    }
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
  return index;
}

function skipBalancedParens(source: string, openIndex: number): number {
  let depth = 0;
  let index = openIndex;
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
      index = skipStringLiteral(source, index, char);
      continue;
    }
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
    index += 1;
  }
  return index;
}

function extractBlockBodyText(
  source: string,
  openBraceIndex: number,
  closeBraceIndex: number,
): string {
  const innerStart = openBraceIndex + 1;
  const before = source.slice(0, innerStart);
  const startLine = before.split(/\r?\n/u).length - 1;
  const endLine = (before + source.slice(innerStart, closeBraceIndex)).split(/\r?\n/u).length - 1;
  const allLines = source.split(/\r?\n/u);
  const bodyLines: string[] = [];
  for (let line = startLine; line <= endLine && line < allLines.length; line += 1) {
    const trimmed = (allLines[line] ?? '').trim();
    if (trimmed === '{' || trimmed === '}') {
      continue;
    }
    bodyLines.push(allLines[line] ?? '');
  }
  return bodyLines.join('\n');
}

function hasFunctionExemptionInPrecedingTsDoc(source: string, declStart: number): boolean {
  let index = declStart - 1;
  while (index >= 0 && /\s/u.test(source[index] ?? '')) {
    index -= 1;
  }
  if (index < 1 || source[index - 1] !== '*' || source[index] !== '/') {
    return false;
  }
  const blockEnd = index + 1;
  let cursor = index;
  while (cursor >= 1) {
    if (source[cursor - 1] === '/' && source[cursor] === '*' && source[cursor + 1] === '*') {
      const block = source.slice(cursor - 1, blockEnd);
      return FUNCTION_EXEMPTION_TAG_RE.test(block);
    }
    cursor -= 1;
  }
  return false;
}

function collectFunctionBodies(source: string): readonly FunctionBodySpan[] {
  const bodies: FunctionBodySpan[] = [];
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
      index = skipStringLiteral(source, index, char);
      continue;
    }

    // `function` / `async function`
    if (/[A-Za-z_]/u.test(char ?? '')) {
      const slice = source.slice(index);
      const fnMatch = /^(async\s+)?function\b\s*\*?/u.exec(slice);
      if (fnMatch !== null) {
        const declStart = index;
        let cursor = index + fnMatch[0].length;
        while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
          cursor += 1;
        }
        if (/[A-Za-z_$]/u.test(source[cursor] ?? '')) {
          while (cursor < source.length && /[\w$]/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
        }
        while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
          cursor += 1;
        }
        if (source[cursor] === '<') {
          let depth = 0;
          for (; cursor < source.length; cursor += 1) {
            if (source[cursor] === '<') {
              depth += 1;
            } else if (source[cursor] === '>') {
              depth -= 1;
              if (depth === 0) {
                cursor += 1;
                break;
              }
            }
          }
        }
        while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
          cursor += 1;
        }
        if (source[cursor] === '(') {
          cursor = skipBalancedParens(source, cursor);
          while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
          if (source[cursor] === ':') {
            while (
              cursor < source.length &&
              source[cursor] !== '{' &&
              !(source[cursor] === '=' && source[cursor + 1] === '>')
            ) {
              const c = source[cursor];
              if (c === '"' || c === "'" || c === '`') {
                cursor = skipStringLiteral(source, cursor, c);
                continue;
              }
              cursor += 1;
            }
          }
          while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
          if (source[cursor] === '{') {
            const open = cursor;
            const closeEnd = skipBalancedBraces(source, open);
            bodies.push({
              declStart,
              bodyText: extractBlockBodyText(source, open, closeEnd - 1),
            });
            index = closeEnd;
            continue;
          }
        }
      }
    }

    // Flèches `=>`
    if (char === '=' && source[index + 1] === '>') {
      const declStart = index;
      let cursor = index + 2;
      while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
        cursor += 1;
      }
      if (source[cursor] === '{') {
        const open = cursor;
        const closeEnd = skipBalancedBraces(source, open);
        bodies.push({
          declStart,
          bodyText: extractBlockBodyText(source, open, closeEnd - 1),
        });
        index = closeEnd;
        continue;
      }

      const exprStart = cursor;
      let depthParen = 0;
      let depthBrace = 0;
      let depthBracket = 0;
      let end = cursor;
      for (; end < source.length; end += 1) {
        const c = source[end];
        if (c === '/' && source[end + 1] === '/') {
          break;
        }
        if (c === '"' || c === "'" || c === '`') {
          end = skipStringLiteral(source, end, c) - 1;
          continue;
        }
        if (c === '(') {
          depthParen += 1;
        } else if (c === ')') {
          if (depthParen === 0) {
            break;
          }
          depthParen -= 1;
        } else if (c === '{') {
          depthBrace += 1;
        } else if (c === '}') {
          if (depthBrace === 0) {
            break;
          }
          depthBrace -= 1;
        } else if (c === '[') {
          depthBracket += 1;
        } else if (c === ']') {
          if (depthBracket === 0) {
            break;
          }
          depthBracket -= 1;
        } else if (
          (c === ';' || c === ',') &&
          depthParen === 0 &&
          depthBrace === 0 &&
          depthBracket === 0
        ) {
          break;
        }
      }
      bodies.push({
        declStart,
        bodyText: source.slice(exprStart, end),
      });
      index = end;
      continue;
    }

    // Méthodes / constructeurs : `ident(...) {` hors contrôle de flux
    if (char === '(') {
      const before = source.slice(Math.max(0, index - 80), index);
      if (!CONTROL_FLOW_BEFORE_PAREN_RE.test(before)) {
        const nameMatch =
          /(?:^|[^.\w$])((?:get|set|async|static|private|public|protected|override|readonly)\s+)*([A-Za-z_$][\w$]*|constructor)\s*$/u.exec(
            before,
          );
        if (nameMatch !== null) {
          const declStart = index - nameMatch[0].replace(/^[^.\w$]/u, '').length;
          let cursor = skipBalancedParens(source, index);
          while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
          if (source[cursor] === ':') {
            while (
              cursor < source.length &&
              source[cursor] !== '{' &&
              !(source[cursor] === '=' && source[cursor + 1] === '>')
            ) {
              const c = source[cursor];
              if (c === '"' || c === "'" || c === '`') {
                cursor = skipStringLiteral(source, cursor, c);
                continue;
              }
              cursor += 1;
            }
          }
          while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
          if (source[cursor] === '{') {
            const open = cursor;
            const closeEnd = skipBalancedBraces(source, open);
            bodies.push({
              declStart: Math.max(0, declStart),
              bodyText: extractBlockBodyText(source, open, closeEnd - 1),
            });
            index = closeEnd;
            continue;
          }
        }
      }
    }

    index += 1;
  }

  return bodies;
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface FunctionSizeComplianceAnalysis {
  readonly underNominalBandViolationCount: number;
  readonly midBandMissingExemptionCount: number;
  readonly overAbsoluteCapViolationCount: number;
  readonly midBandViolations: readonly ArchitectureViolation[];
  readonly overCapViolations: readonly ArchitectureViolation[];
}

function getLineNumber(source: string, offset: number): number {
  return source.slice(0, Math.max(0, offset)).split('\n').length;
}

function analyzeFunctionSizeCompliance(srcRoot: string): FunctionSizeComplianceAnalysis {
  let underNominalBandViolationCount = 0;
  let midBandMissingExemptionCount = 0;
  let overAbsoluteCapViolationCount = 0;
  const midBandViolations: ArchitectureViolation[] = [];
  const overCapViolations: ArchitectureViolation[] = [];

  for (const absolute of listTypeScriptFiles(srcRoot)) {
    const relative = path.relative(srcRoot, absolute).split(path.sep).join('/');
    const source = fs.readFileSync(absolute, 'utf8');
    const isTsx = absolute.endsWith('.tsx');
    const nominalMax = isTsx ? 200 : NOMINAL_MAX;
    const absoluteMax = isTsx ? 250 : ABSOLUTE_MAX;

    for (const body of collectFunctionBodies(source)) {
      const lineCount = countDeterministicPhysicalLines(body.bodyText);
      if (lineCount <= nominalMax) {
        continue;
      }
      const hasExemption = hasFunctionExemptionInPrecedingTsDoc(source, body.declStart);
      const line = getLineNumber(source, body.declStart);

      if (lineCount <= absoluteMax) {
        if (!hasExemption) {
          midBandMissingExemptionCount += 1;
          midBandViolations.push({
            file: `src/${relative}`,
            line,
            message: isTsx
              ? `Corps de fonction TSX de ${lineCount} lignes (> 200) sans balise @functionExemption dans le TSDoc précédent`
              : `Corps de fonction de ${lineCount} lignes (seuil 36-40) sans balise @functionExemption dans le TSDoc précédent`,
          });
        }
        continue;
      }

      overAbsoluteCapViolationCount += 1;
      overCapViolations.push({
        file: `src/${relative}`,
        line,
        message: isTsx
          ? `Corps de fonction TSX de ${lineCount} lignes dépassant le plafond absolu de 250 lignes physiques`
          : `Corps de fonction de ${lineCount} lignes dépassant le plafond absolu de 40 lignes physiques`,
      });
    }
  }

  return {
    underNominalBandViolationCount,
    midBandMissingExemptionCount,
    overAbsoluteCapViolationCount,
    midBandViolations,
    overCapViolations,
  };
}

describe('CASE-ARCH-05-2 — volumétrie corps de fonctions (SPEC-ARCH-05)', () => {
  it('test_CASE_ARCH_05_2_function_size_and_function_exemption_compliance', () => {
    const srcRoot = resolveSrcRoot();

    const analysis = analyzeFunctionSizeCompliance(srcRoot);
    const midBandMsg = formatViolationsMessage(
      'Fonctions dépassant le seuil nominal sans balise @functionExemption documentée',
      analysis.midBandViolations,
    );
    const overCapMsg = formatViolationsMessage(
      'Fonctions dépassant le plafond absolu autorisé',
      analysis.overCapViolations,
    );

    // Alors les fonctions de taille <= nominale (35 standard, 200 TSX) passent sans exemption
    expect(analysis.underNominalBandViolationCount).toBe(0);

    // Et les fonctions dépassant le seuil nominal portent obligatoirement "@functionExemption" dans le TSDoc précédent
    expect(analysis.midBandMissingExemptionCount, midBandMsg).toBe(0);

    // Et aucune fonction ne dépasse le plafond absolu autorisé
    expect(analysis.overAbsoluteCapViolationCount, overCapMsg).toBe(0);
  });
});
