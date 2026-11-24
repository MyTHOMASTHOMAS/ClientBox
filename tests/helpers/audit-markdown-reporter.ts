/**
 * Helper de génération de rapport d'audit d'architecture Markdown et JSON.
 * Produit `out/arch/rapport-arch.md` et `out/arch/arch-report.json` à la racine de `projectRoot`.
 *
 * Conforme à SPEC-ARCH-09 et aux exigences CASE-ARCH-09-1..5.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Entrée d'erreur bloquante d'architecture. */
export interface BlockingErrorEntry {
  readonly file: string;
  readonly rule: string;
  readonly message: string;
}

/** Entrée d'avertissement de transition (@pendingAudit, @deprecated, *.added.* ou *.del.*). */
export interface TransitionWarningEntry {
  readonly file: string;
  readonly kind: 'added' | 'del' | 'pendingAudit' | 'deprecated';
  readonly line?: number;
  readonly justification?: string;
}

/** Résultats bruts d'exécution de l'audit d'architecture. */
export interface ArchitectureAuditRunResults {
  readonly totalTests?: number;
  readonly passedTests?: number;
  readonly failedTests?: number;
  readonly warningCount?: number;
  readonly blockingErrors?: readonly BlockingErrorEntry[];
  readonly transitionWarnings?: readonly TransitionWarningEntry[];
}

/** Options de génération du rapport d'audit. */
export interface GenerateArchitectureMarkdownAuditReportOptions {
  readonly projectRoot: string;
  readonly results?: ArchitectureAuditRunResults;
}

/** Balises TSDoc d'exemption reconnues. */
export type TsDocExemptionTag =
  '@fileExemption' | '@functionExemption' | '@returnTypeExemption' | '@complexityExemption';

/** Entrée du registre des exemptions TSDoc. */
export interface ExtractedExemptionEntry {
  readonly relativePath: string;
  readonly line: number;
  readonly symbol: string;
  readonly tag: TsDocExemptionTag;
  readonly justification: string;
}

const EXEMPTION_TAGS: readonly TsDocExemptionTag[] = [
  '@fileExemption',
  '@functionExemption',
  '@returnTypeExemption',
  '@complexityExemption',
];

const SIGNATURE_SECTION_32_LAYERS = [
  'types',
  'utils',
  'domain',
  'lib',
  'services',
  'controllers',
  'ui',
  'index.ts',
] as const;

const JSON_LAYER_KEYS = [
  'src',
  'types',
  'utils',
  'domain',
  'lib',
  'services',
  'controllers',
  'ui',
] as const;

function collectTsFilesRecursively(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFilesRecursively(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.mts'))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function detectSymbolAfterLine(
  lines: readonly string[],
  startIndex: number,
  fallbackFile: string,
): string {
  const maxSearchIndex = Math.min(lines.length, startIndex + 20);
  let pastCommentBlock = false;

  for (let idx = startIndex; idx < maxSearchIndex; idx += 1) {
    const line = lines[idx] ?? '';
    if (line.includes('*/')) {
      pastCommentBlock = true;
      continue;
    }
    if (!pastCommentBlock) {
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue;
    }

    const funcMatch = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/u.exec(trimmed);
    if (funcMatch?.[1]) {
      return funcMatch[1];
    }

    const constMatch = /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)/u.exec(trimmed);
    if (constMatch?.[1]) {
      return constMatch[1];
    }

    const classMatch = /(?:export\s+)?(?:class|interface|type)\s+([a-zA-Z0-9_$]+)/u.exec(trimmed);
    if (classMatch?.[1]) {
      return classMatch[1];
    }
  }

  return fallbackFile;
}

function extractExemptionsFromSources(srcRoot: string): ExtractedExemptionEntry[] {
  const tsFiles = collectTsFilesRecursively(srcRoot);
  tsFiles.sort((a, b) => a.localeCompare(b));

  const exemptions: ExtractedExemptionEntry[] = [];

  for (const fullPath of tsFiles) {
    const relativePath = path.relative(srcRoot, fullPath).split(path.sep).join('/');
    const fileName = path.basename(fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/u);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      const lineNum = i + 1;

      for (const tag of EXEMPTION_TAGS) {
        const tagIndex = line.indexOf(tag);
        if (tagIndex !== -1) {
          const rawJustification = line.slice(tagIndex + tag.length).trim();
          const cleanJustification = rawJustification
            .replace(/\*\/$/u, '')
            .replace(/^:\s*/u, '')
            .trim();

          let symbol = fileName;
          if (tag !== '@fileExemption') {
            symbol = detectSymbolAfterLine(lines, i, fileName);
          }

          exemptions.push({
            relativePath,
            line: lineNum,
            symbol,
            tag,
            justification: cleanJustification,
          });
        }
      }
    }
  }

  return exemptions;
}

