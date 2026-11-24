/**
 * CASE-ARCH-06-2 — Exemption documentée `@returnTypeExemption <motif>`
 * obligatoire dans le TSDoc immédiatement précédent en cas de retour explicite
 * (`AC-ARCH-06-2` / `SPEC-ARCH-06`).
 *
 * Périmètre Données : fonctions concrètes avec corps sous `src/` déclarant
 * un type de retour explicite ; exclusion `src/types/**` et signatures sans corps.
 * Inférence nominale → CASE-ARCH-06-1 ; registre out/ → CASE-ARCH-09-3.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_tsdoc_validation` ; la fiche CASE fait foi (POINT-013).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

/** Résultat d'audit d'exemption documentée des types de retour explicites. */
interface ReturnTypeExemptionTagComplianceAnalysis {
  /**
   * Retours explicites dont le TSDoc précédent est dépourvu de
   * `@returnTypeExemption <justification>` (clause Alors / table Données).
   */
  readonly undocumentedExplicitReturnCount: number;
  /**
   * Annotations de retour dépourvues de la balise `@returnTypeExemption`
   * (clause Et).
   */
  readonly explicitReturnWithoutExemptionTagCount: number;
  /** Violations détaillées pour le reporting d'architecture. */
  readonly violations: readonly ArchitectureViolation[];
}

/** Balise + motif non vide (Données : `@returnTypeExemption <motif>`). */
const RETURN_TYPE_EXEMPTION_WITH_MOTIF_RE = /@returnTypeExemption\s+\S+/u;
/** Présence de la balise seule (clause Et). */
const RETURN_TYPE_EXEMPTION_TAG_RE = /@returnTypeExemption\b/u;
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
 * placés immédiatement avant le lexème `function`, afin que
 * {@link extractPrecedingTsDoc} voie le TSDoc adjacent (POINT-007).
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

function extractPrecedingTsDoc(source: string, declStart: number): string | null {
  let index = declStart - 1;
  while (index >= 0 && /\s/u.test(source[index] ?? '')) {
    index -= 1;
  }
  if (index < 1 || source[index - 1] !== '*' || source[index] !== '/') {
    return null;
  }
  const blockEnd = index + 1;
  let cursor = index;
  while (cursor >= 1) {
    if (source[cursor - 1] === '/' && source[cursor] === '*' && source[cursor + 1] === '*') {
      return source.slice(cursor - 1, blockEnd);
    }
    cursor -= 1;
  }
  return null;
}

function hasReturnTypeExemptionWithMotifInPrecedingTsDoc(
  source: string,
  declStart: number,
): boolean {
  const tsDoc = extractPrecedingTsDoc(source, declStart);
  return tsDoc !== null && RETURN_TYPE_EXEMPTION_WITH_MOTIF_RE.test(tsDoc);
}

function hasReturnTypeExemptionTagInPrecedingTsDoc(source: string, declStart: number): boolean {
  const tsDoc = extractPrecedingTsDoc(source, declStart);
  return tsDoc !== null && RETURN_TYPE_EXEMPTION_TAG_RE.test(tsDoc);
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

function getLineNumber(source: string, offset: number): number {
  return source.slice(0, Math.max(0, offset)).split('\n').length;
}

function auditExplicitReturnExemptions(
  filePath: string,
  source: string,
): {
  undocumentedExplicitReturnCount: number;
  explicitReturnWithoutExemptionTagCount: number;
  violations: ArchitectureViolation[];
} {
  const violations: ArchitectureViolation[] = [];
  const audit = {
    undocumentedExplicitReturnCount: 0,
    explicitReturnWithoutExemptionTagCount: 0,
  };
  let index = 0;

  function record(declStart: number, sym: string): void {
    const hasMotif = hasReturnTypeExemptionWithMotifInPrecedingTsDoc(source, declStart);
    const hasTag = hasReturnTypeExemptionTagInPrecedingTsDoc(source, declStart);
    if (!hasMotif) {
      audit.undocumentedExplicitReturnCount += 1;
    }
    if (!hasTag) {
      audit.explicitReturnWithoutExemptionTagCount += 1;
      const line = getLineNumber(source, declStart);
      violations.push({
        file: filePath,
        line,
        symbol: sym,
        message: `Annotation de retour explicite sur "${sym}" sans balise "@returnTypeExemption <justification>" dans le TSDoc précédent`,
      });
    }
  }

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
      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') {
          index += 1;
        }
        index += 1;
      }
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
        let sym = 'function';
        if (source[cursor] !== '(') {
          const start = cursor;
          while (cursor < source.length && /[\w$]/u.test(source[cursor] ?? '')) {
            cursor += 1;
          }
          sym = source.slice(start, cursor);
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
            if (hasExplicitReturnTypeAnnotation(source, close)) {
              record(declStart, sym);
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
          if (hasExplicitReturnTypeAnnotation(source, close)) {
            record(Math.max(0, declStart), sym);
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
          if (source[arrowBody] === '{') {
            record(open, 'arrow-function');
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

  return {
    undocumentedExplicitReturnCount: audit.undocumentedExplicitReturnCount,
    explicitReturnWithoutExemptionTagCount: audit.explicitReturnWithoutExemptionTagCount,
    violations,
  };
}

function analyzeReturnTypeExemptionTagCompliance(
  srcRoot: string,
): ReturnTypeExemptionTagComplianceAnalysis {
  let undocumentedExplicitReturnCount = 0;
  let explicitReturnWithoutExemptionTagCount = 0;
  const allViolations: ArchitectureViolation[] = [];

  for (const absolute of listConcreteSourceFiles(srcRoot)) {
    const relativePath = path.relative(srcRoot, absolute).split(path.sep).join('/');
    const source = fs.readFileSync(absolute, 'utf8');
    const fileAudit = auditExplicitReturnExemptions(`src/${relativePath}`, source);
    undocumentedExplicitReturnCount += fileAudit.undocumentedExplicitReturnCount;
    explicitReturnWithoutExemptionTagCount += fileAudit.explicitReturnWithoutExemptionTagCount;
    allViolations.push(...fileAudit.violations);
  }

  return {
    undocumentedExplicitReturnCount,
    explicitReturnWithoutExemptionTagCount,
    violations: allViolations,
  };
}

describe('CASE-ARCH-06-2 — exemption @returnTypeExemption documentée (SPEC-ARCH-06)', () => {
  it('test_CASE_ARCH_06_2_return_type_exemption_tag_compliance', () => {
    const srcRoot = resolveSrcRoot();

    const analysis = analyzeReturnTypeExemptionTagCompliance(srcRoot);
    const detailsMsg = formatViolationsMessage(
      'Annotations de retour sans balise @returnTypeExemption documentée',
      analysis.violations,
    );

    // Alors le bloc TSDoc immédiatement précédent contient obligatoirement
    // "@returnTypeExemption <justification>"
    expect(analysis.undocumentedExplicitReturnCount, detailsMsg).toBe(0);

    // Et toute annotation de retour dépourvue de cette balise provoque l'échec
    expect(analysis.explicitReturnWithoutExemptionTagCount, detailsMsg).toBe(0);
  });
});
