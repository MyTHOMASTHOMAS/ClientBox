import type { IncomingMessage } from 'node:http';

const DEFAULT_MAX_BODY_BYTES = 1048576; // 1 Mo

/**
 * @functionExemption Dépassement du seuil de 35 lignes justifié par l'encapsulation atomique des écouteurs du flux HTTP (data, end, error) avec plafonnement mémoire et destruction du socket.
 */
function readRawBody(req: IncomingMessage, maxBytes: number) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    let isAborted = false;

    req.on('data', (chunk: Buffer | string) => {
      if (isAborted) {
        return;
      }
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      receivedBytes += buffer.length;
      if (receivedBytes > maxBytes) {
        isAborted = true;
        req.destroy();
        reject(
          new Error(
            `Dépassement de la volumétrie maximale autorisée pour le corps de requête (${maxBytes} octets).`,
          ),
        );
        return;
      }
      chunks.push(buffer);
    });

    req.on('end', () => {
      if (isAborted) {
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      if (chunks.length === 0 || receivedBytes === 0 || raw.trim().length === 0) {
        reject(new Error('Corps de requête vide : données JSON manquantes.'));
        return;
      }
      resolve(raw);
    });

    req.on('error', (err: unknown) => {
      if (!isAborted) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  });
}

function parseJsonString<T>(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed as T;
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Échec du parsing JSON du corps de requête : syntaxe invalide (${detail}).`);
  }
}

/**
 * Extrait et désérialise le corps JSON d'une requête HTTP avec garde-fou mémoire.
 *
 * @param req - Flux de requête HTTP entrante.
 * @param maxBytes - Taille maximale autorisée en octets (défaut : 1 Mo).
 * @returns Promesse résolue avec l'objet typé désérialisé.
 */
export async function parseJsonBody<T>(
  req: IncomingMessage,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
) {
  const raw = await readRawBody(req, maxBytes);
  return parseJsonString<T>(raw);
}
