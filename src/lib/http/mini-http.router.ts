import type {
  HttpHandler,
  HttpMethod,
  HttpRequestLike,
  HttpResponseLike,
  HttpRouter,
  RouteParams,
} from '../../types/contracts/http-router.contract.js';
import { logRequestDispatched } from '../../utils/logger/events/info/server-info.event.js';
import {
  logRouteNotFoundError,
  logHttpInternalError,
} from '../../utils/logger/events/errors/server-error.event.js';
import { logRouteMatched } from '../../utils/logger/events/debug/server-debug.event.js';

interface RegisteredRoute {
  readonly method: HttpMethod;
  readonly pathPattern: string;
  readonly handler: HttpHandler;
}

/**
 * Micro-routeur HTTP maison (LIB-007).
 * Enregistre les routes ; `handle` retourne `true` si une réponse a été engagée,
 * `false` pour laisser `serveStatic` (LIB-008) prendre le relais.
 */
export class MiniRouter implements HttpRouter {
  private readonly routes: RegisteredRoute[] = [];

  /**
   * Enregistre une route HTTP GET.
   *
   * @param path Modèle de chemin (ex: '/api/agents/:id')
   * @param handler Gestionnaire de requête
   */
  get(path: string, handler: HttpHandler) {
    this.register('GET', path, handler);
  }

  /**
   * Enregistre une route HTTP POST.
   *
   * @param path Modèle de chemin
   * @param handler Gestionnaire de requête
   */
  post(path: string, handler: HttpHandler) {
    this.register('POST', path, handler);
  }

  /**
   * Enregistre une route HTTP PUT.
   *
   * @param path Modèle de chemin
   * @param handler Gestionnaire de requête
   */
  put(path: string, handler: HttpHandler) {
    this.register('PUT', path, handler);
  }

  /**
   * Enregistre une route HTTP DELETE.
   *
   * @param path Modèle de chemin
   * @param handler Gestionnaire de requête
   */
  delete(path: string, handler: HttpHandler) {
    this.register('DELETE', path, handler);
  }

  /**
   * Distribue la requête HTTP vers la première route correspondante.
   *
   * @param req Requête HTTP entrante
   * @param res Réponse HTTP
   * @returns Booléen indiquant si une route a pris en charge la requête
   */
  handle(req: HttpRequestLike, res: HttpResponseLike) {
    const method = normalizeMethod(req.method);
    const pathname = extractPathname(req.url);
    logRequestDispatched(method, pathname);

    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }
      const params = matchPath(route.pathPattern, pathname);
      if (params === null) {
        continue;
      }
      logRouteMatched(method, route.pathPattern);
      try {
        void route.handler(req, res, params);
      } catch (err: unknown) {
        logHttpInternalError(pathname, err);
        if (typeof res.statusCode === 'number') {
          res.statusCode = 500;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ message: 'Erreur interne du serveur.' }));
      }
      return true;
    }

    return false;
  }

  private register(method: HttpMethod, path: string, handler: HttpHandler) {
    this.routes.push({ method, pathPattern: path, handler });
  }
}

/**
 * Envoie une réponse d'erreur 404 standard en français.
 *
 * @param res Réponse HTTP
 * @param message Message d'erreur
 */
export function sendNotFound(res: HttpResponseLike, message = 'Ressource introuvable.') {
  logRouteNotFoundError('HTTP', message);
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ message: message ?? 'Ressource introuvable.' }));
}

/**
 * Normalise le verbe HTTP en majuscules ou GET par défaut.
 *
 * @param method - Méthode HTTP fournie.
 */
function normalizeMethod(method: string | undefined) {
  const upper = (method ?? 'GET').toUpperCase();
  if (upper === 'POST' || upper === 'PUT' || upper === 'DELETE') {
    return upper as HttpMethod;
  }
  return 'GET' as HttpMethod;
}

/**
 * Extrait le chemin sans paramètres d'URL.
 *
 * @param url - URL de la requête.
 */
function extractPathname(url: string | undefined) {
  const raw = url ?? '/';
  return raw.split('?')[0] ?? '/';
}

/**
 * Correspondance exacte ou segments `:param` (LIB-007).
 *
 * @param pattern - Modèle de route avec éventuels segments paramétrés.
 * @param pathname - Chemin de la requête à analyser.
 */
function matchPath(pattern: string, pathname: string) {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = pathParts[index];
    if (expected === undefined || actual === undefined) {
      return null;
    }
    if (expected.startsWith(':') && expected.length > 1) {
      params[expected.slice(1)] = actual;
      continue;
    }
    if (expected !== actual) {
      return null;
    }
  }
  return params as RouteParams;
}
