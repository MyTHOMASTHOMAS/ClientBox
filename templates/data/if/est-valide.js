/**
 * Script de condition If d'exemple (SPEC-DATA-02 / ADR-005).
 * Reçoit le sac d'entrées (clé de connexion → message `{ blockType, value, power }`) et renvoie un booléen.
 *
 * @param {Record<string, { value: unknown }>} sac - Sac d'entrées fusionné
 * @returns {boolean}
 */
export default function estValide(sac) {
  if (!sac || typeof sac !== 'object') {
    return false;
  }
  return Object.values(sac).some(
    (message) => typeof message?.value === 'string' && message.value.includes('OK'),
  );
}
