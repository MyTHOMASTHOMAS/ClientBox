/**
 * Contrat portable du micro-routeur HTTP (TYPES-011).
 * Types structurels compatibles avec IncomingMessage / ServerResponse
 * sans importer `node:http` (isomorphisme `types/`).
 */

/**
 * Verbes de méthodes HTTP pris en charge par le routeur.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Paramètres d'URL extraits des segments dynamiques de route.
 */
export type RouteParams = Readonly<Record<string, string>>;

/**
 * Interface compatible minimale décrivant une requête HTTP entrante.
 */
export interface HttpRequestLike {
  readonly method?: string | undefined;
  readonly url?: string | undefined;
  readonly body?: unknown;
  readonly on?: ((event: string, listener: (...args: unknown[]) => void) => void) | undefined;
}

/**
 * Interface compatible minimale décrivant une réponse HTTP sortante.
 */
export interface HttpResponseLike {
  statusCode: number;
  setHeader(name: string, value: number | string | readonly string[]): unknown;
  end(data?: string | Uint8Array): unknown;
  write?(chunk: string | Uint8Array): unknown;
}

/**
 * Fonction de traitement d'une requête HTTP distribuée avec paramètres d'URL.
 */
export type HttpHandler = (
  req: HttpRequestLike,
  res: HttpResponseLike,
  params: RouteParams,
) => void | Promise<void>;

/**
 * Interface de micro-routeur HTTP permettant l'enregistrement et la distribution des routes.
 */
export interface HttpRouter {
  get(path: string, handler: HttpHandler): void;
  post(path: string, handler: HttpHandler): void;
  put(path: string, handler: HttpHandler): void;
  delete(path: string, handler: HttpHandler): void;
  /**
   * Tente de dispatcher la requête vers une route enregistrée.
   *
   * @param req - Requête entrante.
   * @param res - Réponse sortante.
   * @returns `true` si une réponse a été engagée ; `false` sinon.
   */
  handle(req: HttpRequestLike, res: HttpResponseLike): boolean | Promise<boolean>;
}
