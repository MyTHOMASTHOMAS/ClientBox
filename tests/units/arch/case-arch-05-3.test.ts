/**
 * CASE-ARCH-05-3 — Arité des fonctions bornée (≤ 3 paramètres positionnels)
 * (`AC-ARCH-05-3` / `SPEC-ARCH-05`).
 *
 * Analyse structurelle des signatures (brace/paren-matching) — pas de
 * dépendance `typescript` (doctrine POINT-001 / POINT-065 Partie 70).
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi (POINT-013).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_POSITIONAL_ARITY = 3;

/** Résultat d'audit d'arité des signatures. */
interface FunctionArityComplianceAnalysis {
  /**
   * Signatures avec ≥ 4 paramètres positionnels
   * (clause Alors).
   */
  readonly functionsWithExcessPositionalArityCount: number;
  /**
   * Signatures nécessitant ≥ 4 entrées sans objet d'options typé
   * (clause Et — équivalent opérationnel : arité positionnelle ≥ 4).
   */
  readonly functionsMissingTypedOptionsEncapsulationCount: number;
}

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

/**
 * Compte les paramètres positionnels (virgules de premier niveau).
 * Exclut le paramètre `this` TypeScript.
 */
function countPositionalParameters(parameterListSource: string): number {
  let depthAngle = 0;
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  const parts: string[] = [];
  let current = '';

  for (let index = 0; index < parameterListSource.length; index += 1) {
    const char = parameterListSource[index] ?? '';

    if (char === '/' && parameterListSource[index + 1] === '/') {
      while (index < parameterListSource.length && parameterListSource[index] !== '\n') {
        index += 1;
      }
      continue;
    }
    if (char === '/' && parameterListSource[index + 1] === '*') {
      index += 2;
      while (
        index + 1 < parameterListSource.length &&
        !(parameterListSource[index] === '*' && parameterListSource[index + 1] === '/')
      ) {
        index += 1;
      }
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      current += char;
      index += 1;
      while (index < parameterListSource.length) {
        const inner = parameterListSource[index] ?? '';
        current += inner;
        if (inner === '\\') {
          index += 1;
          current += parameterListSource[index] ?? '';
          index += 1;
          continue;
        }
        if (inner === quote) {
          break;
        }
        index += 1;
      }
      continue;
    }

    if (char === '<') {
      depthAngle += 1;
    } else if (char === '>') {
      depthAngle = Math.max(0, depthAngle - 1);
    } else if (char === '(') {
      depthParen += 1;
    } else if (char === ')') {
      depthParen -= 1;
    } else if (char === '{') {
      depthBrace += 1;
    } else if (char === '}') {
      depthBrace -= 1;
    } else if (char === '[') {
      depthBracket += 1;
    } else if (char === ']') {
      depthBracket -= 1;
    } else if (
      char === ',' &&
      depthAngle === 0 &&
      depthParen === 0 &&
      depthBrace === 0 &&
      depthBracket === 0
    ) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts.filter((part) => part.length > 0 && !/^this(\s|:)/u.test(part)).length;
}

function collectParameterListSources(source: string): readonly string[] {
  const lists: string[] = [];
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

    if (/[A-Za-z_]/u.test(char ?? '')) {
      const fnMatch = /^(async\s+)?function\b\s*\*?/u.exec(source.slice(index));
      if (fnMatch !== null) {
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
          const open = cursor;
          const close = skipBalancedParens(source, open);
          lists.push(source.slice(open + 1, close - 1));
          index = close;
          continue;
        }
      }
    }

    // Flèche : `(...) =>` — récupère la liste précédant `=>`
    if (char === '=' && source[index + 1] === '>') {
      let cursor = index - 1;
      while (cursor >= 0 && /\s/u.test(source[cursor] ?? '')) {
        cursor -= 1;
      }
      if (source[cursor] === ')') {
        let depth = 0;
        for (let probe = cursor; probe >= 0; probe -= 1) {
          const ch = source[probe];
          if (ch === ')') {
            depth += 1;
          } else if (ch === '(') {
            depth -= 1;
            if (depth === 0) {
              lists.push(source.slice(probe + 1, cursor));
              break;
            }
          }
        }
      }
      index += 2;
      continue;
    }

    // Méthodes / constructeurs
    if (char === '(') {
      const before = source.slice(Math.max(0, index - 80), index);
      if (
        !CONTROL_FLOW_BEFORE_PAREN_RE.test(before) &&
        /(?:^|[^.\w$])((?:get|set|async|static|private|public|protected|override|readonly)\s+)*([A-Za-z_$][\w$]*|constructor)\s*$/u.test(
          before,
        )
      ) {
        const open = index;
        const close = skipBalancedParens(source, open);
        let after = close;
        while (after < source.length && /\s/u.test(source[after] ?? '')) {
          after += 1;
        }
        if (
          source[after] === '{' ||
          source[after] === ':' ||
          (source[after] === '=' && source[after + 1] === '>')
        ) {
          lists.push(source.slice(open + 1, close - 1));
          index = close;
          continue;
        }
      }
    }

    index += 1;
  }

  return lists;
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface FunctionArityComplianceAnalysis {
  readonly functionsWithExcessPositionalArityCount: number;
  readonly functionsMissingTypedOptionsEncapsulationCount: number;
  readonly violations: readonly ArchitectureViolation[];
}

