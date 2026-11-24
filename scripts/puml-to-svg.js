import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import plantumlEncoder from 'plantuml-encoder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nom du script sans extension
const SCRIPT_NAME = path.basename(__filename, path.extname(__filename));
const ROOT_DIR = path.resolve(__dirname, '..');
const PLANTUML_SERVER_URL = 'https://www.plantuml.com/plantuml/svg';
const KROKI_PLANTUML_URL = 'https://kroki.io/plantuml/svg';
/** Au-delà de cette taille d'URL, le serveur PlantUML public renvoie HTTP 400. */
const PLANTUML_GET_URL_LIMIT = 4096;

// Dossiers à ignorer lors d'un parcours récursif
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.idea',
  '.vscode',
  'out',
  'scratch',
  'tmp',
  'temp',
  '.local',
]);

/**
 * Recherche récursivement tous les fichiers .puml dans un répertoire
 */
async function findPumlFiles(dirPath) {
  const pumlFiles = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        const subFiles = await findPumlFiles(fullPath);
        pumlFiles.push(...subFiles);
      }
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.puml')) {
      pumlFiles.push(fullPath);
    }
  }

  return pumlFiles;
}

/**
 * Télécharge et génère le fichier SVG pour un fichier .puml donné
 */
async function convertPumlToSvg(pumlFilePath) {
  const relativePumlPath = path.relative(ROOT_DIR, pumlFilePath).replace(/\\/g, '/');
  const dirName = path.dirname(pumlFilePath);
  const baseName = path.basename(pumlFilePath, path.extname(pumlFilePath));
  const svgFilePath = path.join(dirName, `${baseName}.svg`);
  const relativeSvgPath = path.relative(ROOT_DIR, svgFilePath).replace(/\\/g, '/');

  console.log(`📄 Traitement : \x1b[36m${relativePumlPath}\x1b[0m`);

  // 1. Lecture du fichier PUML
  const pumlContent = await fs.readFile(pumlFilePath, 'utf-8');
  if (!pumlContent.trim()) {
    console.warn(`  ⚠️  Fichier vide ignoré : ${relativePumlPath}`);
    return null;
  }

  // 2. Encodage PlantUML
  const encoded = plantumlEncoder.encode(pumlContent);
  const url = `${PLANTUML_SERVER_URL}/${encoded}`;

  // 3. Requête HTTP — GET PlantUML ou POST Kroki si diagramme trop volumineux
  const startTime = Date.now();
  let response;
  if (url.length > PLANTUML_GET_URL_LIMIT) {
    console.log(`  ℹ️  Diagramme volumineux (${url.length} chars URL) — génération via Kroki POST`);
    response = await fetch(KROKI_PLANTUML_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: pumlContent,
    });
  } else {
    response = await fetch(url);
  }

  if (!response.ok) {
    throw new Error(
      `Échec de la requête vers PlantUML (HTTP ${response.status} ${response.statusText}) pour ${relativePumlPath}`,
    );
  }

  const svgContent = await response.text();

  // Vérification que le contenu retourné est bien un SVG valide
  if (!svgContent.includes('<svg') && !svgContent.includes('</svg>')) {
    throw new Error(`La réponse reçue pour ${relativePumlPath} n'est pas un SVG valide.`);
  }

  // 4. Écriture du fichier SVG à côté du PUML
  await fs.writeFile(svgFilePath, svgContent, 'utf-8');
  const durationMs = Date.now() - startTime;
  const sizeKb = (Buffer.byteLength(svgContent, 'utf-8') / 1024).toFixed(2);

  console.log(
    `  ✅ SVG généré : \x1b[32m${relativeSvgPath}\x1b[0m (${sizeKb} Ko, ${durationMs}ms)`,
  );

  return {
    pumlPath: relativePumlPath,
    svgPath: relativeSvgPath,
    sizeKb,
    url,
  };
}

/**
 * Affiche l'aide et les exemples d'utilisation
 */
function printUsage() {
  console.log(`\nUsage:`);
  console.log(`  node scripts/${SCRIPT_NAME}.js <chemin/vers/fichier.puml>`);
  console.log(`  npm run puml:svg -- <chemin/vers/fichier.puml>`);
  console.log(`  npm run puml:svg -- <dossier>`);
  console.log(`  npm run puml:svg -- --all\n`);
  console.log(`Exemples:`);
  console.log(`  node scripts/${SCRIPT_NAME}.js general/ecosystem/arch.puml`);
  console.log(`  npm run puml:svg -- general/ecosystem/arch.puml`);
  console.log(`  npm run puml:svg -- --all\n`);
}

/**
 * Point d'entrée principal
 */
async function main() {
  const args = process.argv.slice(2);

  console.log(`🚀 Convertisseur PlantUML (.puml ➔ .svg) : ${SCRIPT_NAME}`);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printUsage();
    return;
  }

  const targetPaths = [];

  for (const arg of args) {
    if (arg === '--all' || arg === '-a') {
      const allFiles = await findPumlFiles(ROOT_DIR);
      targetPaths.push(...allFiles);
    } else {
      const resolvedPath = path.resolve(process.cwd(), arg);
      try {
        const stat = await fs.stat(resolvedPath);
        if (stat.isDirectory()) {
          const filesInDir = await findPumlFiles(resolvedPath);
          targetPaths.push(...filesInDir);
        } else if (stat.isFile()) {
          targetPaths.push(resolvedPath);
        }
      } catch {
        console.error(`❌ Chemin introuvable : ${arg} (${resolvedPath})`);
      }
    }
  }

  // Déduplication des chemins
  const uniquePaths = [...new Set(targetPaths)];

  if (uniquePaths.length === 0) {
    console.warn(`⚠️  Aucun fichier .puml trouvé à traiter.\n`);
    return;
  }

  console.log(`🔍 ${uniquePaths.length} fichier(s) .puml identifié(s).\n`);

  const results = [];
  const errors = [];

  for (const pumlFile of uniquePaths) {
    try {
      const res = await convertPumlToSvg(pumlFile);
      if (res) results.push(res);
    } catch (err) {
      console.error(`  ❌ Erreur sur ${pumlFile} :`, err.message);
      errors.push({ file: pumlFile, error: err.message });
    }
  }

  console.log(
    `\n🎉 Bilan : ${results.length}/${uniquePaths.length} fichier(s) SVG généré(s) avec succès.`,
  );
  if (errors.length > 0) {
    console.error(`⚠️  ${errors.length} erreur(s) survenue(s).`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Erreur fatale lors de l’exécution du script :', err);
  process.exit(1);
});
