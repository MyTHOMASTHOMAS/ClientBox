# CASE-ARCH-03-4 — Spawner de sous-processus et escalade temporelle déterministe SIGTERM (3000 ms) vers SIGKILL (LIB-004)

**Spécification :** `SPEC-ARCH-03`
**Critère d'acceptation :** `AC-ARCH-03-4`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le lancement et l'interruption des processus enfants CLI doivent être encapsulés dans `LIB-004` (`child-process.child-process.spawner.ts`). Lors d'un arrêt, un signal `SIGTERM` est émis, suivi d'une escalade vers `SIGKILL` après `STOP_GRACE_MS = 3000 ms` si le processus ne s'est pas arrêté.

## Cas

```gherkin
Étant donné un processus enfant démarré via "spawnAgent"
Quand la méthode "stop()" est invoquée
Alors le signal SIGTERM est immédiatement transmis au processus
Et si le processus ne s'est pas terminé après 3000 ms, un signal SIGKILL est envoyé
```

## Données

| Élément | Valeur |
|---|---:|
| Module cible | `src/lib/process/child-process.child-process.spawner.ts` (`LIB-004`) |
| Constante nommée | `STOP_GRACE_MS = 3000` (ms) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Signal initial | `SIGTERM` | Transmission immédiate |
| Signal après 3000 ms | `SIGKILL` | Escalade après écoulement de STOP_GRACE_MS |

## Ce que ce cas ne vérifie pas

- L'arrêt gracieux serveur HTTP -> `CASE-SRV-02-3` ;
- L'arrêt manuel sans clearContext -> `CASE-ADPT-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_03_4_spawner_sigterm_sigkill_escalation`
**Fichier :** `tests/tests-unitaires/arch/case-arch-03-4.test.ts`

## Revue du test automatisé

- [ ] Le test utilise `installSpawnMock` et des fake timers (`vi.useFakeTimers`).
- [ ] Le test valide l'émission de `SIGTERM` puis de `SIGKILL` après 3000 ms.
- [ ] Le test vérifie que la constante STOP_GRACE_MS vaut exactement 3000 ms.
- [ ] Le test échoue si l'escalade SIGKILL est déclenchée avant 3000 ms ou n'est pas émise.
- [ ] Le nom du test contient `CASE_ARCH_03_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
