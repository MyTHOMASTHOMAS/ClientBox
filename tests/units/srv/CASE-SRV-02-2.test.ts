import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  formatServerAccessUrl,
  writeServerReadyMessage,
} from '../../../src/lib/process/startup-banner.printer.js';
import { installSpawnMock } from '../../helpers/mock-spawn.js';

describe("CASE-SRV-02-2 — affichage console de l'URL sans ouverture automatique de navigateur (SPEC-SRV-02)", () => {
  it('test_CASE_SRV_02_2_console_url_display_without_browser_auto_open', async () => {
    const spawnCtrl = installSpawnMock();
    try {
      const lines2974: string[] = [];
      writeServerReadyMessage(2974, (chunk) => {
        lines2974.push(chunk);
      });
      const stdout2974 = lines2974.join('');
      assert.match(stdout2974, /http:\/\/localhost:2974/);
      assert.equal(formatServerAccessUrl(2974), 'http://localhost:2974');

      const lines8080: string[] = [];
      writeServerReadyMessage(8080, (chunk) => {
        lines8080.push(chunk);
      });
      assert.match(lines8080.join(''), /http:\/\/localhost:8080/);

      const browserLaunchPatterns = [/xdg-open/i, /\bopen\b/i, /explorer\.exe/i, /\bstart\b/i];
      for (const record of spawnCtrl.spawns) {
        const joined = `${record.command} ${record.args.join(' ')}`;
        for (const pattern of browserLaunchPatterns) {
          assert.doesNotMatch(joined, pattern);
        }
      }
    } finally {
      spawnCtrl.restore();
    }
  });
});
