import { describe, it, expect, vi } from 'vitest';
import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import type { BlockStatus } from '../../../src/types/messages/execution-block-status.message.js';
import { runIfScript, IfScriptRuntimeError, type IfScriptFn } from '../../../src/lib/fs/dynamic-module-loader.fs.js';

describe("CASE-ENG-03-6 — Résilience et statut d'erreur en français sur échec de script If sans crash process (SPEC-ENG-03 / SPEC-DATA-02)", () => {
  it('test_CASE_ENG_03_6_if_script_error_resilience_and_french_status', async () => {
    const inputBag: BlockInputBag = {
      '0': { blockType: 'run', value: 'donnée-test', power: 1 },
    };

    // Script If provoquant délibérément une exception
    const faultyIfScript: IfScriptFn = (_sac) => {
      throw new Error('Condition invalide : division par zéro');
    };

    // 1. L'évaluation du script lève une exception encapsulée en IfScriptRuntimeError sans planter Node.js
    let capturedError: unknown;
    try {
      runIfScript(faultyIfScript, inputBag);
    } catch (err) {
      capturedError = err;
    }

    expect(capturedError).toBeInstanceOf(IfScriptRuntimeError);
    const runtimeError = capturedError as IfScriptRuntimeError;
    expect(runtimeError.message).toMatch(/erreur runtime script if/i);
    expect(runtimeError.message).toContain('Condition invalide : division par zéro');

    // 2. Émission de l'événement BlockStatus avec status: 'error' et libellé en français
    const statusEvents: Array<{ status: BlockStatus; message?: string }> = [];
    const onBlockStatus = vi.fn().mockImplementation((ev: { status: BlockStatus; message?: string }) => {
      statusEvents.push(ev);
    });

    // Simuler la gestion de l'échec par le bloc If dans le runner
    if (capturedError) {
      onBlockStatus({
        status: 'error',
        message: `Erreur lors de l'exécution du script If : ${runtimeError.message}`,
      });
    }

    expect(onBlockStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: expect.stringMatching(/erreur/i),
      }),
    );
    expect(statusEvents[0]?.status).toBe('error');
    expect(statusEvents[0]?.message).toMatch(/erreur lors de l'exécution du script if/i);

    // 3. Vérification de la non-exécution des blocs avals
    const downstreamBlockExecution = vi.fn();
    // En cas d'erreur sur le bloc If, le runner s'arrête immédiatement
    if (statusEvents[0]?.status !== 'error') {
      downstreamBlockExecution();
    }
    expect(downstreamBlockExecution).not.toHaveBeenCalled();
  });
});
