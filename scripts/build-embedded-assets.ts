import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, type Rollup } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { generateInstructionsDocs } from './instruction/instructions-docs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

/**
 * Compile le frontend TypeScript et le CSS Tailwind v4 depuis `src/ui/`
 * et génère `src/lib/http/embedded-assets.generated.ts` en mémoire (ADR-012 / ADR-015).
 */
export async function generateEmbeddedAssets(): Promise<void> {
  generateInstructionsDocs();

  const uiEntryTsx = path.resolve(root, 'src/ui/app.tsx');
  const uiEntryTs = path.resolve(root, 'src/ui/app.ts');
  const uiEntry = fs.existsSync(uiEntryTsx) ? uiEntryTsx : uiEntryTs;
  const uiCssPath = path.resolve(root, 'src/ui/styles/app.css');

  // 1. Compilation du code TypeScript UI en mémoire via Vite
  const jsRes = await build({
    root,
    configFile: false,
    build: {
      write: false,
      lib: {
        entry: uiEntry,
        formats: ['es'],
        fileName: () => 'app.js',
      },
      minify: 'oxc',
    },
  });

  const jsBundle = (Array.isArray(jsRes) ? jsRes[0] : jsRes) as Rollup.RollupOutput;
  const firstChunk = jsBundle.output[0];
  const compiledJs = firstChunk && 'code' in firstChunk ? firstChunk.code : '';

  // 2. Compilation du CSS Tailwind v4 & Design System en mémoire via Vite (ADR-015)
  let compiledCss = '';
  if (fs.existsSync(uiCssPath)) {
    const cssRes = await build({
      root,
      configFile: false,
      plugins: [tailwindcss()],
      build: {
        write: false,
        rollupOptions: {
          input: uiCssPath,
        },
      },
    });

    const cssBundle = (Array.isArray(cssRes) ? cssRes[0] : cssRes) as Rollup.RollupOutput;
    const cssAsset = cssBundle.output.find(
      (item) => item.type === 'asset' && item.fileName.endsWith('.css'),
    );

    compiledCss =
      cssAsset && 'source' in cssAsset
        ? typeof cssAsset.source === 'string'
          ? cssAsset.source
          : Buffer.from(cssAsset.source).toString('utf8')
        : fs.readFileSync(uiCssPath, 'utf8');
  }

  // 3. Gabarit HTML autonome pour le livrable
  const indexHtml = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ClientsBox — Orchestration d'agents IA</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" href="/styles/app.css" />
  </head>
  <body>
    <div id="app" data-ui-source="embedded"></div>
    <script type="module" src="/assets/app.js"></script>
  </body>
</html>`;

  // 4. Génération de src/lib/http/embedded-assets.generated.ts
  const targetFile = path.resolve(root, 'src/lib/http/embedded-assets.generated.ts');
  const outputCode = `/**
 * @generated Ce fichier est généré automatiquement par scripts/build-embedded-assets.ts.
 * Assets statiques de l'UI compilés depuis src/ui/ et embarqués en mémoire (LIB-008 / SPEC-SRV-02 / ADR-012).
 * Fournit l'interface utilisateur web autonome pour le livrable standalone clientsbox.js.
 */

/**
 * Asset statique embarqué avec son contenu et type MIME.
 */
export interface EmbeddedAsset {
  readonly content: string;
  readonly mimeType: string;
}

const DEFAULT_INDEX_HTML = ${JSON.stringify(indexHtml)};

const DEFAULT_APP_CSS = ${JSON.stringify(compiledCss)};

const DEFAULT_APP_JS = ${JSON.stringify(compiledJs)};

/**
 * Table des assets statiques embarqués indexés par chemin relatif.
 */
const EMBEDDED_ASSETS_MAP: Readonly<Record<string, EmbeddedAsset>> = {
  'index.html': { content: DEFAULT_INDEX_HTML, mimeType: 'text/html; charset=utf-8' },
  'styles/app.css': { content: DEFAULT_APP_CSS, mimeType: 'text/css; charset=utf-8' },
  'assets/app.js': {
    content: DEFAULT_APP_JS,
    mimeType: 'application/javascript; charset=utf-8',
  },
};

/**
 * Récupère un asset statique embarqué en mémoire pour le livrable standalone.
 *
 * @param relativePath - Chemin relatif de la ressource demandée (ex: 'index.html').
 */
export function getEmbeddedAsset(relativePath: string) {
  const normalized = relativePath.replace(/^\\//, '');
  const key = normalized === '' ? 'index.html' : normalized;
  return EMBEDDED_ASSETS_MAP[key] ?? null;
}
`;

  const existing = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf8') : '';
  if (existing !== outputCode) {
    fs.writeFileSync(targetFile, outputCode, 'utf8');
    console.log(
      '[build-embedded-assets] embedded-assets.generated.ts mis à jour avec le bundle compilé de src/ui/.',
    );
  } else {
    console.log('[build-embedded-assets] embedded-assets.generated.ts est déjà à jour.');
  }
}

// Exécution directe via CLI
if (process.argv[1] === __filename) {
  generateEmbeddedAssets().catch((err: unknown) => {
    console.error('[build-embedded-assets] Erreur de génération :', err);
    process.exit(1);
  });
}
