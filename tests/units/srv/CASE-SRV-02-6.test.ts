import { describe, it, expect } from 'vitest';
import { PassThrough } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import { parseJsonBody } from '../../../src/lib/http/json-body.parser.js';

function createMockRequest(
  chunks: readonly (string | Buffer)[],
  headers: Record<string, string> = {},
): IncomingMessage {
  const stream = new PassThrough();
  Object.assign(stream, { headers, method: 'POST', url: '/api/test' });

  queueMicrotask(() => {
    for (const chunk of chunks) {
      stream.write(chunk);
    }
    stream.end();
  });

  return stream as unknown as IncomingMessage;
}

describe('CASE-SRV-02-6 — Extraction streaming sécurisée du corps JSON avec garde-fou mémoire (SPEC-SRV-02)', () => {
  it('test_CASE_SRV_02_6_secure_json_body_parsing_with_memory_guard', async () => {
    // 1. Parsing nominal d'un corps JSON
    const payload = { name: 'Agent Test', profilId: 'p-1', cliId: 'cursor-cli' };
    const reqNominal = createMockRequest([JSON.stringify(payload)]);
    const parsed = await parseJsonBody<typeof payload>(reqNominal);
    expect(parsed).toEqual(payload);

    // 2. Corps JSON malformé
    const reqMalformed = createMockRequest(['{"name": "incomplet...']);
    await expect(parseJsonBody(reqMalformed)).rejects.toThrow(/JSON|syntaxe|invalide|erreur/i);

    // 3. Corps vide
    const reqEmpty = createMockRequest([]);
    await expect(parseJsonBody(reqEmpty)).rejects.toThrow(/vide|manquant|JSON|erreur/i);

    // 4. Dépassement de la taille maximale (garde-fou 1 Mo)
    const largeChunk = Buffer.alloc(1024 * 1024 + 100, 65); // > 1 Mo
    const reqTooLarge = createMockRequest([largeChunk]);
    await expect(parseJsonBody(reqTooLarge)).rejects.toThrow(
      /taille|volumétrie|1048576|limite|trop grand/i,
    );
  });
});
