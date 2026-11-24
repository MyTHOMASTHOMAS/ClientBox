import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { CLIENTSBOX_CLI_SCHEMA } from '../../../src/config/cli-flags.config.js';
import { DEFAULT_SERVER_PORT } from '../../../src/config/constants.config.js';
import {
  parseCliArgs,
  ServerCliParseError,
} from '../../../src/lib/process/args-parser/index.js';

describe("CASE-SRV-01-8 — Parsing des arguments CLI des options de fichier d'environnement -e et --env (SPEC-SRV-01)", () => {
  it('test_CASE_SRV_01_8_cli_args_parsing_env_file', () => {
    const parse = (argv: readonly string[]) => {
      const res = parseCliArgs(argv, CLIENTSBOX_CLI_SCHEMA);
      return {
        port: Number(res.values.port),
        envFile: res.values.envFile as string | undefined,
        execScene: res.values.execScene as string | undefined,
      };
    };

    // 1. Valeur par défaut en l'absence d'option d'environnement
    const defaultArgs = parse([]);
    assert.equal(defaultArgs.port, DEFAULT_SERVER_PORT);
    assert.equal(defaultArgs.envFile, undefined);

    // 2. Syntaxe courte avec espace : -e <chemin>
    const shortSpaceArgs = parse(['-e', 'config/custom.env']);
    assert.equal(shortSpaceArgs.port, DEFAULT_SERVER_PORT);
    assert.equal(shortSpaceArgs.envFile, 'config/custom.env');

    // 3. Syntaxe longue avec espace : --env <chemin>
    const longSpaceArgs = parse(['--env', 'prod.env']);
    assert.equal(longSpaceArgs.port, DEFAULT_SERVER_PORT);
    assert.equal(longSpaceArgs.envFile, 'prod.env');

    // 4. Syntaxe longue avec égal : --env=<chemin>
    const longEqualsArgs = parse(['--env=test.env']);
    assert.equal(longEqualsArgs.port, DEFAULT_SERVER_PORT);
    assert.equal(longEqualsArgs.envFile, 'test.env');

    // 5. Combinaison avec port et exec-scene : -p 8080 -e local.env --exec-scene=mon-sc
    const combinedArgs = parse([
      '-p',
      '8080',
      '-e',
      'local.env',
      '--exec-scene=mon-sc',
    ]);
    assert.equal(combinedArgs.port, 8080);
    assert.equal(combinedArgs.envFile, 'local.env');
    assert.equal(combinedArgs.execScene, 'mon-sc');

    // 6. Absence d'option env avec port personnalisé
    const portOnlyArgs = parse(['--port', '3000']);
    assert.equal(portOnlyArgs.port, 3000);
    assert.equal(portOnlyArgs.envFile, undefined);

    // 7. Erreur : -e sans valeur à la fin de argv
    assert.throws(
      () => parse(['-e']),
      (err: unknown) => {
        assert.ok(err instanceof ServerCliParseError);
        assert.match((err as Error).message, /-e/i);
        return true;
      },
    );

    // 8. Erreur : --env sans valeur à la fin de argv
    assert.throws(
      () => parse(['--env']),
      (err: unknown) => {
        assert.ok(err instanceof ServerCliParseError);
        assert.match((err as Error).message, /--env/i);
        return true;
      },
    );

    // 9. Erreur : --env= avec valeur vide
    assert.throws(
      () => parse(['--env=']),
      (err: unknown) => {
        assert.ok(err instanceof ServerCliParseError);
        assert.match((err as Error).message, /--env/i);
        return true;
      },
    );
  });
});