function extractTransitionWarningsFromSources(
  projectRoot: string,
  srcRoot: string,
): TransitionWarningEntry[] {
  const tsFiles = collectTsFilesRecursively(srcRoot);
  tsFiles.sort((a, b) => a.localeCompare(b));

  const warnings: TransitionWarningEntry[] = [];

  for (const fullPath of tsFiles) {
    const relativePath = path.relative(projectRoot, fullPath).split(path.sep).join('/');
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split(/\r?\n/u);

      let found = false;
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i] ?? '';
        const lineNum = i + 1;

        if (line.includes('@pendingAudit')) {
          const tagIdx = line.indexOf('@pendingAudit');
          const rawJust = line.slice(tagIdx + '@pendingAudit'.length).trim();
          const cleanJust = rawJust.replace(/\*\/$/u, '').replace(/^:\s*/u, '').trim();
          warnings.push({
            file: relativePath,
            kind: 'pendingAudit',
            line: lineNum,
            justification: cleanJust || undefined,
          });
          found = true;
          break;
        } else if (line.includes('@deprecated')) {
          const tagIdx = line.indexOf('@deprecated');
          const rawJust = line.slice(tagIdx + '@deprecated'.length).trim();
          const cleanJust = rawJust.replace(/\*\/$/u, '').replace(/^:\s*/u, '').trim();
          warnings.push({
            file: relativePath,
            kind: 'deprecated',
            line: lineNum,
            justification: cleanJust || undefined,
          });
          found = true;
          break;
        }
      }

      if (!found) {
        if (/\.added\.ts$/u.test(relativePath)) {
          warnings.push({ file: relativePath, kind: 'added' });
        } else if (/\.del\.ts$/u.test(relativePath)) {
          warnings.push({ file: relativePath, kind: 'del' });
        }
      }
    } catch {
      // ignore
    }
  }

  return warnings;
}

function deriveGlobalStatus(
  failedTests: number,
  blockingErrorsCount: number,
  warningCount: number,
  transitionWarningsCount: number,
): 'SUCCÈS' | 'AVERTISSEMENTS' | 'ÉCHEC' {
  if (failedTests > 0 || blockingErrorsCount > 0) {
    return 'ÉCHEC';
  }
  if (warningCount > 0 || transitionWarningsCount > 0) {
    return 'AVERTISSEMENTS';
  }
  return 'SUCCÈS';
}

/**
 * Génère automatiquement les rapports d'audit `out/arch/rapport-arch.md` et `out/arch/arch-report.json`.
 */