function getLineNumber(source: string, offset: number): number {
  return source.slice(0, Math.max(0, offset)).split('\n').length;
}

function collectExcessArityViolations(filePath: string, source: string): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  let inDouble = false;
  let inSingle = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let index = 0;

  while (index < source.length) {
    const char = source[index] ?? '';
    const next = source[index + 1] ?? '';

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
      }
      index += 1;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }
    if (inDouble) {
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === '"') {
        inDouble = false;
      }
      index += 1;
      continue;
    }
    if (inSingle) {
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === "'") {
        inSingle = false;
      }
      index += 1;
      continue;
    }
    if (inTemplate) {
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === '`') {
        inTemplate = false;
      }
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      index += 2;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      index += 2;
      continue;
    }
    if (char === '"') {
      inDouble = true;
      index += 1;
      continue;
    }
    if (char === "'") {
      inSingle = true;
      index += 1;
      continue;
    }
    if (char === '`') {
      inTemplate = true;
      index += 1;
      continue;
    }

    if (source.startsWith('function', index)) {
      const before = source[index - 1] ?? ' ';
      const after = source[index + 8] ?? ' ';
      if (!/[\w$]/u.test(before) && !/[\w$]/u.test(after)) {
        let cursor = index + 8;
        while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
          cursor += 1;
        }
        if (source[cursor] === '*') {
          cursor += 1;
          while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
        }
        let sym = 'function';
        if (source[cursor] !== '(') {
          const start = cursor;
          while (cursor < source.length && /[\w$]/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
          sym = source.slice(start, cursor);
        }
        while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
          cursor += 1;
        }
        if (source[cursor] === '(') {
          const open = cursor;
          const close = skipBalancedParens(source, open);
          const paramList = source.slice(open + 1, close - 1);
          const arity = countPositionalParameters(paramList);
          if (arity > MAX_POSITIONAL_ARITY) {
            const line = getLineNumber(source, index);
            violations.push({
              file: filePath,
              line,
              symbol: sym,
              message: `Fonction "${sym}" acceptant ${arity} paramètres positionnels (max autorisé: 3 ; regrouper dans un objet d'options)`,
            });
          }
          index = close;
          continue;
        }
      }
    }

    if (char === '(') {
      const before = source.slice(Math.max(0, index - 80), index);
      if (
        !CONTROL_FLOW_BEFORE_PAREN_RE.test(before) &&
        /(?:^|[^.\w$])((?:get|set|async|static|private|public|protected|override|readonly)\s+)*([A-Za-z_$][\w$]*|constructor)\s*$/u.test(
          before,
        )
      ) {
        const nameMatch =
          /(?:^|[^.\w$])((?:get|set|async|static|private|public|protected|override|readonly)\s+)*([A-Za-z_$][\w$]*|constructor)\s*$/u.exec(
            before,
          );
        const sym = nameMatch?.[2] ?? 'method';
        const open = index;
        const close = skipBalancedParens(source, open);
        let after = close;
        while (after < source.length && /\s/u.test(source[after] ?? '')) {
          after += 1;
        }
        if (
          source[after] === '{' ||
          source[after] === ':' ||
          (source[after] === '=' && source[after + 1] === '>')
        ) {
          const paramList = source.slice(open + 1, close - 1);
          const arity = countPositionalParameters(paramList);
          if (arity > MAX_POSITIONAL_ARITY) {
            const line = getLineNumber(source, open);
            violations.push({
              file: filePath,
              line,
              symbol: sym,
              message: `Méthode/fonction "${sym}" acceptant ${arity} paramètres positionnels (max autorisé: 3 ; regrouper dans un objet d'options)`,
            });
          }
          index = close;
          continue;
        }
      }
    }

    index += 1;
  }

  return violations;
}

function analyzeFunctionArityCompliance(srcRoot: string): FunctionArityComplianceAnalysis {
  const allViolations: ArchitectureViolation[] = [];

  for (const absolute of listTypeScriptFiles(srcRoot)) {
    const relative = path.relative(srcRoot, absolute).split(path.sep).join('/');
    const source = fs.readFileSync(absolute, 'utf8');
    const fileViolations = collectExcessArityViolations(`src/${relative}`, source);
    allViolations.push(...fileViolations);
  }

  return {
    functionsWithExcessPositionalArityCount: allViolations.length,
    functionsMissingTypedOptionsEncapsulationCount: allViolations.length,
    violations: allViolations,
  };
}

describe('CASE-ARCH-05-3 — arité des fonctions ≤ 3 (SPEC-ARCH-05)', () => {
  it('test_CASE_ARCH_05_3_function_arity_bound_compliance', () => {
    const srcRoot = resolveSrcRoot();

    const analysis = analyzeFunctionArityCompliance(srcRoot);
    const detailsMsg = formatViolationsMessage(
      'Fonctions avec arité positionnelle excessive (>= 4)',
      analysis.violations,
    );

    // Alors aucune fonction n'accepte 4 paramètres positionnels ou plus
    expect(analysis.functionsWithExcessPositionalArityCount, detailsMsg).toBe(0);

    // Et toutes les fonctions à besoins multiples regroupent leurs arguments dans un objet d'options typé
    expect(analysis.functionsMissingTypedOptionsEncapsulationCount, detailsMsg).toBe(0);
  });
});
