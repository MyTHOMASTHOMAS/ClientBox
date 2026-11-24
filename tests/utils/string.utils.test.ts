import { describe, it, expect } from 'vitest';
import { sanitizeName, isNonEmptyString, joinPromptParts } from '../../src/utils/primitives/string.utils.js';

describe('UTILS-001 — Fonctions techniques de manipulation de chaînes (signature-utils.md)', () => {
  it('test_UTILS_001_string_utils_operations', () => {
    // 1. sanitizeName
    expect(sanitizeName('mon/fichier\\interdit..txt')).toBe('monfichierinterdittxt');
    expect(sanitizeName('nom-valide_123')).toBe('nom-valide_123');

    // 2. isNonEmptyString
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString({})).toBe(false);

    // 3. joinPromptParts
    expect(joinPromptParts(['System prompt', 'User prompt'])).toBe('System prompt\n\nUser prompt');
    expect(joinPromptParts(['System prompt', ''])).toBe('System prompt');
    expect(joinPromptParts(['', 'User prompt'])).toBe('User prompt');
    expect(joinPromptParts([null, undefined, 'User prompt'])).toBe('User prompt');
    expect(joinPromptParts([])).toBe('');
  });
});
