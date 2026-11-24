/**
 * CASE-ARCH-07-2 — Conventions de nommage fichiers (`kebab-case.suffixe.ts`)
 * et identifiants (camelCase / PascalCase / UPPER_SNAKE_CASE / préfixes booléens)
 * (`AC-ARCH-07-2` / `SPEC-ARCH-07`).
 *
 * Périmètre Données : arborescence `src/` + déclarations de symboles.
 * Gherkin : 2 assertions (fichiers + identifiants). Les items checklist
 * « imbrication > 3 » sont hors contrat de ce CASE (→ `CASE-ARCH-07-1`) ;
 * la fiche Gherkin / table Données font foi (POINT-013) — aucune assertion
 * étrangère.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite `…_files_and_identifiers` ; la fiche CASE fait foi.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Résultat d'audit des conventions de nommage. */
interface NamingConventionsComplianceAnalysis {
  /**
   * Fichiers hors format `kebab-case.suffixe.ts` / `index.ts`
   * (clause Alors / table Données).
   */
  readonly nonCompliantFileNameCount: number;
  /**
   * Identifiants hors conventions camelCase / PascalCase /
   * UPPER_SNAKE_CASE / préfixes booléens (clause Et).
   */
  readonly nonCompliantIdentifierCount: number;
}

/** Basename : `index.ts` ou kebab-case avec suffixes optionnels `.segment` (.ts ou .tsx). */
const KEBAB_FILE_RE = /^(index|[a-z][a-z0-9]*(-[a-z0-9]+)*)(\.[a-z][a-z0-9]*)*\.(ts|tsx)$/u;

const CAMEL_CASE_RE = /^[a-z][a-zA-Z0-9]*$/u;
const PASCAL_CASE_RE = /^[A-Z][a-zA-Z0-9]*$/u;
const UPPER_SNAKE_RE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/u;
const BOOLEAN_PREFIX_RE = /^(is|has|should|can)[A-Z][a-zA-Z0-9]*$/u;

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

function isCompliantFileName(fileName: string): boolean {
  return KEBAB_FILE_RE.test(fileName);
}

function countNonCompliantFileNames(srcRoot: string): number {
  let count = 0;
  for (const absolute of listTypeScriptFiles(srcRoot)) {
    const base = path.basename(absolute);
    if (!isCompliantFileName(base)) {
      count += 1;
    }
  }
  return count;
}

/**
 * Audit structurel des déclarations (formule Données / SPEC-ARCH-07).
 * - functions / methods → camelCase (hors `constructor`)
 * - class / interface / type / enum → PascalCase
 * - const module-level → UPPER_SNAKE_CASE
 * - identifiants annotés `boolean` → préfixe is/has/should/can
 */
