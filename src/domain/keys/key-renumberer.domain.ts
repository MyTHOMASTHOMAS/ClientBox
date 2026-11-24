/**
 * Renumérotation automatique des clés numériques après suppression (DOM-006 / R-43 / SPEC-DATA-03).
 * Fonction pure, immutable, zéro I/O.
 */

import type { Connection } from '../../types/models/connection.model.js';
import { reindex } from '../../utils/primitives/array.utils.js';

/** Clé numérique par défaut (`"0"`, `"1"`, …) — hors clés textuelles personnalisées. */
function isDefaultNumericKey(key: string) {
  return /^(0|[1-9]\d*)$/u.test(key);
}

function connectionIdentity(c: Connection) {
  const src = c.sourceNodeId || c.from || '';
  const srcPort = c.sourcePortIndex || 0;
  const tgt = c.targetNodeId || c.to || '';
  const tgtPort = c.targetPortIndex || 0;
  return `${src}:${String(srcPort)}->${tgt}:${String(tgtPort)}#${c.key}`;
}

/**
 * Après suppression d'une clé numérique, compacte les clés numériques restantes
 * par bloc cible en séquence `"0"`, `"1"`, … Les clés non numériques sont préservées.
 *
 * @param connections Connexions existantes
 * @param removedKey Clé qui a été supprimée
 * @returns Nouveau tableau de connexions (immutable)
 */
export function renumberDefaultKeys(connections: readonly Connection[], removedKey: string) {
  if (!isDefaultNumericKey(removedKey)) {
    return connections.map((c) => ({ ...c }));
  }

  const targets = new Set(connections.map((c) => c.targetNodeId));
  const newKeyById = new Map<string, string>();

  for (const target of targets) {
    const numeric = connections
      .filter((c) => c.targetNodeId === target && isDefaultNumericKey(c.key))
      .slice()
      .sort((a, b) => Number(a.key) - Number(b.key));

    const sequential = reindex(numeric);
    for (let i = 0; i < numeric.length; i += 1) {
      const current = numeric[i];
      const nextKey = sequential[i];
      if (current === undefined || nextKey === undefined) {
        continue;
      }
      newKeyById.set(connectionIdentity(current), nextKey);
    }
  }

  return connections.map((c) => {
    if (!isDefaultNumericKey(c.key)) {
      return { ...c };
    }
    const nextKey = newKeyById.get(connectionIdentity(c));
    if (nextKey === undefined) {
      return { ...c };
    }
    return { ...c, key: nextKey };
  });
}
