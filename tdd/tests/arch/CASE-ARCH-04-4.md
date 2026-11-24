# CASE-ARCH-04-4 — Déterminisme complet du harnais de test selon ADR-006 (zéro réseau externe, mocks processus, isolation workspace, flushPromises)

**Spécification :** `SPEC-ARCH-04`
**Critère d'acceptation :** `AC-ARCH-04-4`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le harnais de test de ClientsBox doit être 100 % déterministe (`ADR-006` / `ADR-007`) : zéro appel réseau externe, simulation complète des processus enfants par mock, isolation hermétique de `workspacePath` et disponibilité de la purge explicite des microtâches via `flushPromises()`. L'audit architectural s'applique au code applicatif `src/` et à l'outillage partagé sous `tests/helpers/`.

## Cas

```gherkin
Étant donné l'exécution de la suite de tests unitaires et d'intégration
Quand les tests manipulent des processus, des timers ou des entrées/sorties
Alors aucun socket distant n'est ouvert sur le réseau externe
Et les processus CLI sont interceptés par des doubles de test déterministes
Et l'état asynchrone est synchronisé via `flushPromises()`
```

## Données

| Élément | Valeur |
|---|---:|
| Outils de harnais | `mock-spawn.ts`, `flush-promises.ts`, `temp-dir.ts`, `test-server.ts` |
| ADR de référence | `ADR-006`, `ADR-007` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Accès réseau externe | `0 (127.0.0.1 uniquement)` | Surveillance des sockets |
| Flakiness / instabilité | `0 %` | Exécution déterministe répétée |

## Ce que ce cas ne vérifie pas

- L'escalade SIGTERM→SIGKILL du spawner (`LIB-004`) -> `CASE-ARCH-03-4` ;
- La génération du rapport d'audit `out/rapport-arch.md` -> `CASE-ARCH-09-1` ;
- Il n'impose aucune contrainte de scan syntaxique intrusive sur les tests unitaires (l'audit d'architecture concerne `src/` et l'outillage du harnais `tests/helpers/` ; les tests unitaires tels que `tests/adpt/CASE-ADPT-02-1.test.ts`, `tests/adpt/CASE-ADPT-02-2.test.ts` ou `tests/srv/CASE-SRV-02-2.test.ts` conservent leur intégrité et n'ont pas à appeler inutilement `flushPromises()` lorsqu'aucune promesse asynchrone n'est en attente).

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_04_4_test_harness_determinism_and_isolation`
**Fichier :** `tests/tests-unitaires/arch/case-arch-04-4.test.ts`

## Revue du test automatisé

- [ ] Le test valide l'isolation complète du harnais de test (`tests/helpers/`).
- [ ] Le test vérifie la conformité aux principes déterministes d'`ADR-006`.
- [ ] Le test vérifie le respect des règles d'isolation sans horloge réelle.
- [ ] Le test échoue si un test automatisé fait appel au réseau externe réel ou au système de fichiers hors sandbox.
- [ ] Le test n'impose pas de contrainte de scan arbitraire sur les suites de tests unitaires (audit borné à `src/` et à l'outillage de test).
- [ ] Le nom du test contient `CASE_ARCH_04_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

