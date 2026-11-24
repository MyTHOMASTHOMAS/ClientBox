/**
 * Utilitaire de formatage et de typage des violations d'architecture
 * pour enrichir les assertions Vitest et les rapports de conformité.
 */

export interface ArchitectureViolation {
  readonly file: string;
  readonly line?: number;
  readonly symbol?: string;
  readonly message: string;
}

/**
 * Formate une liste de violations d'architecture en message d'erreur clair et détaillé.
 */
export function formatViolationsMessage(
  title: string,
  violations: readonly ArchitectureViolation[],
  maxDisplay: number = 30,
): string {
  if (violations.length === 0) {
    return '';
  }

  const header = `\n🚨 ${title} (${violations.length} violation(s) identifiée(s)) :`;
  const formattedItems = violations.slice(0, maxDisplay).map((v) => {
    const locus = v.line !== undefined ? `${v.file}:${v.line}` : v.file;
    const symbolInfo = v.symbol ? ` [${v.symbol}]` : '';
    return `  • ${locus}${symbolInfo} — ${v.message}`;
  });

  if (violations.length > maxDisplay) {
    formattedItems.push(
      `  ... et ${violations.length - maxDisplay} autre(s) occurrence(s) non affichée(s).`,
    );
  }

  return [header, ...formattedItems].join('\n');
}
