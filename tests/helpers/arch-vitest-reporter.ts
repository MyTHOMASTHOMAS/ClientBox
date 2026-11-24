/**
 * Reporter Vitest personnalisé pour la génération automatique de out/
 * à l'issue de l'exécution des tests Vitest (SPEC-ARCH-09).
 */

import {
  generateArchitectureMarkdownAuditReport,
  type ArchitectureAuditRunResults,
  type BlockingErrorEntry,
} from './audit-markdown-reporter.js';

interface TestCaseLike {
  readonly name?: string;
  readonly fullName?: string;
  readonly result?:
    | (() => {
        readonly state?: string;
        readonly errors?: readonly { readonly message?: string }[];
      })
    | { readonly state?: string; readonly errors?: readonly { readonly message?: string }[] };
}

interface TestModuleLike {
  readonly moduleId?: string;
  readonly relativeModuleId?: string;
  readonly children?: {
    readonly allTests?: () => Iterable<TestCaseLike>;
  };
}

export class ArchVitestReporter {
  onTestRunEnd(
    testModules?: readonly TestModuleLike[],
    _unhandledErrors?: readonly unknown[],
    _reason?: string,
  ): void {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const blockingErrors: BlockingErrorEntry[] = [];

    if (Array.isArray(testModules)) {
      for (const module of testModules) {
        const filePath = module.relativeModuleId ?? module.moduleId ?? 'unknown';
        if (module.children && typeof module.children.allTests === 'function') {
          for (const testCase of module.children.allTests()) {
            totalTests += 1;
            const res = typeof testCase.result === 'function' ? testCase.result() : testCase.result;
            const state = res?.state;
            if (state === 'passed') {
              passedTests += 1;
            } else if (state === 'failed') {
              failedTests += 1;
              const rawMsg = res?.errors?.[0]?.message ?? 'Test failed';
              const cleanMsg =
                rawMsg
                  .replace(/^AssertionError:\s*expected\s+[^\n]+\s+to\s+[^\n]+\n?/u, '')
                  .trim() || rawMsg;
              blockingErrors.push({
                file: filePath,
                rule: testCase.fullName ?? testCase.name ?? 'unnamed-test',
                message: cleanMsg,
              });
            }
          }
        }
      }
    }

    const results: ArchitectureAuditRunResults = {
      totalTests,
      passedTests,
      failedTests,
      blockingErrors,
    };

    generateArchitectureMarkdownAuditReport({
      projectRoot: process.cwd(),
      results,
    });
  }

  onFinished(files?: readonly TestModuleLike[]): void {
    this.onTestRunEnd(files);
  }
}
