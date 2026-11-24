/**
 * CASE-UTILS-02-1 — Catalogue d'événements sémantiques et segmentation physique par sévérité
 * (`AC-UTILS-02-1` à `AC-UTILS-02-4` / `SPEC-UTILS-02` / `ADR-014`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logScenarioStarted,
  logBlockExecuted,
  logScenarioCompleted,
  logServerListening,
  logServerClosed,
  logRequestDispatched,
  logSseConnectionOpened,
  logSseConnectionClosed,
  logResourceSaved,
  logResourceDeleted,
  logResourceLoaded,
  logAgentProcessStarted,
  logAgentProcessExited,
  logAgentPromptGenerated,
  logShutdownSignalReceived,
  logClientRequest,
  logClientResponse,
  logCanvasAction,
  logScenarioFailed,
  logBlockFailed,
  logServerFatalError,
  logRouteNotFoundError,
  logHttpInternalError,
  logStorageReadError,
  logStorageWriteError,
  logStorageDeleteError,
  logAgentSpawnFailed,
  logAgentExecutionFailed,
  logClientHttpError,
  logCanvasError,
  logInputBagTrace,
  logRouteMatched,
  logRequestHeadersTrace,
  logStorageCacheTrace,
  logAgentStreamChunkTrace,
  logClientPayloadTrace,
} from '../../../src/utils/logger/events/index.js';

describe('CASE-UTILS-02-1 — Catalogue d événements sémantiques et segmentation par sévérité', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.LOGS_DISABLED;
    delete process.env.LOGS_ENABLED;
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('test_CASE_UTILS_02_1_info_events_nominal_logging', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    // 1. Runner info
    logScenarioStarted('sc-demo', 5);
    expect(infoSpy).toHaveBeenCalled();
    const startCall = infoSpy.mock.calls[0]?.[0] as string;
    expect(startCall).toContain('[RUNNER]');
    expect(startCall).toContain('Démarrage du scénario "sc-demo" (5 blocs)');

    infoSpy.mockClear();
    logBlockExecuted('sc-demo', 'block-1', 45);
    expect(infoSpy).toHaveBeenCalled();
    const execCall = infoSpy.mock.calls[0]?.[0] as string;
    expect(execCall).toContain('[RUNNER]');
    expect(execCall).toContain('(45ms)');

    // 2. Server info
    infoSpy.mockClear();
    logServerListening(8080, '127.0.0.1');
    expect(infoSpy).toHaveBeenCalled();
    const serverCall = infoSpy.mock.calls[0]?.[0] as string;
    expect(serverCall).toContain('[SERVER]');
    expect(serverCall).toContain('http://127.0.0.1:8080');

    infoSpy.mockClear();
    logRequestDispatched('GET', '/api/scenarios');
    expect(infoSpy).toHaveBeenCalled();
    const reqCall = infoSpy.mock.calls[0]?.[0] as string;
    expect(reqCall).toContain('[SERVER]');
    expect(reqCall).toContain('GET /api/scenarios');

    // 3. Storage info
    infoSpy.mockClear();
    logResourceSaved('scenarios', 'sc-1');
    expect(infoSpy).toHaveBeenCalled();
    const saveCall = infoSpy.mock.calls[0]?.[0] as string;
    expect(saveCall).toContain('[STORAGE]');
    expect(saveCall).toContain('sc-1');

    // 4. Agent info
    infoSpy.mockClear();
    logAgentProcessStarted('block-1', 12345);
    expect(infoSpy).toHaveBeenCalled();
    const agentCall = infoSpy.mock.calls[0]?.[0] as string;
    expect(agentCall).toContain('[AGENT]');
    expect(agentCall).toContain('PID 12345');

    // 5. UI info
    infoSpy.mockClear();
    logClientRequest('POST', '/api/scenarios/run');
    expect(infoSpy).toHaveBeenCalled();
    const uiCall = infoSpy.mock.calls[0]?.[0] as string;
    expect(uiCall).toContain('[UI]');
    expect(uiCall).toContain('POST /api/scenarios/run');
  });

  it('test_CASE_UTILS_02_1_error_events_exception_logging', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // 1. Runner error
    const testError = new Error('Connexion sous-processus perdue');
    logScenarioFailed('sc-demo', testError);
    expect(errorSpy).toHaveBeenCalled();
    const errorCall = errorSpy.mock.calls[0]?.[0] as string;
    expect(errorCall).toContain('[RUNNER]');
    expect(errorCall).toContain('Échec de l\'exécution du scénario "sc-demo"');

    // 2. Server error / 404
    errorSpy.mockClear();
    logServerFatalError('listen', new Error('Port busy'));
    expect(errorSpy).toHaveBeenCalled();
    const fatalCall = errorSpy.mock.calls[0]?.[0] as string;
    expect(fatalCall).toContain('[SERVER]');

    logRouteNotFoundError('GET', '/unknown');
    expect(warnSpy).toHaveBeenCalled();

    // 3. Storage error
    errorSpy.mockClear();
    logStorageReadError('/path/data.json', new Error('ENOENT'));
    expect(errorSpy).toHaveBeenCalled();
    const storageCall = errorSpy.mock.calls[0]?.[0] as string;
    expect(storageCall).toContain('[STORAGE]');

    // 4. Agent error
    errorSpy.mockClear();
    logAgentSpawnFailed('block-9', new Error('Command failed'));
    expect(errorSpy).toHaveBeenCalled();
    const agentErrCall = errorSpy.mock.calls[0]?.[0] as string;
    expect(agentErrCall).toContain('[AGENT]');

    // 5. UI error
    errorSpy.mockClear();
    logClientHttpError('GET', '/api/test', new Error('Network error'));
    expect(errorSpy).toHaveBeenCalled();
    const uiErrCall = errorSpy.mock.calls[0]?.[0] as string;
    expect(uiErrCall).toContain('[UI]');
  });

  it('test_CASE_UTILS_02_1_debug_events_dev_prod_filtering', () => {
    process.env.NODE_ENV = 'development';
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    // Diagnostic actif en développement
    logInputBagTrace('sc-demo', 'block-1', { '0': 'valeur' });
    logRouteMatched('GET', '/api/scenarios/:id');
    logStorageCacheTrace('agents', 4);
    logAgentStreamChunkTrace('block-1', 'stdout', 128);
    logClientPayloadTrace('/api/scenarios', { count: 3 });

    expect(debugSpy).toHaveBeenCalled();

    // Silencieux en production
    debugSpy.mockClear();
    process.env.NODE_ENV = 'production';

    logInputBagTrace('sc-demo', 'block-1', { '0': 'valeur' });
    logRouteMatched('GET', '/api/scenarios/:id');
    logStorageCacheTrace('agents', 4);
    logAgentStreamChunkTrace('block-1', 'stdout', 128);
    logClientPayloadTrace('/api/scenarios', { count: 3 });

    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('test_CASE_UTILS_02_1_kill_switch_LOGS_DISABLED_on_all_events', () => {
    process.env.LOGS_DISABLED = 'true';

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logScenarioStarted('sc-demo', 5);
    logServerListening(8080);
    logResourceSaved('scenarios', 'sc-1');
    logAgentProcessStarted('node-1', 42);
    logClientRequest('GET', '/');

    logScenarioFailed('sc-demo', new Error('muet'));
    logServerFatalError('listen', new Error('muet'));
    logRouteNotFoundError('GET', '/404');
    logStorageReadError('file.json', new Error('muet'));
    logAgentSpawnFailed('node-1', new Error('muet'));
    logClientHttpError('GET', '/', new Error('muet'));

    logInputBagTrace('sc-demo', 'block-1', {});
    logRouteMatched('GET', '/');
    logStorageCacheTrace('scenarios', 1);

    expect(infoSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('test_CASE_UTILS_02_1_arity_bound_compliance', () => {
    const allFns = [
      logScenarioStarted,
      logBlockExecuted,
      logScenarioCompleted,
      logServerListening,
      logServerClosed,
      logRequestDispatched,
      logSseConnectionOpened,
      logSseConnectionClosed,
      logResourceSaved,
      logResourceDeleted,
      logResourceLoaded,
      logAgentProcessStarted,
      logAgentProcessExited,
      logAgentPromptGenerated,
      logShutdownSignalReceived,
      logClientRequest,
      logClientResponse,
      logCanvasAction,
      logScenarioFailed,
      logBlockFailed,
      logServerFatalError,
      logRouteNotFoundError,
      logHttpInternalError,
      logStorageReadError,
      logStorageWriteError,
      logStorageDeleteError,
      logAgentSpawnFailed,
      logAgentExecutionFailed,
      logClientHttpError,
      logCanvasError,
      logInputBagTrace,
      logRouteMatched,
      logRequestHeadersTrace,
      logStorageCacheTrace,
      logAgentStreamChunkTrace,
      logClientPayloadTrace,
    ];

    for (const fn of allFns) {
      expect(fn.length).toBeLessThanOrEqual(3);
    }
  });
});
