/**
 * CASE-ARCH-07-1 — Complexité cyclomatique bornée (CC ≤ 10 ou
 * `@complexityExemption`) et profondeur d'imbrication ≤ 3 (non exemptable)
 * (`AC-ARCH-07-1` / `SPEC-ARCH-07`).
 *
 * Formule Données / SPEC : CC = 1 + Σ(If, For, ForIn, ForOf, While, DoWhile,
 * Catch, Conditional, Logical &&/||, SwitchCase).
 * Allow-list imbrication : If, Switch, For, ForIn, ForOf, While, DoWhile, Try,
 * Conditional (max 3 ; reset sur frame enfant ; catch/finally n'incrémentent pas).
 *
 * Analyse structurelle (brace-matching) — pas de dépendance `typescript`
 * (POINT-065).
 *
 * Nom de test : contrat fiche CASE (= prompt §1, alignés).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

const CC_MAX = 10;
const NESTING_MAX = 3;

/** Résultat d'audit CC + imbrication. */
interface CyclomaticComplexityAndNestingAnalysis {
  /**
   * Fonctions avec CC > 10 sans `@complexityExemption` TSDoc précédent
   * (clause Alors / table Données).
   */
  readonly ccViolationWithoutExemptionCount: number;
  /**
   * Fonctions dont la profondeur d'imbrication dépasse 3
   * (clause Et — non exemptable).
   */
  readonly nestingDepthViolationCount: number;
  /** Violations détaillées pour le reporting d'audit. */
  readonly violationsByCheck: {
    readonly ccViolations: readonly ArchitectureViolation[];
    readonly nestingViolations: readonly ArchitectureViolation[];
  };
}

interface FunctionBodySpan {
  readonly declStart: number;
  /** Texte du corps (hors accolades externes pour blocs `{…}`). */
  readonly bodyText: string;
}

const COMPLEXITY_EXEMPTION_RE = /@complexityExemption\b/u;
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

function skipStringLiteral(source: string, start: number, quote: string): number {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === quote) {
      return index + 1;
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
  return index;
}

