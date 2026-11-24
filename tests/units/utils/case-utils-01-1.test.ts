/**
 * CASE-UTILS-01-1 — Journalisation structurée isomorphique et kill-switch LOGS_DISABLED
 * (`AC-UTILS-01-1` / `SPEC-UTILS-01`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createLogger,
  shouldLog,
  isLogsDisabled,
  type Logger,
} from '../../../src/utils/logger/index.js';

describe('CASE-UTILS-01-1 — Journalisation structurée et variable LOGS_DISABLED', () => {
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

  it('test_CASE_UTILS_01_1_nominal_levels_logging', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const log: Logger = createLogger('auth-service', 'jwt');

    log.info('Connexion établie');
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const infoCall = infoSpy.mock.calls[0]?.[0] as string;
    expect(infoCall).toContain('[AUTH-SERVICE]');
    expect(infoCall).toContain('[jwt]');
    expect(infoCall).toContain('Connexion établie');

    log.warn('Jeton bientôt expiré');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const warnCall = warnSpy.mock.calls[0]?.[0] as string;
    expect(warnCall).toContain('[AUTH-SERVICE]');
    expect(warnCall).toContain('Jeton bientôt expiré');

    log.error('Échec validation signature', { data: { code: 'ERR_SIGNATURE' } });
    expect(errorSpy).toHaveBeenCalled();
    const errorCall = errorSpy.mock.calls[0]?.[0] as string;
    expect(errorCall).toContain('[AUTH-SERVICE]');
    expect(errorCall).toContain('Échec validation signature');
  });

  it('test_CASE_UTILS_01_1_with_tag_and_options_derivation', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const baseLog = createLogger('core', 'api');
    const childLog = baseLog.with('v2', 'users');

    childLog.info('Lecture utilisateur');
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const callArg = infoSpy.mock.calls[0]?.[0] as string;
    expect(callArg).toContain('[CORE]');
    expect(callArg).toContain('[api]');
    expect(callArg).toContain('[v2]');
    expect(callArg).toContain('[users]');
  });

  it('test_CASE_UTILS_01_1_timed_duration_measurement', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const log = createLogger('perf');
    const result = await log.timed('chargement données', async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
      return 42;
    });

    expect(result).toBe(42);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const logOutput = infoSpy.mock.calls[0]?.[0] as string;
    expect(logOutput).toContain('[PERF]');
    expect(logOutput).toContain('chargement données');
    expect(logOutput).toMatch(/\(\d+ms\)/);
  });

  it('test_CASE_UTILS_01_1_group_collapsible_execution', () => {
    const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const log = createLogger('batch');
    log.group('Traitement par lot', () => {
      log.info('Élément 1');
    });

    expect(groupSpy).toHaveBeenCalledTimes(1);
    expect(groupEndSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(2); // title + inner info
  });

  it('test_CASE_UTILS_01_1_kill_switch_LOGS_DISABLED_suppresses_all_outputs', () => {
    process.env.LOGS_DISABLED = 'true';

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    expect(isLogsDisabled()).toBe(true);

    const log = createLogger('silence-test', 'tag');
    log.info('Ne doit pas être émis');
    log.warn('Avertissement muet');
    log.error('Erreur muette');
    log.debug('Debug muet');
    log.success('Succès muet');

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
    expect(shouldLog('info', ['tag'])).toBe(false);
  });

  it('test_CASE_UTILS_01_1_kill_switch_LOGS_ENABLED_false_suppresses_all_outputs', () => {
    process.env.LOGS_ENABLED = 'false';

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    expect(isLogsDisabled()).toBe(true);

    const log = createLogger('enabled-false-test');
    log.info('Ne doit pas être émis');
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('test_CASE_UTILS_01_1_debug_suppression_in_production', () => {
    process.env.NODE_ENV = 'production';

    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const log = createLogger('prod-service');
    log.debug('Message diagnostic secret');
    log.info('Message public');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });
});
