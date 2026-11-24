import fs from 'node:fs';
import path from 'node:path';

/**
 * Script de test récursif : ajoute une ligne incrémentale dans step5-recursion.txt.
 */
const targetDir = path.join(process.cwd(), 'out', 'test-runs');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetFile = path.join(targetDir, 'step5-recursion.txt');
let currentLines = 0;

if (fs.existsSync(targetFile)) {
  const content = fs.readFileSync(targetFile, 'utf8');
  currentLines = content
    .split(/\r?\n/u)
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length;
}

const nextIteration = currentLines + 1;
const now = new Date().toISOString();
const newLine = `iteration ${nextIteration} - ${now}\n`;

fs.appendFileSync(targetFile, newLine, 'utf8');
console.log(`[append-recursion-line] Ligne ${nextIteration} enregistree a ${now}`);
