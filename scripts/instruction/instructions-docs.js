/**
 * Génère `src/services/user-docs.embedded.generated.ts` depuis `docs/instructions/`.
 * Format compact (une entrée JSON par ligne) pour rester sous les plafonds ARCH.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');
const sourceRoot = path.join(root, 'docs', 'instructions');
const targetFile = path.join(root, 'src', 'services', 'docs', 'user-docs.embedded.generated.ts');

function walkMarkdownFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(full, base));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function extractTitle(content, fallback) {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

function toId(relativePath) {
  return relativePath
    .replace(/\.md$/i, '')
    .replace(/\\/g, '/')
    .replace(/\/README$/i, '')
    .replace(/^$/, 'index')
    .replace(/[^a-zA-Z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/');
}

/**
 * Parcourt docs/instructions et écrit le module généré embarqué.
 */
export function generateInstructionsDocs() {
  const absoluteFiles = walkMarkdownFiles(sourceRoot).sort((a, b) => a.localeCompare(b, 'fr'));
  const docs = absoluteFiles.map((abs, index) => {
    const relativePath = path.relative(sourceRoot, abs).split(path.sep).join('/');
    const content = fs.readFileSync(abs, 'utf8');
    return {
      id: toId(relativePath),
      title: extractTitle(content, relativePath),
      relativePath,
      content,
      order: index,
    };
  });

  const body = docs.map((doc) => `  ${JSON.stringify(doc)}`).join(',\n');

  const output = `/**
 * @generated Généré par scripts/instruction/instructions-docs.js — ne pas éditer à la main.
 * Documentation opérateur embarquée depuis docs/instructions/ (ADR-017).
 */

/** Descripteur d'un fichier Markdown embarqué. */
export interface EmbeddedDocFile {
  readonly id: string;
  readonly title: string;
  readonly relativePath: string;
  readonly content: string;
  readonly order: number;
}

/** Catalogue embarqué de la documentation opérateur (miroir de docs/instructions/). */
export const EMBEDDED_USER_DOCS: readonly EmbeddedDocFile[] = [
${body}
];
`;

  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, output, 'utf8');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  generateInstructionsDocs();
  process.stdout.write(`[instructions-docs] ${targetFile}\n`);
}
