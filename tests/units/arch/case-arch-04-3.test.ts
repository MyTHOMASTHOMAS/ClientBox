/**
 * CASE-ARCH-04-3 — Conformité linguistique française des messages d'erreur exposés
 * (`AC-ARCH-04-3` / `SPEC-ARCH-04` / `REQ-007` / `C-06`).
 *
 * Portée Données : `controllers/`, `LIB-007` (`lib/http/router.ts`),
 * `services/`, stdout/stderr `ROOT-001` (`index.ts`).
 * Analyse syntaxique structurelle déterministe dans le harnais
 * (patterns POINT-001 / POINT-005 Partie 70).
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

/** Résultat d'audit conformité linguistique des erreurs exposées. */
interface FrenchErrorMessagesComplianceAnalysis {
  /**
   * Messages non français ou producteurs de portée absents
   * (clause Alors — 100 % français).
   */
  readonly nonFrenchExposedErrorMessageCount: number;
  /**
   * Messages techniques bruts non traduits exposés
   * (clause Et).
   */
  readonly rawTechnicalUntranslatedMessageCount: number;
  /** Violations détaillées pour le reporting d'audit. */
  readonly violationsByCheck: {
    readonly nonFrenchMessages: readonly ArchitectureViolation[];
    readonly rawTechnicalMessages: readonly ArchitectureViolation[];
  };
}

/** Patterns d'erreurs anglaises utilisateur (Alors). */
const ENGLISH_USER_ERROR_RE =
  /\b(?:internal server error|not found|bad request|conflict|unauthorized|forbidden|something went wrong|failed to|unable to|cannot |could not|is required|invalid request|unknown error|an error occurred|resource not found)\b/iu;

