import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createTempDir, type TempDirHandle } from '../../helpers/temp-dir.js';
import { CLIENTSBOX_ENV_SCHEMA } from '../../../src/config/env.config.js';
import { DEFAULT_SERVER_PORT } from '../../../src/config/constants.config.js';
import {
  initializeAndConfirmEnvironment,
  EnvLoadError,
  type InitializeEnvEngineOptions,
} from '../../../src/lib/process/env/index.js';

function initializeEnvironment(options: InitializeEnvEngineOptions) {
  const result = initializeAndConfirmEnvironment(CLIENTSBOX_ENV_SCHEMA, options);
  return {
    loadedFromFile: result.isLoadedFromFile,
    config: result.config,
  };
}

describe("CASE-SRV-01-9 — Résolution runtime de l'environnement, validation des obligatoires et gestion des erreurs (SPEC-SRV-01)", () => {
  let tempHandle: TempDirHandle;
  let savedEnv: NodeJS.ProcessEnv;
  let mockCursorBin: string;
  let mockAntigravityBin: string;
  let mockCodexBin: string;
  let mockClaudeBin: string;

  beforeEach(() => {
    tempHandle = createTempDir('cb-test-env-01-9-');
    savedEnv = { ...process.env };

    // Crée les binaires factices dans le dossier temporaire pour satisfaire la validation
    mockCursorBin = path.join(tempHandle.dir, 'cursor-mock');
    mockAntigravityBin = path.join(tempHandle.dir, 'antigravity-mock');
    mockCodexBin = path.join(tempHandle.dir, 'codex-mock');
    mockClaudeBin = path.join(tempHandle.dir, 'claude-mock');

    fs.writeFileSync(mockCursorBin, '#!/bin/sh\nexit 0', { mode: 0o777 });
    fs.writeFileSync(mockAntigravityBin, '#!/bin/sh\nexit 0', { mode: 0o777 });
    fs.writeFileSync(mockCodexBin, '#!/bin/sh\nexit 0', { mode: 0o777 });
    fs.writeFileSync(mockClaudeBin, '#!/bin/sh\nexit 0', { mode: 0o777 });
  });

  afterEach(() => {
    tempHandle.cleanup();
    for (const key of Object.keys(process.env)) {
      if (!(key in savedEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, savedEnv);
  });

  it('test_CASE_SRV_01_9_loads_default_env_file_if_present', () => {
    const envDir = path.join(tempHandle.dir, 'env');
    fs.mkdirSync(envDir, { recursive: true });
    const defaultEnvFile = path.join(envDir, '.env');
    fs.writeFileSync(
      defaultEnvFile,
      `CURSOR_CLI_BIN=${mockCursorBin}\nANTIGRAVITY_CLI_BIN=${mockAntigravityBin}\nCODEX_CLI_BIN=${mockCodexBin}\nCLAUDE_CLI_BIN=${mockClaudeBin}\nPORT=4567\nLOGS_DISABLED=true\nHOST=0.0.0.0\n`,
    );

    const result = initializeEnvironment({ workspacePath: tempHandle.dir });
    assert.equal(result.loadedFromFile, true);
    assert.equal(process.env.PORT, '4567');
    assert.equal(process.env.LOGS_DISABLED, 'true');
    assert.equal(process.env.HOST, '0.0.0.0');
    assert.equal(process.env.CURSOR_CLI_BIN, mockCursorBin);
    assert.equal(process.env.ANTIGRAVITY_CLI_BIN, mockAntigravityBin);
    assert.equal(process.env.CODEX_CLI_BIN, mockCodexBin);
    assert.equal(process.env.CLAUDE_CLI_BIN, mockClaudeBin);
  });

  it('test_CASE_SRV_01_9_resilient_when_default_env_absent', () => {
    // Aucun fichier env/.env présent, variables fournies dans l'environnement du process
    process.env.CURSOR_CLI_BIN = mockCursorBin;
    process.env.ANTIGRAVITY_CLI_BIN = mockAntigravityBin;
    process.env.CODEX_CLI_BIN = mockCodexBin;
    process.env.CLAUDE_CLI_BIN = mockClaudeBin;

    const result = initializeEnvironment({ workspacePath: tempHandle.dir });
    assert.equal(result.loadedFromFile, false);
    // Les valeurs par défaut sont appliquées
    assert.equal(process.env.PORT, String(DEFAULT_SERVER_PORT));
    assert.equal(process.env.HOST, '127.0.0.1');
    assert.equal(process.env.AGENTS_DIR, '.agents');
    assert.equal(process.env.LOGS_DISABLED, 'false');
  });

  it('test_CASE_SRV_01_9_strict_error_if_explicit_env_file_missing', () => {
    const missingFile = path.join(tempHandle.dir, 'missing-config.env');

    expect(() => {
      initializeEnvironment({ envFile: missingFile, workspacePath: tempHandle.dir });
    }).toThrowError(EnvLoadError);

    expect(() => {
      initializeEnvironment({ envFile: missingFile, workspacePath: tempHandle.dir });
    }).toThrow(/n'existe pas/i);
  });

  it('test_CASE_SRV_01_9_loads_explicit_env_file_if_present', () => {
    const customFile = path.join(tempHandle.dir, 'custom.env');
    fs.writeFileSync(
      customFile,
      `CURSOR_CLI_BIN=${mockCursorBin}\nANTIGRAVITY_CLI_BIN=${mockAntigravityBin}\nCODEX_CLI_BIN=${mockCodexBin}\nCLAUDE_CLI_BIN=${mockClaudeBin}\nPORT=8888\nAGENTS_DIR=my-agents\n`,
    );

    const result = initializeEnvironment({
      envFile: customFile,
      workspacePath: tempHandle.dir,
    });
    assert.equal(result.loadedFromFile, true);
    assert.equal(process.env.PORT, '8888');
    assert.equal(process.env.AGENTS_DIR, 'my-agents');
  });

  it('test_CASE_SRV_01_9_fatal_error_if_cli_bins_missing', () => {
    // 1. Manque CURSOR_CLI_BIN
    delete process.env.CURSOR_CLI_BIN;
    delete process.env.ANTIGRAVITY_CLI_BIN;
    delete process.env.CODEX_CLI_BIN;
    delete process.env.CLAUDE_CLI_BIN;

    const envDir = path.join(tempHandle.dir, 'env');
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(path.join(envDir, '.env'), 'PORT=3000\n');

    expect(() => {
      initializeEnvironment({ workspacePath: tempHandle.dir });
    }).toThrow(/CURSOR_CLI_BIN/i);

    // 2. CURSOR présent mais manque ANTIGRAVITY_CLI_BIN
    process.env.CURSOR_CLI_BIN = mockCursorBin;
    expect(() => {
      initializeEnvironment({ workspacePath: tempHandle.dir });
    }).toThrow(/ANTIGRAVITY_CLI_BIN/i);

    // 3. CURSOR et ANTIGRAVITY présents mais manque CODEX_CLI_BIN
    process.env.ANTIGRAVITY_CLI_BIN = mockAntigravityBin;
    expect(() => {
      initializeEnvironment({ workspacePath: tempHandle.dir });
    }).toThrow(/CODEX_CLI_BIN/i);

    // 4. CURSOR, ANTIGRAVITY et CODEX présents mais manque CLAUDE_CLI_BIN
    process.env.CODEX_CLI_BIN = mockCodexBin;
    expect(() => {
      initializeEnvironment({ workspacePath: tempHandle.dir });
    }).toThrow(/CLAUDE_CLI_BIN/i);
  });

  it('test_CASE_SRV_01_9_assigns_default_values_to_optional_variables', () => {
    process.env.CURSOR_CLI_BIN = mockCursorBin;
    process.env.ANTIGRAVITY_CLI_BIN = mockAntigravityBin;
    process.env.CODEX_CLI_BIN = mockCodexBin;
    process.env.CLAUDE_CLI_BIN = mockClaudeBin;

    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.AGENTS_DIR;
    delete process.env.LOGS_DISABLED;
    delete process.env.CALL_SCENARIO_MAX_DEPTH;

    initializeEnvironment({ workspacePath: tempHandle.dir });

    assert.equal(process.env.PORT, '2974');
    assert.equal(process.env.HOST, '127.0.0.1');
    assert.equal(process.env.AGENTS_DIR, '.agents');
    assert.equal(process.env.LOGS_DISABLED, 'false');
    assert.equal(process.env.CALL_SCENARIO_MAX_DEPTH, '-1');
    assert.equal(process.env.ANTIGRAVITY_PROBE_TIMEOUT_MS, '15000');
    assert.equal(process.env.CODEX_PROBE_TIMEOUT_MS, '15000');
    assert.equal(process.env.CLAUDE_PROBE_TIMEOUT_MS, '15000');
  });
});
