/**
 * CASE-ARCH-03-3 — Persistance atomique anti-corruption JSON
 * via .tmp adjacent + renameSync (LIB-001 / AC-ARCH-03-3).
 *
 * Module cible (signature-lib.md + disque) :
 * `src/lib/fs/atomic-writer.ts` — la fiche CASE cite par erreur
 * `src/lib/storage/atomic-writer.ts` ; Ground Truth = signature / disque.
 *
 * Nom de test : contrat fiche CASE (section « Test automatisé ») —
 * le prompt dédié cite une variante erronée ; la fiche CASE fait foi (POINT-013).
 *
 * Assertions : 2 `expect` (Alors + Et). La clause Gherkin « Puis »
 * (renommage atomique) est agrégée dans le prédicat Alors avec l'écriture
 * `.tmp` préalable et la validité du fichier final (table CASE + doctrine
 * « une assertion par ligne Alors/Et » du prompt).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { atomicWriteJson } from '../../../src/lib/fs/json-atomic-writer.fs.js';
import { createTempDir, type TempDirHandle } from '../../helpers/temp-dir.js';

/** Oracle table CASE — écriture sécurisée. */
const EXPECTED_SECURE_WRITE = 'Fichier final valide';

type FsEvent =
  | { readonly kind: 'write'; readonly target: string }
  | { readonly kind: 'rename'; readonly from: string; readonly to: string };

interface AtomicWriteProbe {
  readonly secureWriteStatus: string;
  readonly orphanTmpCount: number;
}

function listOrphanTmpFiles(dir: string): readonly string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((name) => name.endsWith('.tmp'));
}

function probeAtomicWrite(finalPath: string, payload: unknown): AtomicWriteProbe {
  const events: FsEvent[] = [];
  const expectedTmp = `${finalPath}.tmp`;

  const originalWrite = fs.writeFileSync.bind(fs);
  const originalRename = fs.renameSync.bind(fs);

  const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(((
    file: fs.PathOrFileDescriptor,
    data: string | NodeJS.ArrayBufferView,
    options?: fs.WriteFileOptions,
  ) => {
    events.push({ kind: 'write', target: String(file) });
    return originalWrite(file, data, options);
  }) as typeof fs.writeFileSync);

  const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(((
    oldPath: fs.PathLike,
    newPath: fs.PathLike,
  ) => {
    events.push({
      kind: 'rename',
      from: String(oldPath),
      to: String(newPath),
    });
    return originalRename(oldPath, newPath);
  }) as typeof fs.renameSync);

  try {
    atomicWriteJson(finalPath, payload);

    const tmpWriteIndex = events.findIndex(
      (event) => event.kind === 'write' && event.target === expectedTmp,
    );
    const renameIndex = events.findIndex(
      (event) => event.kind === 'rename' && event.from === expectedTmp && event.to === finalPath,
    );

    // Alors (.tmp d'abord) + Puis (rename atomique) + fichier final valide
    const tmpThenRename = tmpWriteIndex >= 0 && renameIndex >= 0 && tmpWriteIndex < renameIndex;

    let finalValid = false;
    if (fs.existsSync(finalPath)) {
      const onDisk: unknown = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
      finalValid = JSON.stringify(onDisk) === JSON.stringify(payload);
    }

    const secureWriteStatus =
      tmpThenRename && finalValid ? EXPECTED_SECURE_WRITE : 'ECRITURE_NON_SECURISEE';

    const orphanTmpCount = listOrphanTmpFiles(path.dirname(finalPath)).length;

    return { secureWriteStatus, orphanTmpCount };
  } finally {
    writeSpy.mockRestore();
    renameSpy.mockRestore();
  }
}

describe('CASE-ARCH-03-3 — écriture atomique JSON LIB-001 (SPEC-ARCH-03)', () => {
  let tempHandle: TempDirHandle | undefined;

  afterEach(() => {
    tempHandle?.cleanup();
    tempHandle = undefined;
  });

  it('test_CASE_ARCH_03_3_atomic_json_writer_integrity', () => {
    tempHandle = createTempDir('clientsbox-arch-03-3-');
    const targetDir = path.join(tempHandle.dir, '.agents', 'data', 'agents');
    const finalPath = path.join(targetDir, 'resource.json');
    const payload = { id: 'arch-03-3', name: 'atomic-probe' };

    const probe = probeAtomicWrite(finalPath, payload);

    // Alors un fichier temporaire ".tmp" est d'abord écrit
    // Puis un renommage atomique remplace le fichier cible
    // (agrégé — oracle table « Écriture sécurisée »)
    expect(probe.secureWriteStatus).toBe(EXPECTED_SECURE_WRITE);

    // Et aucun fichier ".tmp" résiduel ne subsiste après l'opération
    expect(probe.orphanTmpCount).toBe(0);
  });
});
