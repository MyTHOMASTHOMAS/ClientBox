import fs from 'node:fs';
import path from 'node:path';

/**
 * Script de condition If Step 5 (Récursion contrôlée).
 * Vrai si out/test-runs/step5-recursion.txt contient au moins 3 lignes non vides.
 *
 * @returns {boolean}
 */
export default function ifStep5Recursion() {
  const filePath = path.join(process.cwd(), 'out', 'test-runs', 'step5-recursion.txt');
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const lines = fs
    .readFileSync(filePath, 'utf-8')
    .split(/\r?\n/u)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines.length >= 3;
}
