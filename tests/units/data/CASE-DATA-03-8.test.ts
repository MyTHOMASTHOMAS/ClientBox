import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import { validateGraph } from '../../../src/domain/graph/graph-integrity.validator.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';

type GraphValidateOptions = {
  readonly scenarioId: string;
  readonly scenarioExists?: (id: string) => boolean;
};

function validateScenarioGraph(
  nodes: readonly ScenarioNode[],
  connections: Scenario['connections'],
  options: GraphValidateOptions,
) {
  return (validateGraph as (
    nodes: readonly ScenarioNode[],
    connections: Scenario['connections'],
    options?: GraphValidateOptions,
  ) => string[])(nodes, connections, options);
}

describe('CASE-DATA-03-8 — command commandLine persist / validate (SPEC-DATA-03)', () => {
  it('test_CASE_DATA_03_8_command_node_persist_and_validate_command_line', async () => {
    const handle = createTempDir('clientsbox-data-03-8-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      const store = new ResourceStoreService({ dataRoot });

      const commandNode = {
        id: 'cmd-1',
        type: 'command',
        commandLine: 'npm test',
        position: { x: 10, y: 20 },
      } as ScenarioNode;

      const scenario: Scenario = {
        id: 'scenario-cmd',
        name: 'Scénario Command',
        nodes: [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          commandNode,
        ],
        connections: [
          {
            sourceNodeId: 'start-1',
            sourcePortIndex: 0,
            targetNodeId: 'cmd-1',
            targetPortIndex: 0,
            key: '0',
          },
        ],
      };
      await store.createScenario(scenario);

      const raw = JSON.parse(
        fs.readFileSync(path.join(dataRoot, 'scenarios', 'scenario-cmd.json'), 'utf8'),
      ) as Scenario;
      const persisted = raw.nodes.find((n) => n.id === 'cmd-1') as ScenarioNode & {
        commandLine?: string;
      };
      assert.equal(persisted?.type, 'command');
      assert.equal(persisted?.commandLine, 'npm test');

      const reloaded = await store.getScenario('scenario-cmd');
      const reloadedCmd = reloaded.nodes.find((n) => n.id === 'cmd-1') as ScenarioNode & {
        commandLine?: string;
      };
      assert.equal(reloadedCmd?.commandLine, 'npm test');

      const exists = (id: string) =>
        fs.existsSync(path.join(dataRoot, 'scenarios', `${id}.json`));

      // 1. Commande valide : pas d'erreur sur commandLine
      const validErrors = validateScenarioGraph(
        [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          {
            id: 'cmd-valid',
            type: 'command' as any,
            commandLine: 'npm test',
            position: { x: 0, y: 0 },
          } as ScenarioNode,
        ],
        [],
        { scenarioId: 'scenario-cmd', scenarioExists: exists },
      );
      assert.equal(
        validErrors.filter((e) => /command|commandLine/i.test(e)).length,
        0,
        'Un bloc command avec commandLine non vide doit être accepté',
      );

      // 2. Commande vide : rejet obligatoire (REQ-043)
      const emptyErrors = validateScenarioGraph(
        [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          {
            id: 'cmd-empty',
            type: 'command' as any,
            commandLine: '',
            position: { x: 0, y: 0 },
          } as ScenarioNode,
        ],
        [],
        { scenarioId: 'scenario-cmd', scenarioExists: exists },
      );
      assert.ok(
        emptyErrors.some((e) => /commandLine.*vide|manquant/i.test(e)),
        'commandLine vide doit produire une erreur explicite',
      );

      // 3. Commande whitespace : rejet obligatoire (REQ-043)
      const wsErrors = validateScenarioGraph(
        [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          {
            id: 'cmd-ws',
            type: 'command' as any,
            commandLine: '    ',
            position: { x: 0, y: 0 },
          } as ScenarioNode,
        ],
        [],
        { scenarioId: 'scenario-cmd', scenarioExists: exists },
      );
      assert.ok(
        wsErrors.some((e) => /commandLine.*vide|manquant/i.test(e)),
        'commandLine whitespace doit produire une erreur explicite',
      );

      // 4. Commande absente (undefined) : rejet obligatoire (REQ-043)
      const missingErrors = validateScenarioGraph(
        [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
          {
            id: 'cmd-miss',
            type: 'command' as any,
            position: { x: 0, y: 0 },
          } as ScenarioNode,
        ],
        [],
        { scenarioId: 'scenario-cmd', scenarioExists: exists },
      );
      assert.ok(
        missingErrors.some((e) => /commandLine.*vide|manquant/i.test(e)),
        'commandLine manquant doit produire une erreur explicite',
      );
    } finally {
      handle.cleanup();
    }
  });
});
