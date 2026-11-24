/**
 * CASE-ARCH-06-1 — Inférence native des types de retour (fonctions concrètes)
 * (`AC-ARCH-06-1` / `SPEC-ARCH-06`).
 *
 * Périmètre Données : fonctions concrètes avec corps sous `src/` ;
 * exclusion `src/types/**` et signatures abstraites sans corps.
 * Annotations avec `@returnTypeExemption` (TSDoc précédent) hors compteur
 * (table « non exemptées » ; validation exemption → CASE-ARCH-06-2).
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi (POINT-013).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Résultat d'audit d'inférence des types de retour. */
interface ReturnTypeInferenceComplianceAnalysis {
  /**
   * Annotations de retour explicites non exemptées
   * (clause Alors).
   */
  readonly explicitReturnTypeAnnotationCount: number;
  /**
   * Retours non intégralement inférés (même oracle opérationnel)
   * (clause Et).
   */
  readonly nonInferredReturnTypeCount: number;
}

const RETURN_TYPE_EXEMPTION_RE = /@returnTypeExemption\b/u;
const CONTROL_FLOW_BEFORE_PAREN_RE = /\b(?:if|for|while|switch|catch|with)\s*$/u;

function resolveSrcRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src');
}

function listConcreteSourceFiles(srcRoot: string): readonly string[] {
  const collected: string[] = [];

  function walk(dir: string): void {
    if (!fs.existsSync(dir)) {
      return;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'types' && path.normalize(dir) === path.normalize(srcRoot)) {
          continue;
        }
        walk(absolute);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        collected.push(path.normalize(absolute));
      }
    }
  }

  walk(srcRoot);
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
 * Remonte `declStart` au-delà des modificateurs `export` / `default` / `async`
 * placés immédiatement avant le lexème `function`, afin que le scan TSDoc
 * adjacent voie le bloc `@returnTypeExemption` (POINT-007 / alignement 06-2).
 *
 * @param source - Texte source du module
 * @param functionKeywordIndex - Offset du lexème `function`
 */
function resolveFunctionDeclarationStart(source: string, functionKeywordIndex: number) {
  let declStart = functionKeywordIndex;
  let probe = functionKeywordIndex - 1;
  while (probe >= 0 && /\s/u.test(source[probe] ?? '')) {
    probe -= 1;
  }
  let hasPeeledModifier = true;
  while (hasPeeledModifier && probe >= 0) {
    hasPeeledModifier = false;
    for (const mod of ['async', 'export', 'default'] as const) {
      const start = probe - mod.length + 1;
      if (start < 0) {
        continue;
      }
      const slice = source.slice(start, probe + 1);
      const isWordBoundary = start === 0 || !/[\w$]/u.test(source[start - 1] ?? '');
      if (slice === mod && isWordBoundary) {
        declStart = start;
        probe = start - 1;
        while (probe >= 0 && /\s/u.test(source[probe] ?? '')) {
          probe -= 1;
        }
        hasPeeledModifier = true;
        break;
      }
    }
  }
  return declStart;
}

function hasReturnTypeExemptionInPrecedingTsDoc(source: string, declStart: number): boolean {
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
      return RETURN_TYPE_EXEMPTION_RE.test(source.slice(cursor - 1, blockEnd));
    }
    cursor -= 1;
  }
  return false;
}

/**
 * Après la `)` des paramètres : présence d'une annotation `: ReturnType`
 * avant le corps `{` ou `=>`.
 */