function countNonCompliantIdentifiers(source: string, isTsx = false): number {
  const code = stripCommentsAndStrings(source);
  let count = 0;

  const functionRe = /\b(?:export\s+)?(?:async\s+)?function\s+\*?\s*([A-Za-z_$][\w$]*)/gu;
  let match: RegExpExecArray | null = functionRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    const isCompliant = isTsx
      ? CAMEL_CASE_RE.test(name) || PASCAL_CASE_RE.test(name)
      : CAMEL_CASE_RE.test(name);
    if (!isCompliant) {
      count += 1;
    }
    match = functionRe.exec(code);
  }

  // Méthodes / constructeur : `name(` précédé d'un modificateur ou début de membre
  const methodRe =
    /(?:^|[{};])\s*(?:(?:public|private|protected|static|async|get|set|override|readonly)\s+)*([A-Za-z_$][\w$]*)\s*\(/gu;
  match = methodRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    const lower = name.toLowerCase();
    if (
      lower === 'if' ||
      lower === 'for' ||
      lower === 'while' ||
      lower === 'switch' ||
      lower === 'catch' ||
      lower === 'function' ||
      lower === 'return' ||
      lower === 'typeof' ||
      lower === 'new' ||
      lower === 'await' ||
      lower === 'throw' ||
      lower === 'class' ||
      lower === 'interface' ||
      lower === 'type' ||
      lower === 'enum' ||
      lower === 'const' ||
      lower === 'let' ||
      lower === 'var' ||
      lower === 'import' ||
      lower === 'export' ||
      lower === 'from' ||
      lower === 'else' ||
      lower === 'try' ||
      lower === 'finally' ||
      lower === 'do' ||
      lower === 'case' ||
      lower === 'default' ||
      lower === 'with' ||
      lower === 'yield' ||
      lower === 'delete' ||
      lower === 'void' ||
      lower === 'super' ||
      lower === 'this'
    ) {
      match = methodRe.exec(code);
      continue;
    }
    if (name === 'constructor') {
      match = methodRe.exec(code);
      continue;
    }
    // Éviter double-compte avec `function name`
    const before = code.slice(Math.max(0, (match.index ?? 0) - 12), match.index);
    if (/\bfunction\s*$/u.test(before)) {
      match = methodRe.exec(code);
      continue;
    }
    if (!CAMEL_CASE_RE.test(name)) {
      count += 1;
    }
    match = methodRe.exec(code);
  }

  const typeLikeRe =
    /\b(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gu;
  match = typeLikeRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    if (!PASCAL_CASE_RE.test(name)) {
      count += 1;
    }
    match = typeLikeRe.exec(code);
  }

  // `const` module / bloc : UPPER_SNAKE (constantes), camelCase (variables) ou PascalCase (composants TSX)
  const constRe = /(?:^|[{};])\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*[:=]/gmu;
  match = constRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    const isCompliant = isTsx
      ? UPPER_SNAKE_RE.test(name) || CAMEL_CASE_RE.test(name) || PASCAL_CASE_RE.test(name)
      : UPPER_SNAKE_RE.test(name) || CAMEL_CASE_RE.test(name);
    if (!isCompliant) {
      count += 1;
    }
    match = constRe.exec(code);
  }

  // Identifiants typés boolean (propriétés, params, variables)
  const booleanAnnotRe = /\b([A-Za-z_$][\w$]*)\s*\??\s*:\s*boolean\b/gu;
  match = booleanAnnotRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    if (!BOOLEAN_PREFIX_RE.test(name)) {
      count += 1;
    }
    match = booleanAnnotRe.exec(code);
  }

  return count;
}

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

interface NamingConventionsComplianceAnalysis {
  readonly nonCompliantFileNameCount: number;
  readonly nonCompliantIdentifierCount: number;
  readonly fileViolations: readonly ArchitectureViolation[];
  readonly identifierViolations: readonly ArchitectureViolation[];
}

function getLineNumber(source: string, offset: number): number {
  return source.slice(0, Math.max(0, offset)).split('\n').length;
}

