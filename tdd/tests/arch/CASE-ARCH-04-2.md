# CASE-ARCH-04-2 — Rôle de Composition Root unique de src/index.ts et orchestration de l'arrêt gracieux sur signaux OS (SIGINT/SIGTERM)

**Spécification :** `SPEC-ARCH-04`
**Critère d'acceptation :** `AC-ARCH-04-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le fichier `src/index.ts` (`ROOT-001`) est l'unique Composition Root de ClientsBox : il instancie les singletons, câble le holder des runners, injecte `workspacePath` et orchestre l'arrêt propre lors de la réception de signaux `SIGINT` ou `SIGTERM`.

## Cas

```gherkin
Étant donné l'application ClientsBox en cours d'exécution
Quand le point d'entrée "src/index.ts" est instancié
Alors il résout "workspacePath", instancie les services et enregistre les contrôleurs
Et lors de la réception de "SIGINT" ou "SIGTERM", il ferme le serveur HTTP et arrête les runners actifs
```

## Données

| Élément | Valeur |
|---|---:|
| Point d'entrée | `src/index.ts` (`ROOT-001`) |
| Signaux interceptés | `SIGINT`, `SIGTERM` |
| Actions d'arrêt | Fermeture socket HTTP + appel `stop()` sur runners actifs |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Composition centralisée | `Unique à index.ts` | Scan des points d'instanciation globale |
| Libération du port | `Effective` | Fermeture propre du serveur |
| Arrêt des processus enfants | `Effective` | Transmission du signal de terminaison |

## Ce que ce cas ne vérifie pas

- Le spawner unitaire -> `CASE-ARCH-03-4` ;
- La cascade de signaux serveur -> `CASE-SRV-02-5`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_04_2_index_composition_root_and_os_signals`
**Fichier :** `tests/tests-unitaires/arch/case-arch-04-2.test.ts`

## Revue du test automatisé

- [ ] Le test valide que `src/index.ts` est l'unique composition root.
- [ ] Le test vérifie l'interception et l'orchestration des signaux `SIGINT`/`SIGTERM`.
- [ ] Le test vérifie que l'assemblage et l'instanciation des dépendances s'effectuent dans src/index.ts.
- [ ] Le test échoue si une instanciation globale de service ou d'infrastructure a lieu en dehors du Composition Root.
- [ ] Le nom du test contient `CASE_ARCH_04_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
