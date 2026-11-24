/**
 * Arrêt gracieux du serveur HTTP local sur signaux OS (SPEC-SRV-02 / AC-SRV-02-3, AC-SRV-02-5).
 * Seam testable hors ROOT-001 — consensus Partie 63 (POINT-005).
 * AC-SRV-02-5 : si `stopActiveRunners` est fourni, il est invoqué avant la fermeture HTTP
 * (cascade SIGTERM→SIGKILL / grâce = responsabilité du callback injecté, pas de LIB-004 ici).
 */

import { logShutdownSignalReceived } from '../../utils/logger/events/info/agent-info.event.js';

/** Signaux d'arrêt du système d'exploitation pris en charge. */
export type OsShutdownSignal = 'SIGINT' | 'SIGTERM';

/** Options pour l'enregistrement de l'arrêt gracieux. */
export interface GracefulShutdownOptions {
  readonly closeHttpServer: () => void | Promise<void>;
  readonly exit: (code: number) => void;
  /** Optionnel — cascade runners / CLI actifs (CASE-SRV-02-5 / AC-SRV-02-5). */
  readonly stopActiveRunners?: () => void | Promise<void>;
  /**
   * Si `false`, n'attache pas `process.on` (le Composition Root le fait — CASE-ARCH-04-2).
   * Défaut : `true` (harnais de test via `emit`).
   */
  readonly shouldBindProcessSignals?: boolean;
}

/** Poignée d'enregistrement pour tester ou libérer les écouteurs de signaux. */
export interface GracefulShutdownRegistration {
  /**
   * Déclenche la séquence d'arrêt (API de test / simulation de signal).
   *
   * @param signal - Signal reçu.
   */
  emit(signal: OsShutdownSignal): Promise<void>;
  /**
   * Désenregistre les handlers `process.on` (isolation ADR-006).
   */
  dispose(): void;
}

/**
 * @functionExemption Corps un peu long justifié par runShutdown, handlers SIGINT/SIGTERM et dispose.
 * Enregistre le traitement de `SIGINT` et `SIGTERM` :
 * `stopActiveRunners?` → fermeture HTTP → `exit(0)` (libération du port TCP).
 *
 * @param options - Options d'arrêt gracieux.
 */
function registerGracefulShutdown(options: GracefulShutdownOptions) {
  let isDisposed = false;
  let isShuttingDown = false;

  const runShutdown = async (signal: OsShutdownSignal) => {
    if (isDisposed || isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    logShutdownSignalReceived(signal);
    if (options.stopActiveRunners !== undefined) {
      await options.stopActiveRunners();
    }
    await options.closeHttpServer();
    options.exit(0);
  };

  const onSigint = () => {
    void runShutdown('SIGINT');
  };
  const onSigterm = () => {
    void runShutdown('SIGTERM');
  };

  const shouldBind = options.shouldBindProcessSignals !== false;
  if (shouldBind) {
    process.on('SIGINT', onSigint);
    process.on('SIGTERM', onSigterm);
  }

  const registration: GracefulShutdownRegistration = {
    emit: (signal) => runShutdown(signal),
    dispose: () => {
      if (!isDisposed) {
        isDisposed = true;
        if (shouldBind) {
          process.off('SIGINT', onSigint);
          process.off('SIGTERM', onSigterm);
        }
      }
    },
  };
  return registration;
}

export { registerGracefulShutdown };
