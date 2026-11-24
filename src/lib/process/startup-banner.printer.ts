/**
 * Affichage console de l'URL d'accès au démarrage (SPEC-SRV-02 / REQ-004 / AC-SRV-02-2).
 * Seam testable hors ROOT-001 — consensus Partie 63 (POINT-005).
 * Aucune ouverture automatique de navigateur (pas de spawn `xdg-open` / `open` / etc.).
 */

/** Fonction d'écriture de message texte sur le flux de sortie console. */
export type StartupConsoleWriter = (chunk: string) => void;

/**
 * Construit l'URL d'accès locale pour le port d'écoute donné.
 *
 * @param port Port TCP d'écoute effectif
 * @returns URL HTTP locale formatée
 */
export function formatServerAccessUrl(port: number) {
  return `http://localhost:${port}`;
}

/**
 * Écrit le message de prêt serveur contenant l'URL d'accès.
 *
 * @param port Port TCP d'écoute effectif
 * @param write Destination injectable (défaut : `process.stdout.write`)
 */
export function writeServerReadyMessage(port: number, write?: StartupConsoleWriter) {
  const writer = resolveWriter(write);
  const url = formatServerAccessUrl(port);
  writer(`ClientsBox est prêt — ${url}\n`);
}

/**
 * Résout le writer de sortie console, avec repli sur process.stdout.write.
 *
 * @param write - Fonction d'écriture optionnelle.
 */
function resolveWriter(write: StartupConsoleWriter | undefined) {
  if (write !== undefined) {
    return write;
  }
  return (chunk: string) => {
    process.stdout.write(chunk);
  };
}
