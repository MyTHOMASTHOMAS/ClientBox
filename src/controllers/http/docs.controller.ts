/**
 * Routes HTTP documentation utilisateur (CTL-007 / ADR-017).
 */

import type { HttpRouter } from '../../types/contracts/http-router.contract.js';
import type { HttpResponseLike } from '../../types/contracts/http-router.contract.js';
import type { UserDocsService } from '../../services/docs/user-docs.service.js';

/** Options d'enregistrement des routes docs. */
export interface RegisterDocsRoutesOptions {
  readonly router: HttpRouter;
  readonly userDocs: UserDocsService;
}

function sendJson(res: HttpResponseLike, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.end(JSON.stringify(data));
}

function sendError(res: HttpResponseLike, statusCode: number, message: string) {
  sendJson(res, statusCode, { message });
}

/**
 * Enregistre GET /api/docs et POST /api/docs/export.
 *
 * @param options Routeur HTTP et service docs
 */
export function registerDocsRoutes(options: RegisterDocsRoutesOptions) {
  const { router, userDocs } = options;

  router.get('/api/docs', (_req, res) => {
    try {
      sendJson(res, 200, { documents: userDocs.listDocs() });
    } catch (err: unknown) {
      sendError(
        res,
        500,
        err instanceof Error ? err.message : 'Impossible de charger la documentation.',
      );
    }
  });

  router.post('/api/docs/export', (_req, res) => {
    try {
      sendJson(res, 200, userDocs.exportDocs());
    } catch (err: unknown) {
      sendError(
        res,
        500,
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer la documentation dans le dossier local.",
      );
    }
  });
}
