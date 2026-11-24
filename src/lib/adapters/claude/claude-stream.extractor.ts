/**
 * Parseur et extracteur de flux et d'identifiant de session Claude CLI (LIB-035 / SPEC-ADPT-06 / CR-005).
 */

function extractFromRecord(record: Record<string, unknown>) {
  if (typeof record.session_id === 'string' && record.session_id.trim() !== '') {
    return record.session_id.trim();
  }
  if (typeof record.sessionId === 'string' && record.sessionId.trim() !== '') {
    return record.sessionId.trim();
  }
  return null;
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
 * Extrait l'identifiant de session Claude (session_id) depuis une ligne ou un bloc JSONL.
 *
 * @param text Ligne de texte candidate ou fragment multi-lignes
 * @returns Identifiant de session non vide, ou null
 */
export function extractClaudeSessionId(text: string) {
  const lines = text.split(/\r?\n/u);
  for (const line of lines) {
    const id = extractFromSingleJsonLine(line);
    if (id !== null) {
      return id;
    }
  }
  return null;
}

function extractDeltaText(event: Record<string, unknown>) {
  if (event.type === 'content_block_delta' && typeof event.delta === 'object' && event.delta) {
    const delta = event.delta as Record<string, unknown>;
    if (typeof delta.text === 'string') {
      return delta.text;
    }
  }
  return null;
}

function extractAssistantText(message: Record<string, unknown>) {
  if (Array.isArray(message.content)) {
    const parts: string[] = [];
    for (const item of message.content) {
      if (typeof item === 'object' && item && (item as { type?: unknown }).type === 'text') {
        const text = (item as { text?: unknown }).text;
        if (typeof text === 'string') {
          parts.push(text);
        }
      }
    }
    if (parts.length > 0) {
      return parts.join('');
    }
  }
  return null;
}

function extractClaudeChunkFromRecord(record: Record<string, unknown>) {
  if (record.type === 'stream_event' && typeof record.event === 'object' && record.event) {
    const deltaText = extractDeltaText(record.event as Record<string, unknown>);
    if (deltaText !== null) return deltaText;
  }
  if (record.type === 'assistant' && typeof record.message === 'object' && record.message) {
    const assistantText = extractAssistantText(record.message as Record<string, unknown>);
    if (assistantText !== null) return assistantText;
  }
  return null;
}

/**
 * Parse une ligne JSONL individuelle Claude et en extrait le fragment textuel si présent.
 *
 * @param line Ligne brute candidate
 * @returns Fragment de texte ou null
 */
export function extractClaudeJsonLineChunk(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return extractClaudeChunkFromRecord(parsed as Record<string, unknown>);
    }
  } catch {
    // Ligne JSON tronquée ou invalide
  }
  return null;
}

/**
 * Normalise la sortie brute complète d'un processus Claude en extrayant le texte pur de l'agent.
 *
 * @param rawOutput Sortie brute totale du processus
 * @returns Texte épuré des métadonnées JSON
 */
export function parseClaudeOutput(rawOutput: string) {
  const lines = rawOutput.split(/\r?\n/u);
  const chunks: string[] = [];
  for (const line of lines) {
    const chunk = extractClaudeJsonLineChunk(line);
    if (chunk !== null) {
      chunks.push(chunk);
    }
  }
  return chunks.length > 0 ? chunks.join('') : rawOutput;
}