function collectNonCompliantIdentifiers(filePath: string, source: string): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const code = stripCommentsAndStrings(source);
  const isTsx = filePath.endsWith('.tsx');

  // Déclarations de fonction classiques
  const functionRe = /\bfunction\s+([A-Za-z_$][\w$]*)/gu;
  let match: RegExpExecArray | null = functionRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    const isCompliant = isTsx
      ? CAMEL_CASE_RE.test(name) || PASCAL_CASE_RE.test(name)
      : CAMEL_CASE_RE.test(name);
    if (!isCompliant) {
      const line = getLineNumber(source, match.index);
      violations.push({
        file: filePath,
        line,
        symbol: name,
        message: isTsx
          ? `Fonction "${name}" non conforme (doit être camelCase ou PascalCase pour les composants React/Preact)`
          : `Fonction "${name}" non conforme au camelCase`,
      });
    }
    match = functionRe.exec(code);
  }

  // Méthodes d'objets / classes
  const methodRe =
    /(?:^|[{};,])\s*(?:async\s+)?(?:static\s+)?(?:private\s+|public\s+|protected\s+)?([A-Za-z_$][\w$]*)\s*\(/gmu;
  match = methodRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    const lower = name.toLowerCase();
    const reserved = [
      'if',
      'for',
      'while',
      'switch',
      'catch',
      'function',
      'return',
      'typeof',
      'new',
      'await',
      'throw',
      'class',
      'interface',
      'type',
      'enum',
      'const',
      'let',
      'var',
      'import',
      'export',
      'from',
      'else',
      'try',
      'finally',
      'do',
      'case',
      'default',
      'with',
      'yield',
      'delete',
      'void',
      'super',
      'this',
      'constructor',
    ];
    if (reserved.includes(lower) || name === 'constructor') {
      match = methodRe.exec(code);
      continue;
    }
    const before = code.slice(Math.max(0, (match.index ?? 0) - 12), match.index);
    if (/\bfunction\s*$/u.test(before)) {
      match = methodRe.exec(code);
      continue;
    }
    if (!CAMEL_CASE_RE.test(name)) {
      const line = getLineNumber(source, match.index);
      violations.push({
        file: filePath,
        line,
        symbol: name,
        message: `Méthode "${name}" non conforme au camelCase`,
      });
    }
    match = methodRe.exec(code);
  }

  // Types / Interfaces / Classes / Enums -> PascalCase
  const typeLikeRe =
    /\b(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gu;
  match = typeLikeRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    if (!PASCAL_CASE_RE.test(name)) {
      const line = getLineNumber(source, match.index);
      violations.push({
        file: filePath,
        line,
        symbol: name,
        message: `Type/Interface/Classe "${name}" non conforme au PascalCase`,
      });
    }
    match = typeLikeRe.exec(code);
  }

  // `const` module / bloc : UPPER_SNAKE ou camelCase (ou PascalCase pour les composants TSX)
  const constRe = /(?:^|[{};])\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*[:=]/gmu;
  match = constRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    const isCompliant = isTsx
      ? UPPER_SNAKE_RE.test(name) || CAMEL_CASE_RE.test(name) || PASCAL_CASE_RE.test(name)
      : UPPER_SNAKE_RE.test(name) || CAMEL_CASE_RE.test(name);
    if (!isCompliant) {
      const line = getLineNumber(source, match.index);
      violations.push({
        file: filePath,
        line,
        symbol: name,
        message: isTsx
          ? `Constante "${name}" non conforme (doit être UPPER_SNAKE_CASE, camelCase ou PascalCase)`
          : `Constante "${name}" non conforme (doit être UPPER_SNAKE_CASE ou camelCase)`,
      });
    }
    match = constRe.exec(code);
  }

  // Identifiants typés boolean (doivent commencer par is/has/should/can)
  const booleanAnnotRe = /\b([A-Za-z_$][\w$]*)\s*\??\s*:\s*boolean\b/gu;
  match = booleanAnnotRe.exec(code);
  while (match !== null) {
    const name = match[1] ?? '';
    if (!BOOLEAN_PREFIX_RE.test(name)) {
      const line = getLineNumber(source, match.index);
      violations.push({
        file: filePath,
        line,
        symbol: name,
        message: `Booléen "${name}" dépourvu du préfixe requis (is/has/should/can)`,
      });
    }
    match = booleanAnnotRe.exec(code);
  }

  return violations;
}

function analyzeNamingConventionsCompliance(srcRoot: string): NamingConventionsComplianceAnalysis {
  const fileViolations: ArchitectureViolation[] = [];
  const identifierViolations: ArchitectureViolation[] = [];

  for (const absolute of listTypeScriptFiles(srcRoot)) {
    const relative = path.relative(srcRoot, absolute).split(path.sep).join('/');
    const basename = path.basename(absolute);
    if (!KEBAB_FILE_RE.test(basename)) {
      fileViolations.push({
        file: `src/${relative}`,
        message: `Nom de fichier "${basename}" non conforme au format kebab-case.suffixe.(ts|tsx)`,
      });
    }

    const source = fs.readFileSync(absolute, 'utf8');
    const violations = collectNonCompliantIdentifiers(`src/${relative}`, source);
    identifierViolations.push(...violations);
  }

  return {
    nonCompliantFileNameCount: fileViolations.length,
    nonCompliantIdentifierCount: identifierViolations.length,
    fileViolations,
    identifierViolations,
  };
}

describe('CASE-ARCH-07-2 — conventions de nommage (SPEC-ARCH-07)', () => {
  it('test_CASE_ARCH_07_2_naming_conventions_compliance', () => {
    const srcRoot = resolveSrcRoot();
    if (!fs.existsSync(srcRoot)) {
      throw new Error(`Répertoire src introuvable : ${srcRoot}`);
    }

    const analysis = analyzeNamingConventionsCompliance(srcRoot);
    const filesMsg = formatViolationsMessage(
      'Noms de fichiers non conformes au kebab-case',
      analysis.fileViolations,
    );
    const idMsg = formatViolationsMessage(
      'Identifiants non conformes aux conventions de nommage',
      analysis.identifierViolations,
    );

    // Alors tous les fichiers adoptent le format "kebab-case.suffixe.(ts|tsx)"
    expect(analysis.nonCompliantFileNameCount, filesMsg).toBe(0);

    // Et les fonctions/variables sont en camelCase (ou PascalCase pour les composants TSX), les booléens préfixés
    // par is/has/should/can, les constantes en UPPER_SNAKE_CASE et les types
    // en PascalCase
    expect(analysis.nonCompliantIdentifierCount, idMsg).toBe(0);
  });
});
