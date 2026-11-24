import type { IncomingMessage, ServerResponse } from 'node:http';

import { getEmbeddedAsset } from './embedded-assets.generated.js';

/**
 * Distribue les assets statiques in-memory de l'UI (LIB-008 / SPEC-SRV-02 / ADR-012).
 * `/` → `index.html` ; MIME html / javascript / css ; 404 si absent.
 *
 * @param req Requête HTTP entrante
 * @param res Réponse HTTP
 */
export function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const rawUrl = req.url ?? '/';
  const pathname = rawUrl.split('?')[0] ?? '/';
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');

  const embedded = getEmbeddedAsset(relativePath);
  if (embedded !== null) {
    res.statusCode = 200;
    res.setHeader('Content-Type', embedded.mimeType);
    res.end(embedded.content);
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Ressource introuvable.');
}
