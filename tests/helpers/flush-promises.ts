/**
 * Purge la file de microtâches / promesses en attente (ADR-006 §2).
 * À appeler avant toute assertion sur l'état async du moteur ou post-`listen`.
 */
export async function flushPromises(): Promise<void> {
  await new Promise<void>((resolve) => {
    process.nextTick(resolve);
  });
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

/** Variante légère (une seule tick) lorsque suffisant. */
export async function flushNextTick(): Promise<void> {
  await new Promise<void>((resolve) => {
    process.nextTick(resolve);
  });
}
