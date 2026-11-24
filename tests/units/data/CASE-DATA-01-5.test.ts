import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { AgentService } from '../../../src/services/agents/agent.service.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';

function agentsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.agents', 'data', 'agents');
}

function profilsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.agents', 'data', 'profils');
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

describe("CASE-DATA-01-5 — refus de suppression d'un profil lié à un agent (SPEC-DATA-01)", () => {
  it('test_CASE_DATA_01_5_refuse_delete_profile_with_linked_agents', async () => {
    const handle = createTempDir('clientsbox-data-01-5-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      const store = new ResourceStoreService({ dataRoot });
      const agentService = new AgentService({ store });

      writeJson(path.join(profilsDir(handle.dir), 'profil-shared.json'), {
        id: 'profil-shared',
        name: 'Shared',
        systemPrompt: 'Prompt',
        policy: 'chaque_prompt',
      });
      writeJson(path.join(agentsDir(handle.dir), 'agent-1.json'), {
        id: 'agent-1',
        name: 'Agent 1',
        profilId: 'profil-shared',
        cliId: 'cursor-cli',
      });
      writeJson(path.join(profilsDir(handle.dir), 'profil-orphan.json'), {
        id: 'profil-orphan',
        name: 'Orphan',
        systemPrompt: 'Prompt',
        policy: 'chaque_prompt',
      });

      await assert.rejects(
        () => agentService.deleteProfile('profil-shared'),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.match(String(err), /profil|agent|référenc/i);
          const httpStatus = (err as { httpStatus?: number }).httpStatus;
          assert.equal(httpStatus, 409);
          return true;
        },
      );
      assert.ok(fs.existsSync(path.join(profilsDir(handle.dir), 'profil-shared.json')));

      await agentService.deleteProfile('profil-orphan');
      assert.equal(fs.existsSync(path.join(profilsDir(handle.dir), 'profil-orphan.json')), false);
    } finally {
      handle.cleanup();
    }
  });
});