function hasExplicitReturnTypeAnnotation(source: string, closeParenIndex: number): boolean {
  let index = closeParenIndex;
  while (index < source.length && /\s/u.test(source[index] ?? '')) {
    index += 1;
  }
  if (source[index] !== ':') {
    return false;
  }

  let cursor = index + 1;
  let depthAngle = 0;
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;

  while (cursor < source.length) {
    const char = source[cursor];

    if (char === '/' && source[cursor + 1] === '/') {
      while (cursor < source.length && source[cursor] !== '\n') {
        cursor += 1;
      }
      continue;
    }
    if (char === '/' && source[cursor + 1] === '*') {
      cursor += 2;
      while (
        cursor + 1 < source.length &&
        !(source[cursor] === '*' && source[cursor + 1] === '/')
      ) {
        cursor += 1;
      }
      cursor += 2;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      cursor = skipStringLiteral(source, cursor, char);
      continue;
    }

    if (char === '<') {
      depthAngle += 1;
      cursor += 1;
      continue;
    }
    if (char === '>') {
      if (depthAngle > 0) {
        depthAngle -= 1;
      }
      cursor += 1;
      continue;
    }
    if (char === '(') {
      depthParen += 1;
      cursor += 1;
      continue;
    }
    if (char === ')') {
      if (depthParen > 0) {
        depthParen -= 1;
      }
      cursor += 1;
      continue;
    }
    if (char === '[') {
      depthBracket += 1;
      cursor += 1;
      continue;
    }
    if (char === ']') {
      if (depthBracket > 0) {
        depthBracket -= 1;
      }
      cursor += 1;
      continue;
    }

    if (depthAngle === 0 && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
      if (char === '=' && source[cursor + 1] === '>') {
        return true;
      }
      if (char === '{') {
        const afterObjectOrBody = skipBalancedBraces(source, cursor);
        let next = afterObjectOrBody;
        while (next < source.length && /\s/u.test(source[next] ?? '')) {
          next += 1;
        }
        if (source[next] === '{' || (source[next] === '=' && source[next + 1] === '>')) {
          // Littéral de type objet dans l'annotation ; poursuivre.
          cursor = afterObjectOrBody;
          continue;
        }
        // `{` = corps de fonction → annotation présente.
        return true;
      }
      if (char === ';') {
        return false;
      }
    }

    if (char === '{') {
      depthBrace += 1;
    } else if (char === '}') {
      if (depthBrace > 0) {
        depthBrace -= 1;
      }
    }
    cursor += 1;
  }

  return false;
}

function findBodyOpenAfterSignature(source: string, closeParenIndex: number): number {
  let index = closeParenIndex;
  while (index < source.length && /\s/u.test(source[index] ?? '')) {
    index += 1;
  }
  if (source[index] === '{') {
    return index;
  }
  if (source[index] !== ':') {
    if (source[index] === '=' && source[index + 1] === '>') {
      let arrowBody = index + 2;
      while (arrowBody < source.length && /\s/u.test(source[arrowBody] ?? '')) {
        arrowBody += 1;
      }
      return source[arrowBody] === '{' ? arrowBody : -1;
    }
    return -1;
  }

  let cursor = index + 1;
  let depthAngle = 0;
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;

  while (cursor < source.length) {
    const char = source[cursor];
    if (char === '/' && source[cursor + 1] === '/') {
      while (cursor < source.length && source[cursor] !== '\n') {
        cursor += 1;
      }
      continue;
    }
    if (char === '/' && source[cursor + 1] === '*') {
      cursor += 2;
      while (
        cursor + 1 < source.length &&
        !(source[cursor] === '*' && source[cursor + 1] === '/')
      ) {
        cursor += 1;
      }
      cursor += 2;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      cursor = skipStringLiteral(source, cursor, char);
      continue;
    }
    if (char === '<') {
      depthAngle += 1;
    } else if (char === '>') {
      if (depthAngle > 0) {
        depthAngle -= 1;
      }
    } else if (char === '(') {
      depthParen += 1;
    } else if (char === ')') {
      if (depthParen > 0) {
        depthParen -= 1;
      }
    } else if (char === '[') {
      depthBracket += 1;
    } else if (char === ']') {
      if (depthBracket > 0) {
        depthBracket -= 1;
      }
    } else if (depthAngle === 0 && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
      if (char === '=' && source[cursor + 1] === '>') {
        let arrowBody = cursor + 2;
        while (arrowBody < source.length && /\s/u.test(source[arrowBody] ?? '')) {
          arrowBody += 1;
        }
        return source[arrowBody] === '{' ? arrowBody : -1;
      }
      if (char === '{') {
        const after = skipBalancedBraces(source, cursor);
        let next = after;
        while (next < source.length && /\s/u.test(source[next] ?? '')) {
          next += 1;
        }
        if (source[next] === '{' || (source[next] === '=' && source[next + 1] === '>')) {
          cursor = after;
          continue;
        }
        return cursor;
      }
      if (char === ';') {
        return -1;
      }
    }
    if (char === '{') {
      depthBrace += 1;
    } else if (char === '}') {
      if (depthBrace > 0) {
        depthBrace -= 1;
      }
    }
    cursor += 1;
  }
  return -1;
}

