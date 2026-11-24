/**
 * CASE-ARCH-01-6 — Conformité des micro-DAGs intra-couches et acyclicité
 * (`AC-ARCH-01-6` / `SPEC-ARCH-01`).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatViolationsMessage,
  type ArchitectureViolation,
} from '../../helpers/arch-violation-formatter.js';

function resolveProjectRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../..');
}

function resolveSrcRoot(projectRoot: string): string {
  return path.join(projectRoot, 'src');
}

const IMPORT_SPECIFIER_RE =
  /^\s*import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"]+)['"]\s*;?\s*$/gm;

function extractImports(filePath: string): readonly string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const specifiers: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = IMPORT_SPECIFIER_RE.exec(content)) !== null) {
    if (match[1]) specifiers.push(match[1]);
  }
  return specifiers;
}

function listFiles(dir: string): readonly string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(full);
    }
  }
  return files;
}

describe('CASE-ARCH-01-6 — micro-DAGs intra-couches (SPEC-ARCH-01 / AC-ARCH-01-6)', () => {
  it('test_CASE_ARCH_01_6_intra_layer_micro_dags_compliance', () => {
    const projectRoot = resolveProjectRoot();
    const srcRoot = resolveSrcRoot(projectRoot);
    const violations: ArchitectureViolation[] = [];

    // 1. Audit Micro-DAG Services : la façade SVC-001 ne doit être importée par aucun autre module services/
    //    (les contrats scenario-runner.types restent importables — hors façade).
    const servicesDir = path.join(srcRoot, 'services');
    if (fs.existsSync(servicesDir)) {
      const serviceFiles = listFiles(servicesDir).filter(
        (f) => !f.replace(/\\/g, '/').includes('scenario-runner.service'),
      );
      for (const fullPath of serviceFiles) {
        const sf = path.relative(servicesDir, fullPath).replace(/\\/g, '/');
        const imports = extractImports(fullPath);
        for (const imp of imports) {
          if (imp.includes('scenario-runner.service')) {
            violations.push({
              file: `src/services/${sf}`,
              message: `Violation micro-DAG services : le module ${sf} ne doit pas importer scenario-runner.service`,
            });
          }
        }
      }
    }

    // 2. Audit Micro-DAG Controllers : resource et execution ne doivent pas importer stream
    const controllersHttpDir = path.join(srcRoot, 'controllers/http');
    if (fs.existsSync(controllersHttpDir)) {
      const ctrlFiles = listFiles(controllersHttpDir);
      for (const fullPath of ctrlFiles) {
        const cf = path.relative(controllersHttpDir, fullPath).replace(/\\/g, '/');
        const imports = extractImports(fullPath);
        for (const imp of imports) {
          if (imp.includes('stream.controller') || imp.includes('sse/')) {
            violations.push({
              file: `src/controllers/http/${cf}`,
              message: `Violation micro-DAG controllers : ${cf} ne doit pas importer de contrôleur SSE`,
            });
          }
        }
      }
    }

    // 3. Audit Micro-DAG UI Clean Code (5 niveaux hiérarchiques per signature-ui.md §2.2)
    // Niveau 0 (api || i18n || types) ≺ Niveau 1 (hooks) ≺ Niveau 2 (components) ≺ Niveau 3 (pages) ≺ Niveau 4 (app.tsx)
    const uiDir = path.join(srcRoot, 'ui');
    if (fs.existsSync(uiDir)) {
      // 3.1 Niveau 0 (api, i18n, types) : aucun import de hooks, components, pages ou app.tsx
      for (const sub of ['api', 'i18n', 'types']) {
        const subDir = path.join(uiDir, sub);
        for (const file of listFiles(subDir)) {
          const relFile = path.relative(srcRoot, file).replace(/\\/g, '/');
          const imports = extractImports(file);
          for (const imp of imports) {
            if (
              imp.includes('/hooks/') ||
              imp.includes('/components/') ||
              imp.includes('/pages/') ||
              imp.includes('app.js') ||
              imp.includes('app.tsx')
            ) {
              violations.push({
                file: relFile,
                message: `Violation micro-DAG UI Niveau 0 : ${relFile} ne doit importer aucun sous-dossier supérieur (${imp})`,
              });
            }
          }
        }
      }

      // 3.2 Niveau 1 (hooks) : aucun import de composants JSX ni de pages ni de app.tsx
      const hooksDir = path.join(uiDir, 'hooks');
      for (const file of listFiles(hooksDir)) {
        const relFile = path.relative(srcRoot, file).replace(/\\/g, '/');
        const imports = extractImports(file);
        for (const imp of imports) {
          if (
            imp.includes('/components/') ||
            imp.includes('/pages/') ||
            imp.includes('app.js') ||
            imp.includes('app.tsx')
          ) {
            violations.push({
              file: relFile,
              message: `Violation micro-DAG UI Niveau 1 : les hooks ne doivent pas importer de composants ni de pages (${imp})`,
            });
          }
        }
      }

      // 3.3 Niveau 2 (components) : aucun import depuis pages/ ni app.tsx
      const compDir = path.join(uiDir, 'components');
      for (const file of listFiles(compDir)) {
        const relFile = path.relative(srcRoot, file).replace(/\\/g, '/');
        const imports = extractImports(file);
        for (const imp of imports) {
          if (imp.includes('/pages/') || imp.includes('app.js') || imp.includes('app.tsx')) {
            violations.push({
              file: relFile,
              message: `Violation micro-DAG UI Niveau 2 : les composants ne doivent pas importer depuis pages/ ou app.tsx (${imp})`,
            });
          }
        }
      }

      // 3.4 Niveau 3 (pages) : aucune page n'en importe une autre, et aucun import de app.tsx
      const pagesDir = path.join(uiDir, 'pages');
      for (const file of listFiles(pagesDir)) {
        const relFile = path.relative(srcRoot, file).replace(/\\/g, '/');
        const currentBase = path.basename(file, path.extname(file));
        const imports = extractImports(file);
        for (const imp of imports) {
          if (imp.includes('app.js') || imp.includes('app.tsx')) {
            violations.push({
              file: relFile,
              message: `Violation micro-DAG UI Niveau 3 : les pages ne doivent pas importer app.tsx (${imp})`,
            });
          }
          // Détection d'import croisé entre pages
          if (imp.includes('/pages/') || imp.startsWith('./')) {
            const resolvedImp = path.basename(imp, path.extname(imp));
            if (resolvedImp.endsWith('-page') && resolvedImp !== currentBase) {
              violations.push({
                file: relFile,
                message: `Violation micro-DAG UI Niveau 3 : import croisé interdit entre pages (${imp})`,
              });
            }
          }
        }
      }
    }

    const message = formatViolationsMessage('Violations micro-DAGs intra-couches détectées', violations);
    expect(violations.length, message).toBe(0);
  });
});