export function generateArchitectureMarkdownAuditReport(
  options: GenerateArchitectureMarkdownAuditReportOptions,
): void {
  const projectRoot = options.projectRoot;
  const outDir = path.join(projectRoot, 'out', 'arch');
  const srcRoot = path.join(projectRoot, 'src');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const results = options.results;
  const totalTests = results?.totalTests ?? 0;
  const passedTests = results?.passedTests ?? 0;
  const failedTests = results?.failedTests ?? 0;
  const injectedWarnings = results?.transitionWarnings;
  const transitionWarnings =
    injectedWarnings !== undefined && injectedWarnings.length > 0
      ? injectedWarnings
      : extractTransitionWarningsFromSources(projectRoot, srcRoot);
  const blockingErrors = results?.blockingErrors ?? [];
  const warningCount =
    results?.warningCount !== undefined && results.warningCount > 0
      ? results.warningCount
      : transitionWarnings.length;

  const globalStatus = deriveGlobalStatus(
    failedTests,
    blockingErrors.length,
    warningCount,
    transitionWarnings.length,
  );

  const exemptions = extractExemptionsFromSources(srcRoot);
  const nowIso = new Date().toISOString();

  // Construction du Markdown out/rapport-arch.md
  const mdLines: string[] = [];
  mdLines.push("# Rapport d'audit d'architecture et de conformité");
  mdLines.push('');
  mdLines.push(`**Horodatage** : ${nowIso}`);
  mdLines.push('');
  mdLines.push('## Synthèse exécutive');
  mdLines.push('');
  mdLines.push(`- **Statut global** : **${globalStatus}**`);
  mdLines.push(`- **Tests exécutés (total)** : **${totalTests}**`);
  mdLines.push(`- **Tests réussis** : **${passedTests}**`);
  mdLines.push(`- **Tests échoués** : **${failedTests}**`);
  mdLines.push(`- **Avertissements** : **${warningCount}**`);
  mdLines.push('');

  mdLines.push('### Erreurs bloquantes');
  mdLines.push('');
  if (blockingErrors.length === 0) {
    mdLines.push('*Aucune erreur bloquante.*');
  } else {
    for (const err of blockingErrors) {
      if (err.message.includes('\n')) {
        mdLines.push(`- **Fichier** : \`${err.file}\` | **Règle** : \`${err.rule}\``);
        const subLines = err.message.split(/\r?\n/u).filter((l) => l.trim().length > 0);
        for (const sub of subLines) {
          mdLines.push(`  ${sub}`);
        }
      } else {
        mdLines.push(
          `- **Fichier** : \`${err.file}\` | **Règle** : \`${err.rule}\` — ${err.message}`,
        );
      }
    }
  }
  mdLines.push('');

  mdLines.push('### Avertissements et transitions');
  mdLines.push('');
  if (transitionWarnings.length === 0) {
    mdLines.push('*Aucun avertissement de transition.*');
  } else {
    for (const warn of transitionWarnings) {
      const lineInfo = warn.line !== undefined ? `:${warn.line}` : '';
      const details = warn.justification ? ` — ${warn.justification}` : '';
      mdLines.push(`- **Fichier** : \`${warn.file}\`${lineInfo} (transition: ${warn.kind}${details})`);
    }
  }
  mdLines.push('');

  mdLines.push('## Registre des exemptions TSDoc');
  mdLines.push('');
  if (exemptions.length === 0) {
    mdLines.push('*Aucun exemption active requise.*');
  } else {
    mdLines.push('| Fichier | Ligne | Symbole | Balise | Justification |');
    mdLines.push('| :--- | :--- | :--- | :--- | :--- |');
    for (const ex of exemptions) {
      mdLines.push(
        `| ${ex.relativePath} | ${ex.line} | ${ex.symbol} | ${ex.tag} | ${ex.justification} |`,
      );
    }
  }
  mdLines.push('');

  mdLines.push("## Bilan d'étanchéité du DAG (8 couches)");
  mdLines.push('');
  mdLines.push('| Couche | Statut |');
  mdLines.push('| :--- | :--- |');
  for (const layer of SIGNATURE_SECTION_32_LAYERS) {
    const isViolated = blockingErrors.some(
      (err) =>
        err.file.includes(`/${layer}/`) || (layer === 'index.ts' && err.file.endsWith('index.ts')),
    );
    const status = isViolated ? 'NON-CONFORME' : 'CONFORME';
    mdLines.push(`| ${layer} | ${status} |`);
  }
  mdLines.push('');

  const reportMdPath = path.join(outDir, 'rapport-arch.md');
  fs.writeFileSync(reportMdPath, mdLines.join('\n'), 'utf8');

  // Construction du JSON out/arch-report.json
  const layerMatrix: Record<string, 'CONFORME' | 'NON-CONFORME'> = {};
  for (const key of JSON_LAYER_KEYS) {
    layerMatrix[key] = 'CONFORME';
  }

  const jsonContent = {
    timestamp: nowIso,
    status: globalStatus,
    metrics: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: warningCount,
    },
    warnings: transitionWarnings.map((w) => {
      const lineInfo = w.line !== undefined ? `:${w.line}` : '';
      const details = w.justification ? ` — ${w.justification}` : '';
      return `${w.file}${lineInfo} (transition: ${w.kind}${details})`;
    }),
    exemptions,
    layerMatrix,
  };

  const reportJsonPath = path.join(outDir, 'arch-report.json');
  fs.writeFileSync(reportJsonPath, JSON.stringify(jsonContent, null, 2), 'utf8');
}
