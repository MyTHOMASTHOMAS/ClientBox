/**
 * Primitives tableaux indexés (UTILS-002) — zéro concept métier.
 */

/**
 * Produit les clés numériques séquentielles `"0"` … `"n-1"` pour un tableau de longueur `arr.length`.
 *
 * @param arr Tableau d'entrée
 * @returns Nouveau tableau des clés sous forme de chaînes numériques
 */
export function reindex(arr: readonly unknown[]) {
  return Array.from({ length: arr.length }, (_, i) => String(i));
}
