import fs from 'node:fs';
import path from 'node:path';

/**
 * Script de condition If Step 2 (Branching dynamique).
 * Vrai si out/test-runs/step2-trigger.txt existe et contient "VRAI".
 *
 * @returns {boolean}
 */
export default function ifStep2Branching() {
  const filePath = path.join(process.cwd(), 'out', 'test-runs', 'step2-trigger.txt');
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('VRAI');
}
