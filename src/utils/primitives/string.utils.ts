/**
 * Nettoie un nom de ressource en supprimant les caractères interdits pour les noms de fichiers.
 *
 * @param name - Chaîne brute à assainir.
 * @returns Chaîne nettoyée sans '/', '\' ni '..'.
 */
export function sanitizeName(name: string) {
  return name.replace(/[/\\]/gu, '').replace(/\.{2,}/gu, '');
}

/**
 * Détermine si une valeur quelconque est une chaîne de caractères non vide.
 *
 * @param value - Valeur à inspecter.
 * @returns Booléen indiquant si la valeur est une chaîne non vide après suppression des espaces.
 */
export function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Concatène une liste ordonnée de segments de prompt avec un double saut de ligne.
 *
 * @param parts - Segments de prompt textuels à assembler.
 * @returns Prompt concaténé sans sauts de ligne parasites.
 */
export function joinPromptParts(parts: readonly (string | null | undefined)[]) {
  return parts
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join('\n\n');
}
