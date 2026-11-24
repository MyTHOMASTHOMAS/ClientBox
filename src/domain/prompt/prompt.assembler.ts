/**
 * Assemblage pur system + user + exit optionnel (DOM-004 / SPEC-ENG-04 / R-07 / R-45 / CR-012).
 * Les segments vides sont omis ; les autres sont joints par `\n\n`.
 */

/**
 * Assemble le prompt transmis à l'adapter.
 *
 * @param systemPrompt Prompt système (peut être vide)
 * @param userPrompt Prompt utilisateur de mission
 * @param exitPrompt Ordre de sortie optionnel (`exit.content`)
 * @returns Prompt complet assemblé
 */
export function assemblePrompt(systemPrompt: string, userPrompt: string, exitPrompt = '') {
  const segments = [systemPrompt, userPrompt, exitPrompt].filter((segment) => segment !== '');
  return segments.join('\n\n');
}