/** Jetons techniques bruts non traduits (Et). */
const RAW_TECHNICAL_RE = /\b(?:EADDRINUSE|ENOENT|EACCES|EPERM|NOT_FOUND|Error:\s|at\s+\S+\s+\()/u;

/**
 * Littéraux candidats messages d'erreur exposés :
 * `new Error(...)` et champs `message:`.
 */
const EXPOSED_ERROR_LITERAL_RE = /(?:new\s+Error\s*\(\s*|message\s*:\s*)(['"`])([\s\S]*?)\1/gu;

const ROUTER_404_FRENCH_RE =
  /(?:statusCode\s*=\s*404|404)[\s\S]{0,200}(?:message\s*:\s*['"`][^'"`]*(?:introuvable|non trouv|n'existe)|['"`][^'"`]*(?:introuvable|non trouv|Ressource non)[^'"`]*['"`])/iu;

function resolveSrcRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../src');
}

function stripComments(sourceText: string): string {
  const withoutBlock = sourceText.replace(/\/\*[\s\S]*?\*\//gu, '');
  return withoutBlock.replace(/^\s*\/\/.*$/gmu, '');
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
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        collected.push(path.normalize(absolute));
      }
    }
  }

  walk(rootDir);
  return collected;
}

function extractExposedErrorLiterals(stripped: string): readonly string[] {
  const found: string[] = [];
  for (const match of stripped.matchAll(EXPOSED_ERROR_LITERAL_RE)) {
    const literal = match[2];
    if (literal !== undefined && literal.trim().length > 0) {
      found.push(literal);
    }
  }
  return found;
}

function resolveRouterPath(srcRoot: string): string | null {
  const canonical = path.join(srcRoot, 'lib/http/mini-http.router.ts');
  if (fs.existsSync(canonical)) {
    return canonical;
  }
  const legacy = path.join(srcRoot, 'lib/http/router.ts');
  if (fs.existsSync(legacy)) {
    return legacy;
  }
  return null;
}

function countMissingRequiredScopeProducers(srcRoot: string): number {
  let missing = 0;
  const controllers = listTypeScriptFiles(path.join(srcRoot, 'controllers'));
  if (controllers.length === 0) {
    missing += 1;
  }
  if (!resolveRouterPath(srcRoot)) {
    missing += 1;
  }
  const services = listTypeScriptFiles(path.join(srcRoot, 'services'));
  if (services.length === 0) {
    missing += 1;
  }
  if (!fs.existsSync(path.join(srcRoot, 'index.ts'))) {
    missing += 1;
  }
  return missing;
}

function collectScopedSourceFiles(srcRoot: string): readonly string[] {
  const files: string[] = [];
  files.push(...listTypeScriptFiles(path.join(srcRoot, 'controllers')));
  const router = resolveRouterPath(srcRoot);
  if (router) {
    files.push(path.normalize(router));
  }
  files.push(...listTypeScriptFiles(path.join(srcRoot, 'services')));
  const indexFile = path.join(srcRoot, 'index.ts');
  if (fs.existsSync(indexFile)) {
    files.push(path.normalize(indexFile));
  }
  return files;
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function analyzeFrenchErrorMessagesCompliance(
  srcRoot: string,
): FrenchErrorMessagesComplianceAnalysis {
  let nonFrenchExposedErrorMessageCount = countMissingRequiredScopeProducers(srcRoot);
  let rawTechnicalUntranslatedMessageCount = 0;

  const nonFrenchMessages: ArchitectureViolation[] = [];
  const rawTechnicalMessages: ArchitectureViolation[] = [];

  const routerPath = path.join(srcRoot, 'lib/http/router.ts');
  if (fs.existsSync(routerPath)) {
    const routerRaw = fs.readFileSync(routerPath, 'utf8');
    const routerStripped = stripComments(routerRaw);
    if (!ROUTER_404_FRENCH_RE.test(routerStripped)) {
      nonFrenchExposedErrorMessageCount += 1;
      nonFrenchMessages.push({
        file: 'src/lib/http/router.ts',
        message: 'Message 404 par défaut en français manquant dans le routeur HTTP',
      });
    }
  }

  for (const file of collectScopedSourceFiles(srcRoot)) {
    const raw = fs.readFileSync(file, 'utf8');
    const stripped = stripComments(raw);
    const relFile = path.relative(srcRoot, file);

    for (const match of stripped.matchAll(EXPOSED_ERROR_LITERAL_RE)) {
      const literal = match[2];
      if (literal === undefined || literal.trim().length === 0) {
        continue;
      }

      const offset = match.index ?? 0;
      const line = lineAtOffset(raw, offset);
      const staticText = literal.replace(/\$\{[^}]*\}/gu, ' ');

      if (ENGLISH_USER_ERROR_RE.test(staticText)) {
        nonFrenchExposedErrorMessageCount += 1;
        nonFrenchMessages.push({
          file: relFile,
          line,
          message: `Message d'erreur utilisateur non français détecté : "${literal.trim()}"`,
        });
      }
      if (RAW_TECHNICAL_RE.test(staticText)) {
        rawTechnicalUntranslatedMessageCount += 1;
        rawTechnicalMessages.push({
          file: relFile,
          line,
          message: `Message technique brut non traduit exposé : "${literal.trim()}"`,
        });
      }
    }
  }

  return {
    nonFrenchExposedErrorMessageCount,
    rawTechnicalUntranslatedMessageCount,
    violationsByCheck: {
      nonFrenchMessages,
      rawTechnicalMessages,
    },
  };
}

describe('CASE-ARCH-04-3 — conformité linguistique française des erreurs (SPEC-ARCH-04)', () => {
  it('test_CASE_ARCH_04_3_french_language_error_messages_compliance', () => {
    const srcRoot = resolveSrcRoot();

    const analysis = analyzeFrenchErrorMessagesCompliance(srcRoot);

    // Alors le message retourné est intégralement formulé en langue française
    expect(
      analysis.nonFrenchExposedErrorMessageCount,
      formatViolationsMessage(
        "Messages d'erreur formulés en langue française",
        analysis.violationsByCheck.nonFrenchMessages,
      ),
    ).toBe(0);

    // Et aucun message technique brut non traduit n'est exposé à l'utilisateur
    expect(
      analysis.rawTechnicalUntranslatedMessageCount,
      formatViolationsMessage(
        'Messages techniques bruts non traduits exposés',
        analysis.violationsByCheck.rawTechnicalMessages,
      ),
    ).toBe(0);
  });
});
