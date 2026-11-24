import fs from 'node:fs';
import path from 'node:path';

/**
 * Nettoie le dossier des artefacts d'exécution de test (out/test-runs/).
 * Recrée un dossier propre et y dépose un clean.log initial.
 */
const targetDir = path.join(process.cwd(), 'out', 'test-runs');

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

fs.mkdirSync(targetDir, { recursive: true });

const logFile = path.join(targetDir, 'clean.log');
const dateIso = new Date().toISOString();
fs.writeFileSync(logFile, `[CLEAN_SLATE] Nettoyage initialise avec succes le ${dateIso}\n`, 'utf8');

console.log(`[clean-test-runs] Repertoire ${targetDir} initialise a ${dateIso}`);
