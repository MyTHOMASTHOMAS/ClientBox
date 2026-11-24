/**
 * Parseur et extracteur d'identifiant de session Antigravity (SPEC-ADPT-04 / CR-004).
 */

function extractFromNestedProperty(parent: unknown, prop: 'result' | 'step_update') {
  if (typeof parent === 'object' && parent !== null) {
    const nested = (parent as Record<string, unknown>)[prop];
    if (typeof nested === 'object' && nested !== null) {
      const id = (nested as Record<string, unknown>).conversation_id;
      if (typeof id === 'string' && id.trim() !== '') {
        return id.trim();
      }
    }
  }
  return null;
}

function extractFromRecord(record: Record<string, unknown>) {
  if (typeof record.conversation_id === 'string' && record.conversation_id.trim() !== '') {
    return record.conversation_id.trim();
  }
  return (
    extractFromNestedProperty(record, 'result') ?? extractFromNestedProperty(record, 'step_update')
  );
}

/**
 * Extrait l'identifiant de conversation Antigravity depuis une ligne brute (NDJSON stream ou json).
 *
 * @param line Ligne de texte candidate
 * @returns Identifiant de conversation non vide, ou null
 */
export function extractAntigravitySessionId(line: string) {
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

function extractStepDelta(record: Record<string, unknown>) {
  if (
    record.event !== 'step_update' ||
    typeof record.step_update !== 'object' ||
    !record.step_update
  ) {
    return null;
  }
  const step = record.step_update as Record<string, unknown>;
  return typeof step.text_delta === 'string' ? step.text_delta : null;
}

function extractResultResponse(record: Record<string, unknown>) {
  if (record.event !== 'result' || typeof record.result !== 'object' || !record.result) {
    return null;
  }
  const res = record.result as Record<string, unknown>;
  return typeof res.response === 'string' ? res.response : null;
}

/**
 * Extrait le tronçon de texte utile d'un événement stream-json Antigravity.
 *
 * @param parsed - Objet JSON désérialisé
 */
export function extractStreamChunk(parsed: unknown) {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const stepDelta = extractStepDelta(record);
  if (stepDelta !== null) return stepDelta;

  const resultResp = extractResultResponse(record);
  if (resultResp !== null) return resultResp;

  if (typeof record.response === 'string') return record.response;
  if (record.type === 'text' && typeof record.content === 'string') return record.content;

  return null;
}

interface AntigravityCollector {
  finalResult: string | null;
  deltas: string[];
}

function collectFromRecord(record: Record<string, unknown>, collector: AntigravityCollector) {
  const res = extractResultResponse(record);
  if (res !== null) {
    collector.finalResult = res;
    return;
  }
  const delta = extractStepDelta(record);
  if (delta !== null) {
    collector.deltas.push(delta);
    return;
  }
  if (typeof record.response === 'string') {
    collector.finalResult = record.response;
    return;
  }
  if (record.type === 'text' && typeof record.content === 'string') {
    collector.deltas.push(record.content);
  }
}

function processOutputLine(line: string, collector: AntigravityCollector) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      collectFromRecord(parsed as Record<string, unknown>, collector);
    }
  } catch {
    // Ignorer JSON malformé
  }
}

/**
 * Normalise la sortie brute accumulée du CLI Antigravity pour le SAC et les blocs avals.
 *
 * @param rawOutput - Sortie brute accumulée du processus
 */
export function parseAntigravityOutput(rawOutput: string) {
  const collector: AntigravityCollector = { finalResult: null, deltas: [] };
  const lines = rawOutput.split(/\r?\n/u);
  for (const line of lines) {
    processOutputLine(line, collector);
  }
  if (collector.finalResult !== null) return collector.finalResult;
  return collector.deltas.length > 0 ? collector.deltas.join('') : rawOutput;
}
