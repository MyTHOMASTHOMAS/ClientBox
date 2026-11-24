import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';

describe('CASE-ADPT-02-3 — parsing flux CursorCLI en AgentStreamEvent (SPEC-ADPT-02)', () => {
  it('test_CASE_ADPT_02_3_cursor_cli_stream_parsing_to_agent_stream_event', () => {
    const adapter = new CursorCLIAdapter();

    const jsonLine = '{"type":"text","content":"Fichier index.ts modifié avec succès."}';
    const fromJson = adapter.parseStreamLine(jsonLine);
    assert.equal(fromJson.type, 'stdout');
    assert.equal(fromJson.chunk, 'Fichier index.ts modifié avec succès.');
    assert.ok(!fromJson.chunk.includes('"type"'));

    const rawLine = 'Building project packages...';
    const fromRaw = adapter.parseStreamLine(rawLine);
    assert.equal(fromRaw.type, 'stdout');
    assert.equal(fromRaw.chunk, rawLine);

    assert.doesNotThrow(() => {
      const broken = adapter.parseStreamLine('{ not-json');
      assert.equal(broken.type, 'stdout');
      assert.equal(broken.chunk, '{ not-json');
    });
  });

  it('test_CASE_ADPT_02_3_cursor_parse_output_extracts_clean_agent_text', () => {
    const adapter = new CursorCLIAdapter();

    // 1. Sortie brute JSON Cursor
    const jsonOutput = JSON.stringify({
      type: 'text',
      content: 'Fichier index.ts modifié avec succès.',
    });
    assert.equal(adapter.parseOutput(jsonOutput), 'Fichier index.ts modifié avec succès.');

    // 2. Sortie multi-lignes JSON
    const multiLineJson = [
      JSON.stringify({ type: 'text', content: 'Étape 1 validée.\n' }),
      JSON.stringify({ type: 'text', content: 'Étape 2 terminée.' }),
    ].join('\n');
    assert.equal(adapter.parseOutput(multiLineJson), 'Étape 1 validée.\nÉtape 2 terminée.');

    // 3. Fallback texte brut
    const plainText = 'Direct plain text output';
    assert.equal(adapter.parseOutput(plainText), plainText);
  });
});
