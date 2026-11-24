import fs from 'node:fs';
import path from 'node:path';

/**
 * Script de copie des configurations templates vers `.agents/data/` pour le développement local.
 * Vide d'abord la destination pour éviter des résidus hors templates.
 * Les fichiers créés sous `.agents/data/` sont ignorés par Git (.gitignore).
 */
const root = process.cwd();
const srcDir = path.join(root, 'templates', 'data');
const destDir = path.join(root, '.agents', 'data');

if (!fs.existsSync(srcDir)) {
  console.error(`[seed-dev] Répertoire source introuvable : ${srcDir}`);
  process.exit(1);
}

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
  console.log(`[seed-dev] Destination nettoyée : ${destDir}`);
}

fs.mkdirSync(path.dirname(destDir), { recursive: true });
fs.cpSync(srcDir, destDir, { recursive: true });
console.log(`[seed-dev] Configurations de test copiées avec succès vers : ${destDir}`);
