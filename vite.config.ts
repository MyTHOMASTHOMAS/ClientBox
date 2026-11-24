import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { generateEmbeddedAssets } from './scripts/build-embedded-assets.js';

/**
 * Plugin de packaging des assets UI compilés depuis src/ui/ dans embedded-assets.ts (ADR-010).
 */
function embeddedAssetsPlugin(): Plugin {
  return {
    name: 'clientsbox-embedded-assets',
    apply: 'build',
    async buildStart() {
      await generateEmbeddedAssets();
    },
  };
}

/**
 * Plugin de redémarrage à chaud en mode dev (`vite build --watch`).
 */
function devRunnerPlugin(): Plugin {
  let child: ChildProcess | null = null;

  return {
    name: 'clientsbox-dev-runner',
    apply: 'build',
    closeBundle() {
      const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');
      if (!isWatch) {
        return;
      }

      const distBundle = path.resolve(process.cwd(), 'dist/clientsbox.js');
      if (!fs.existsSync(distBundle)) {
        return;
      }

      const startProcess = (): void => {
        child = spawn('node', [distBundle], {
          stdio: 'inherit',
          cwd: process.cwd(),
        });

        child.on('error', (err) => {
          process.stderr.write(
            `[ClientsBox Dev] Erreur lors du lancement du processus : ${err.message}\n`,
          );
        });
      };

      if (child && !child.killed) {
        child.once('exit', () => {
          startProcess();
        });
        child.kill('SIGTERM');
        child = null;
      } else {
        startProcess();
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [embeddedAssetsPlugin(), devRunnerPlugin()],
    build: {
      ssr: 'src/index.ts',
      target: 'node24',
      outDir: 'dist',
      emptyOutDir: true,
      minify: mode === 'production' ? 'oxc' : false,
      rollupOptions: {
        output: {
          entryFileNames: 'clientsbox.js',
          format: 'esm',
        },
      },
    },
    ssr: {
      noExternal: true,
    },
  };
});