function countNonExemptExplicitReturns(source: string): number {
  let count = 0;
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
          const close = skipBalancedParens(source, cursor);
          const bodyOpen = findBodyOpenAfterSignature(source, close);
          if (bodyOpen >= 0) {
            if (
              hasExplicitReturnTypeAnnotation(source, close) &&
              !hasReturnTypeExemptionInPrecedingTsDoc(source, declStart)
            ) {
              count += 1;
            }
            index = skipBalancedBraces(source, bodyOpen);
            continue;
          }
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
        const raw = nameMatch?.[0] ?? '';
        const declStart = index - raw.replace(/^[^.\w$]/u, '').length;
        const close = skipBalancedParens(source, index);
        const bodyOpen = findBodyOpenAfterSignature(source, close);
        if (bodyOpen >= 0) {
          if (
            hasExplicitReturnTypeAnnotation(source, close) &&
            !hasReturnTypeExemptionInPrecedingTsDoc(source, Math.max(0, declStart))
          ) {
            count += 1;
          }
          index = skipBalancedBraces(source, bodyOpen);
          continue;
        }
      }
    }

    // Flèches avec corps bloc : `(...): T => {`
    if (char === '=' && source[index + 1] === '>') {
      let cursor = index - 1;
      while (cursor >= 0 && /\s/u.test(source[cursor] ?? '')) {
        cursor -= 1;
      }
      // Remonter un type de retour éventuel jusqu'à `)`
      if (source[cursor] !== ')') {
        // Possible fin de type : chercher `):` en amont
        while (cursor >= 0 && source[cursor] !== ')') {
          if (source[cursor] === '{' || source[cursor] === ';') {
            break;
          }
          cursor -= 1;
        }
      }
      if (source[cursor] === ')') {
        const close = cursor + 1;
        let depth = 0;
        let open = -1;
        for (let probe = cursor; probe >= 0; probe -= 1) {
          if (source[probe] === ')') {
            depth += 1;
          } else if (source[probe] === '(') {
            depth -= 1;
            if (depth === 0) {
              open = probe;
              break;
            }
          }
        }
        if (open >= 0 && hasExplicitReturnTypeAnnotation(source, close)) {
          let arrowBody = index + 2;
          while (arrowBody < source.length && /\s/u.test(source[arrowBody] ?? '')) {
            arrowBody += 1;
          }
          if (source[arrowBody] === '{' && !hasReturnTypeExemptionInPrecedingTsDoc(source, open)) {
            count += 1;
            index = skipBalancedBraces(source, arrowBody);
            continue;
          }
        }
      }
      index += 2;
      continue;
    }

    index += 1;
  }

  return count;
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface ReturnTypeInferenceComplianceAnalysis {
  readonly explicitReturnTypeAnnotationCount: number;
  readonly nonInferredReturnTypeCount: number;
  readonly violations: readonly ArchitectureViolation[];
}

function getLineNumber(source: string, offset: number): number {
  return source.slice(0, Math.max(0, offset)).split('\n').length;
}

