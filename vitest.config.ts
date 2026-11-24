import { defineConfig } from 'vitest/config';
import { ArchVitestReporter } from './tests/helpers/arch-vitest-reporter.js';

/**
 * Configuration Vitest — ADR-007 (CR-001).
 * Tests 100 % TypeScript, sans transpilation manuelle ni fichiers `.js` miroirs.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', '**/node_modules/**'],
    globals: false,
    isolate: true,
    fileParallelism: false,
    testTimeout: 15_000,
    reporters: ['default', new ArchVitestReporter()],
  },
});
