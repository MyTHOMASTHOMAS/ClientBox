/**
 * Wrappers Preact tolérants hors cycle de rendu (tests / SSR).
 */

import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * useEffect tolérant hors cycle Preact.
 * @param cb Effet
 * @param deps Dépendances
 */
export function safeUseEffect(cb: () => void | (() => void), deps?: readonly unknown[]) {
  try {
    useEffect(cb, deps as Parameters<typeof useEffect>[1]);
  } catch {
    // Hors cycle Preact
  }
}

/**
 * useRef tolérant hors cycle Preact.
 * @param val Valeur initiale
 */
export function safeUseRef<T>(val: T) {
  try {
    return useRef(val);
  } catch {
    return { current: val };
  }
}

/**
 * useState tolérant hors cycle Preact.
 * @param initial Valeur ou fabrique
 */
export function safeUseState<T>(initial: T | (() => T)) {
  try {
    return useState(initial);
  } catch {
    const initVal = typeof initial === 'function' ? (initial as () => T)() : initial;
    const noop = () => {};
    return [initVal, noop] as [T, (val: T | ((prev: T) => T)) => void];
  }
}