function collectNonExemptExplicitReturns(
  filePath: string,
  source: string,
): ArchitectureViolation[] {
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
        const declStart = resolveFunctionDeclarationStart(source, index);
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
        let funcName = 'anonymous';
        if (source[cursor] !== '(') {
          const startName = cursor;
          while (cursor < source.length && /[\w$]/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
          funcName = source.slice(startName, cursor);
          while (cursor < source.length && /\s/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
        }
        if (source[cursor] === '(') {
          const close = skipBalancedParens(source, cursor);
          const bodyOpen = findBodyOpenAfterSignature(source, close);
          if (bodyOpen >= 0) {
            if (
              hasExplicitReturnTypeAnnotation(source, close) &&
              !hasReturnTypeExemptionInPrecedingTsDoc(source, declStart)
            ) {
              const line = getLineNumber(source, declStart);
              violations.push({
                file: filePath,
                line,
                symbol: funcName,
                message: `Type de retour explicitement annoté sur "function ${funcName}" sans balise @returnTypeExemption`,
              });
            }
            index = skipBalancedBraces(source, bodyOpen);
            continue;
          }
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
        const raw = nameMatch?.[0] ?? '';
        const declStart = index - raw.replace(/^[^.\w$]/u, '').length;
        const sym = nameMatch?.[2] ?? 'method';
        const close = skipBalancedParens(source, index);
        const bodyOpen = findBodyOpenAfterSignature(source, close);
        if (bodyOpen >= 0) {
          if (
            hasExplicitReturnTypeAnnotation(source, close) &&
            !hasReturnTypeExemptionInPrecedingTsDoc(source, Math.max(0, declStart))
          ) {
            const line = getLineNumber(source, declStart);
            violations.push({
              file: filePath,
              line,
              symbol: sym,
              message: `Type de retour explicitement annoté sur méthode/fonction "${sym}" sans balise @returnTypeExemption`,
            });
          }
          index = skipBalancedBraces(source, bodyOpen);
          continue;
        }
      }
    }

    if (char === '=' && source[index + 1] === '>') {
      let cursor = index - 1;
      while (cursor >= 0 && /\s/u.test(source[cursor] ?? '')) {
        cursor -= 1;
      }
      if (source[cursor] !== ')') {
        while (cursor >= 0 && source[cursor] !== ')') {
          if (source[cursor] === '{' || source[cursor] === ';') {
            break;
          }
          cursor -= 1;
        }
      }
      if (source[cursor] === ')') {
        const close = cursor + 1;
        let depth = 0;
        let open = -1;
        for (let probe = cursor; probe >= 0; probe -= 1) {
          if (source[probe] === ')') {
            depth += 1;
          } else if (source[probe] === '(') {
            depth -= 1;
            if (depth === 0) {
              open = probe;
              break;
            }
          }
        }
        if (open >= 0 && hasExplicitReturnTypeAnnotation(source, close)) {
          let arrowBody = index + 2;
          while (arrowBody < source.length && /\s/u.test(source[arrowBody] ?? '')) {
            arrowBody += 1;
          }
          if (source[arrowBody] === '{' && !hasReturnTypeExemptionInPrecedingTsDoc(source, open)) {
            const line = getLineNumber(source, open);
            violations.push({
              file: filePath,
              line,
              symbol: 'arrow-function',
              message:
                'Type de retour explicitement annoté sur fonction fléchée sans balise @returnTypeExemption',
            });
            index = skipBalancedBraces(source, arrowBody);
            continue;
          }
        }
      }
      index += 2;
      continue;
    }

    index += 1;
  }

  return violations;
}

function analyzeReturnTypeInferenceCompliance(
  srcRoot: string,
): ReturnTypeInferenceComplianceAnalysis {
  const allViolations: ArchitectureViolation[] = [];

  for (const absolute of listConcreteSourceFiles(srcRoot)) {
    const relativePath = path.relative(srcRoot, absolute).split(path.sep).join('/');
    const source = fs.readFileSync(absolute, 'utf8');
    const fileViolations = collectNonExemptExplicitReturns(`src/${relativePath}`, source);
    allViolations.push(...fileViolations);
  }

  return {
    explicitReturnTypeAnnotationCount: allViolations.length,
    nonInferredReturnTypeCount: allViolations.length,
    violations: allViolations,
  };
}

describe('CASE-ARCH-06-1 — inférence native des types de retour (SPEC-ARCH-06)', () => {
  it('test_CASE_ARCH_06_1_return_type_inference_compliance', () => {
    const srcRoot = resolveSrcRoot();

    const analysis = analyzeReturnTypeInferenceCompliance(srcRoot);
    const detailsMsg = formatViolationsMessage(
      'Annotations de type de retour explicites non exemptées (inférence native requise)',
      analysis.violations,
    );

    // Alors aucun type de retour explicite n'est annoté sur la déclaration
    expect(analysis.explicitReturnTypeAnnotationCount, detailsMsg).toBe(0);

    // Et le type de retour est intégralement inféré par le compilateur TypeScript
    expect(analysis.nonInferredReturnTypeCount, detailsMsg).toBe(0);
  });
});
