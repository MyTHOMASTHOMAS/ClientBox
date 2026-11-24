import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { CLIENTSBOX_CLI_SCHEMA } from '../../../src/config/cli-flags.config.js';
import { DEFAULT_SERVER_PORT } from '../../../src/config/constants.config.js';
import {
  parseCliArgs,
  ServerCliParseError,
} from '../../../src/lib/process/args-parser/index.js';

describe('CASE-SRV-01-5 — Parsing des arguments CLI de l\'option d\'exécution directe --exec-scene (SPEC-SRV-01)', () => {
  it('test_CASE_SRV_01_5_cli_args_parsing_exec_scene', () => {
    const parse = (argv: readonly string[]) => {
      const res = parseCliArgs(argv, CLIENTSBOX_CLI_SCHEMA);
      return {
        port: Number(res.values.port),
        execScene: res.values.execScene as string | undefined,
      };
    };

    // 1. Valeur par défaut en l'absence de --exec-scene
    const defaultArgs = parse([]);
    assert.equal(defaultArgs.port, DEFAULT_SERVER_PORT);
    assert.equal(defaultArgs.execScene, undefined);

    // 2. Syntaxe avec espace : --exec-scene <cible>
    const spaceArgs = parse(['--exec-scene', 'test-step1-dialogue']);
    assert.equal(spaceArgs.port, DEFAULT_SERVER_PORT);
    assert.equal(spaceArgs.execScene, 'test-step1-dialogue');

    // 3. Syntaxe avec égal : --exec-scene=<cible>
    const equalsArgs = parse(['--exec-scene=mon-scenario-demo']);
    assert.equal(equalsArgs.port, DEFAULT_SERVER_PORT);
    assert.equal(equalsArgs.execScene, 'mon-scenario-demo');

    // 4. Combinaison avec option de port : -p 8080 --exec-scene scenario-test
    const combinedShort = parse(['-p', '8080', '--exec-scene', 'scenario-test']);
    assert.equal(combinedShort.port, 8080);
    assert.equal(combinedShort.execScene, 'scenario-test');

    // 5. Combinaison avec --port=9000 et --exec-scene=sc-alpha
    const combinedLong = parse(['--port=9000', '--exec-scene=sc-alpha']);
    assert.equal(combinedLong.port, 9000);
    assert.equal(combinedLong.execScene, 'sc-alpha');

    // 6. Absence d'option --exec-scene avec port personnalisé
    const portOnlyArgs = parse(['--port', '3000']);
    assert.equal(portOnlyArgs.port, 3000);
    assert.equal(portOnlyArgs.execScene, undefined);

    // 7. Erreur : --exec-scene sans valeur à la fin de argv
    assert.throws(
      () => parse(['--exec-scene']),
      (err: unknown) => {
        assert.ok(err instanceof ServerCliParseError);
        assert.match((err as Error).message, /--exec-scene/i);
        return true;
      },
    );

    // 8. Erreur : --exec-scene= avec valeur vide
    assert.throws(
      () => parse(['--exec-scene=']),
      (err: unknown) => {
        assert.ok(err instanceof ServerCliParseError);
        assert.match((err as Error).message, /--exec-scene/i);
        return true;
      },
    );
  });
});
