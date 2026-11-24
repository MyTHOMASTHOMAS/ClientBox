/**
 * Parseur et extracteur d'identifiant de session Codex (LIB-022 / SPEC-ADPT-05 / CR-006).
 */

function extractFromNestedProperty(parent: unknown, prop: string, key = 'thread_id') {
  if (typeof parent === 'object' && parent !== null) {
    const nested = (parent as Record<string, unknown>)[prop];
    if (typeof nested === 'object' && nested !== null) {
      const id = (nested as Record<string, unknown>)[key];
      if (typeof id === 'string' && id.trim() !== '') {
        return id.trim();
      }
    }
  }
  return null;
}

function extractFromRecord(record: Record<string, unknown>) {
  if (typeof record.thread_id === 'string' && record.thread_id.trim() !== '') {
    return record.thread_id.trim();
  }
  if (typeof record.sessionId === 'string' && record.sessionId.trim() !== '') {
    return record.sessionId.trim();
  }
  if (typeof record.session_id === 'string' && record.session_id.trim() !== '') {
    return record.session_id.trim();
  }
  return (
    extractFromNestedProperty(record, 'thread', 'id') ??
    extractFromNestedProperty(record, 'result', 'thread_id') ??
    extractFromNestedProperty(record, 'item', 'thread_id')
  );
}

function extractFromSingleJsonLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('{')) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return extractFromRecord(parsed as Record<string, unknown>);
    }
  } catch {
    // Ligne JSON tronquée ou invalide
  }
  return null;
}

/**
 * Extrait l'identifiant de session (thread_id) Codex depuis une ligne ou un bloc JSONL.
 *
 * @param text Ligne de texte candidate ou fragment multi-lignes
 * @returns Identifiant de session non vide, ou null
 */
export function extractCodexSessionId(text: string) {
  const lines = text.split(/\r?\n/u);
  for (const line of lines) {
    const id = extractFromSingleJsonLine(line);
    if (id !== null) {
      return id;
    }
  }
  return null;
}
