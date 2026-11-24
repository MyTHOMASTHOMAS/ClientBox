# CASE-ENG-03-2 — Exécution du bloc Run, émission de la sortie textuelle avec `power: 1` et rôle d'endpoint

**Spécification :** `SPEC-ENG-03`
**Critère d'acceptation :** `AC-ENG-03-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le bloc Run déclenche l'exécution d'un agent CLI via l'adapter en utilisant exclusivement ses paramètres statiques sans lire le sac d'entrées (`R-12`). En cas de succès d'exécution, il émet sur toutes ses sorties le message `{ blockType: 'run', value: outputCLI, power: 1 }` (`R-21`, `REQ-016`). Si le bloc ne possède aucune sortie connectée (0 sortie), il agit comme un point de terminaison (*endpoint*) et clôture sa branche de traitement sans émettre de message.

## Cas

```gherkin
Étant donné un bloc Run "run-producer" configuré avec l'agent "dev" et le prompt "Génère l'API"
Et ayant deux sorties câblées vers les blocs "next-1" et "next-2"
Quand l'adapter termine l'exécution CLI en renvoyant la chaîne "API générée avec 5 routes"
Alors le bloc "run-producer" émet sur chacune de ses deux sorties le message :
  | champ     | valeur                         |
  | blockType | "run"                          |
  | value     | "API générée avec 5 routes"    |
  | power     | 1                              |

Étant donné un bloc Run "run-endpoint" sans aucune connexion de sortie (0 sortie)
Quand l'adapter termine l'exécution CLI avec succès
Alors le bloc "run-endpoint" se termine normalement
Et sa branche d'exécution est marquée comme terminée
Et aucun message n'est émis

Étant donné un sac d'entrées contenant "{ input_0: { value: 'ignore-me' } }" sur le bloc Run
Quand le bloc s'exécute
Alors il n'utilise pas la chaîne "ignore-me" dans l'appel CLI
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc Run émetteur | `id: "run-producer"`, agent: `"dev"`, prompt: `"Génère l'API"` |
| Sortie brute CLI | `"API générée avec 5 routes"` |
| Bloc Run endpoint | `id: "run-endpoint"`, sorties: 0 |
| Sac d'entrées injecté | `{ input_0: { blockType: "run", value: "ignore-me", power: 1 } }` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Format émis par `run-producer` | `{ blockType: "run", value: "API générée avec 5 routes", power: 1 }` | Schéma Run conforme R-21 |
| Puissance transmise | `1` | Succès CLI $\rightarrow$ `power: 1` |
| Rôle endpoint (`run-endpoint`) | Clôture sans erreur | 0 sortie $\rightarrow$ terminaison normale de branche |
| Lecture du sac par Run | `IGNORÉ` | Règle R-12 : bloc Run ne lit pas le sac |

## Ce que ce cas ne vérifie pas

- L'échec d'exécution CLI provoquant l'arrêt global → `CASE-ENG-04-3` ;
- L'assemblage du prompt système et utilisateur → `CASE-ENG-04-1` ;
- L'exécution de la condition If → `CASE-ENG-03-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_03_2_run_block_execution_emission_and_endpoint`
**Fichier :** `tests/tests-unitaires/eng/case-eng-03-2.test.ts`

## Revue du test automatisé

- [ ] Le test simule l'exécution réussie d'un bloc Run avec sortie texte et valide le message émis.
- [ ] Le test vérifie que `power === 1` et `blockType === "run"`.
- [ ] Le test teste un bloc Run avec 0 sortie et vérifie la terminaison propre du chemin.
- [ ] Le test vérifie que le sac d'entrées fourni n'altère pas les paramètres statiques de l'appel.
- [ ] Le test échoue si un bloc Run tente de lire le sac d'entrées pour son prompt.
- [ ] Le nom du test contient `CASE_ENG_03_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
