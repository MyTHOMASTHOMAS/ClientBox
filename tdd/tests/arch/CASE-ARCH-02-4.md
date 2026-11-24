# CASE-ARCH-02-4 — Validation topologique pure par DOM-008 (unicité Start et degré entrant 0 per R-20) sans accès disque

**Spécification :** `SPEC-ARCH-02`
**Critère d'acceptation :** `AC-ARCH-02-4`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

La validation structurelle du graphe de scénario (`DOM-008 validateGraph`) doit imposer l'unicité du bloc Start (`REQ-015`) et l'interdiction stricte de connexion entrante sur Start (`R-20`, degré entrant = 0), de manière 100 % synchrone en mémoire sans aucun accès au système de fichiers.

## Cas

```gherkin
Étant donné un graphe de scénario en mémoire
Quand "validateGraph" est appelée sur un graphe avec deux blocs Start ou un câble entrant sur Start
Alors la fonction retourne des erreurs explicites en français sans accéder au disque
Et quand le graphe est valide (Start unique avec degré entrant 0), aucune erreur n'est retournée
```

## Données

| Élément | Valeur |
|---|---:|
| Module cible | `src/domain/graph/graph-integrity.validator.ts` (`DOM-008`) |
| Règles vérifiées | `REQ-015` (Start unique), `R-20` (degré entrant Start = 0) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Rejet Start multiple | `Erreur en français retournée` | Détection topologique en mémoire |
| Rejet Start degré entrant > 0 | `Erreur en français retournée` | Détection topologique en mémoire |
| Accès disque durant la validation | `0` | Zéro appel `fs` |

## Ce que ce cas ne vérifie pas

- La persistance du graphe sur disque -> `CASE-DATA-03-1` ;
- La vérification d'existence des fichiers d'agents -> `CASE-DATA-03-5`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_02_4_graph_validator_start_rules_without_io`
**Fichier :** `tests/tests-unitaires/arch/case-arch-02-4.test.ts`

## Revue du test automatisé

- [ ] Le test soumet des graphes non conformes à `validateGraph` (Start multiple, câble sur Start).
- [ ] Le test vérifie les messages d'erreur en français.
- [ ] Le test vérifie l'absence de toute interaction avec le disque.
- [ ] Le test échoue si une topologie sans Start ou avec cycle est acceptée comme valide.
- [ ] Le nom du test contient `CASE_ARCH_02_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