function skipBalancedParens(source: string, openIndex: number): number {
  let depth = 0;
  let index = openIndex;
  while (index < source.length) {
    const char = source[index];
    if (char === '/' && source[index + 1] === '/') {
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

function skipBalancedBraces(source: string, openIndex: number): number {
  let depth = 0;
  let index = openIndex;
  while (index < source.length) {
    const char = source[index];
    if (char === '/' && source[index + 1] === '/') {
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

function isIdentBoundaryBefore(source: string, index: number): boolean {
  if (index <= 0) {
    return true;
  }
  return !/[\w$]/u.test(source[index - 1] ?? '');
}

function hasComplexityExemptionInPrecedingTsDoc(source: string, declStart: number): boolean {
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
      return COMPLEXITY_EXEMPTION_RE.test(source.slice(cursor - 1, blockEnd));
    }
    cursor -= 1;
  }
  return false;
}

/**
 * Saute une déclaration de fonction/méthode/flèche imbriquée complète
 * (corps exclu du CC / nesting du frame parent — SPEC-ARCH-07).
 */
function trySkipNestedFunction(source: string, index: number): number {
  const slice = source.slice(index);
  const fnMatch = /^(async\s+)?function\b\s*\*?/u.exec(slice);
  if (fnMatch !== null && isIdentBoundaryBefore(source, index)) {
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
      if (source[cursor] === '{') {
        return skipBalancedBraces(source, cursor);
      }
      if (source[cursor] === '=' && source[cursor + 1] === '>') {
        cursor += 2;
        while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
          cursor += 1;
        }
        if (source[cursor] === '{') {
          return skipBalancedBraces(source, cursor);
        }
        return cursor;
      }
    }
  }

  if (source[index] === '=' && source[index + 1] === '>') {
    let cursor = index + 2;
    while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
      cursor += 1;
    }
    if (source[cursor] === '{') {
      return skipBalancedBraces(source, cursor);
    }
    return cursor;
  }

  return -1;
}

/**
 * Métriques CC + nesting d'un corps de fonction (frame courant).
 * Les corps imbriqués sont sautés (CC indépendant / nesting reset).
 */
function analyzeBodyMetrics(body: string): {
  readonly cc: number;
  readonly maxNesting: number;
} {
  let cc = 1;
  let nesting = 0;
  let maxNesting = 0;
  /** Prochain `{` de contrôle (if/for/while/switch/try/do) → +1 nesting. */
  let pendingControlNest = false;
  /** Prochain `{` de `catch`/`finally` → nesting inchangé (SPEC). */
  let pendingSameLevelBlock = false;
  /** Pile : `true` = frame allow-list à décrémenter à la fermeture. */
  const nestStack: boolean[] = [];
  /** Compteur ternaires ouverts (ConditionalExpression). */
  let openTernaries = 0;
  let index = 0;

  const bumpNesting = (): void => {
    nesting += 1;
    if (nesting > maxNesting) {
      maxNesting = nesting;
    }
  };

  while (index < body.length) {
    const char = body[index];

    if (char === '/' && body[index + 1] === '/') {
      index += 2;
      while (index < body.length && body[index] !== '\n') {
        index += 1;
      }
      continue;
    }
    if (char === '/' && body[index + 1] === '*') {
      index += 2;
      while (index + 1 < body.length && !(body[index] === '*' && body[index + 1] === '/')) {
        index += 1;
      }
      index += 2;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      index = skipStringLiteral(body, index, char);
      continue;
    }

    const nestedEnd = trySkipNestedFunction(body, index);
    if (nestedEnd > index) {
      index = nestedEnd;
      continue;
    }

    // LogicalExpression && / ||
    if ((char === '&' && body[index + 1] === '&') || (char === '|' && body[index + 1] === '|')) {
      cc += 1;
      index += 2;
      continue;
    }

    // ConditionalExpression `?` (pas `?.`, `??`, ni `?:` optionnel TS)
    if (char === '?' && body[index + 1] !== '?' && body[index + 1] !== '.') {
      let look = index + 1;
      while (look < body.length && /\s/u.test(body[look] ?? '')) {
        look += 1;
      }
      if (body[look] === ':') {
        index = look;
        continue;
      }
      cc += 1;
      bumpNesting();
      openTernaries += 1;
      index += 1;
      continue;
    }

    // Clôture approximation ternaire au `:` apparié (évite labels `case:` déjà gérés)
    if (char === ':' && openTernaries > 0) {
      openTernaries -= 1;
      nesting = Math.max(0, nesting - 1);
      index += 1;
      continue;
    }

    if (/[A-Za-z_]/u.test(char ?? '') && isIdentBoundaryBefore(body, index)) {
      const rest = body.slice(index);
      const kw = /^(if|for|while|switch|try|do|catch|finally|case|default|else)\b/u.exec(rest);
      if (kw !== null) {
        const word = kw[1] ?? '';
        index += word.length;

        if (word === 'else') {
          // `else` seul : le bloc else prolonge IfStatement (pas +1 AST).
          // `else if` : le `if` suivant gère CC + nesting.
          continue;
        }

        if (word === 'case') {
          cc += 1;
          continue;
        }
        if (word === 'default') {
          while (index < body.length && /\s/u.test(body[index] ?? '')) {
            index += 1;
          }
          if (body[index] === ':') {
            cc += 1;
            index += 1;
          }
          continue;
        }

        if (word === 'catch' || word === 'finally') {
          if (word === 'catch') {
            cc += 1;
          }
          pendingSameLevelBlock = true;
          continue;
        }

        if (word === 'try') {
          pendingControlNest = true;
          continue;
        }

        if (
          word === 'if' ||
          word === 'for' ||
          word === 'while' ||
          word === 'switch' ||
          word === 'do'
        ) {
          if (word !== 'switch') {
            cc += 1;
          }
          pendingControlNest = true;
          continue;
        }
      }
    }

    if (char === '{') {
      if (pendingSameLevelBlock) {
        pendingSameLevelBlock = false;
        nestStack.push(false);
      } else if (pendingControlNest) {
        pendingControlNest = false;
        bumpNesting();
        nestStack.push(true);
      } else {
        nestStack.push(false);
      }
      index += 1;
      continue;
    }

    if (char === '}') {
      if (nestStack.length > 0) {
        const wasNest = nestStack.pop();
        if (wasNest === true) {
          nesting = Math.max(0, nesting - 1);
        }
      }
      index += 1;
      continue;
    }

    index += 1;
  }

  return { cc, maxNesting };
}

function collectFunctionBodies(source: string): readonly FunctionBodySpan[] {
  const bodies: FunctionBodySpan[] = [];
  let index = 0;

  const pushBlock = (declStart: number, open: number, closeEnd: number): void => {
    const inner = source.slice(open + 1, closeEnd - 1);
    bodies.push({ declStart, bodyText: inner });
    // Fonctions imbriquées = frames indépendants
    for (const nested of collectFunctionBodies(inner)) {
      bodies.push({
        declStart: open + 1 + nested.declStart,
        bodyText: nested.bodyText,
      });
    }
  };

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

    if (/[A-Za-z_]/u.test(char ?? '')) {
      const fnMatch = /^(async\s+)?function\b\s*\*?/u.exec(source.slice(index));
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
            pushBlock(declStart, open, closeEnd);
            index = closeEnd;
            continue;
          }
        }
      }
    }

    if (char === '=' && source[index + 1] === '>') {
      const declStart = index;
      let cursor = index + 2;
      while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
        cursor += 1;
      }
      if (source[cursor] === '{') {
        const open = cursor;
        const closeEnd = skipBalancedBraces(source, open);
        pushBlock(declStart, open, closeEnd);
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
            pushBlock(Math.max(0, declStart), open, closeEnd);
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

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function extractDeclSymbolName(source: string, declStart: number): string {
  const slice = source.slice(declStart, Math.min(source.length, declStart + 120));
  const fnMatch =
    /(?:function\s*\*?\s*|const\s+|let\s+|var\s+)?([A-Za-z_$][\w$]*)\s*(?:=|:|\()/u.exec(slice);
  if (fnMatch?.[1] !== undefined) {
    return fnMatch[1];
  }
  return 'anonyme';
}

function analyzeCyclomaticComplexityAndNesting(
  srcRoot: string,
): CyclomaticComplexityAndNestingAnalysis {
  let ccViolationWithoutExemptionCount = 0;
  let nestingDepthViolationCount = 0;

  const ccViolations: ArchitectureViolation[] = [];
  const nestingViolations: ArchitectureViolation[] = [];

  for (const absolute of listTypeScriptFiles(srcRoot)) {
    const source = fs.readFileSync(absolute, 'utf8');
    const relFile = path.relative(srcRoot, absolute);

    for (const body of collectFunctionBodies(source)) {
      const metrics = analyzeBodyMetrics(body.bodyText);
      const line = lineAtOffset(source, body.declStart);
      const symbol = extractDeclSymbolName(source, body.declStart);

      if (metrics.cc > CC_MAX) {
        const exempt = hasComplexityExemptionInPrecedingTsDoc(source, body.declStart);
        if (!exempt) {
          ccViolationWithoutExemptionCount += 1;
          ccViolations.push({
            file: relFile,
            line,
            symbol,
            message: `Complexité cyclomatique excessive (CC = ${metrics.cc} > ${CC_MAX}) sans @complexityExemption`,
          });
        }
      }
      if (metrics.maxNesting > NESTING_MAX) {
        nestingDepthViolationCount += 1;
        nestingViolations.push({
          file: relFile,
          line,
          symbol,
          message: `Profondeur d'imbrication AST excessive (${metrics.maxNesting} > ${NESTING_MAX}, non exemptable)`,
        });
      }
    }
  }

  return {
    ccViolationWithoutExemptionCount,
    nestingDepthViolationCount,
    violationsByCheck: {
      ccViolations,
      nestingViolations,
    },
  };
}

describe('CASE-ARCH-07-1 — CC ≤ 10 / imbrication ≤ 3 (SPEC-ARCH-07)', () => {
  it('test_CASE_ARCH_07_1_cyclomatic_complexity_and_nesting_depth', () => {
    const srcRoot = resolveSrcRoot();
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire src introuvable : ${srcRoot}`);
    }

    const analysis = analyzeCyclomaticComplexityAndNesting(srcRoot);

    // Alors chaque fonction respecte CC <= 10 (ou porte "@complexityExemption")
    expect(
      analysis.ccViolationWithoutExemptionCount,
      formatViolationsMessage(
        'Complexité cyclomatique bornée (CC <= 10 ou @complexityExemption)',
        analysis.violationsByCheck.ccViolations,
      ),
    ).toBe(0);

    // Et aucune fonction ne dépasse 3 niveaux d'imbrication AST
    expect(
      analysis.nestingDepthViolationCount,
      formatViolationsMessage(
        "Profondeur d'imbrication AST (<= 3)",
        analysis.violationsByCheck.nestingViolations,
      ),
    ).toBe(0);
  });
});
