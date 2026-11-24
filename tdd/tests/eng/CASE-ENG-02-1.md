# CASE-ENG-02-1 — Déclenchement de l'exécution d'un bloc lors du join complet ($N$ reçus et $\sum power === N$)

**Spécification :** `SPEC-ENG-02`
**Critère d'acceptation :** `AC-ENG-02-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Pour tout bloc ayant $N \ge 1$ entrées câblées, le moteur doit attendre la réception des $N$ messages d'entrées et calculer la somme des puissances $\sum power$. Le bloc est déclenché si et seulement si $\sum power === N$ (`C-15`, `R-42`). Si un bloc se déclenche prématurément avec un nombre de messages inférieur à $N$ ou une puissance partielle, le traitement s'exécutera sur des entrées incomplètes.

## Cas

```gherkin
Étant donné un bloc Run "run-join" ayant N=3 entrées câblées
Quand le port 0 reçoit un message avec power 1
Et le port 1 reçoit un message avec power 1
Alors le bloc n'est pas encore exécuté (attente du 3e message)
Quand le port 2 reçoit un message avec power 1
Alors la condition de réception N=3 est satisfaite
Et la somme sum(power) est égale à 3
Et le bloc "run-join" démarre immédiatement son exécution

Étant donné un bloc Run "run-single" ayant N=1 entrée câblée
Quand son unique port d'entrée reçoit un message avec power 1
Alors sum(power) === 1
Et le bloc "run-single" démarre immédiatement son exécution

Étant donné un bloc Run "run-join" ayant N=2 entrées câblées
Quand le port 0 reçoit un message avec une puissance non unitaire (ex. power 2)
Alors le bloc reste à l'état EN_ATTENTE_JOIN et ne se déclenche pas prématurément (cardinalité 1 < N=2)

Étant donné un bloc Run "run-join" ayant N=2 entrées câblées
Quand le port 0 reçoit un premier message avec value "data-v1" et power 0
Et le même port 0 reçoit un second message écrasant avec value "data-v2" et power 1 avant que le port 1 n'arrive
Alors le sac enregistre la dernière valeur "data-v2" (sémantique last-write-wins)
Et la puissance effective retenue pour le port 0 est 1
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc multi-entrées | `id: "run-join"`, $N=3$ (ou $N=2$) |
| Message entrée 0 | `{ blockType: "run", value: "data-A", power: 1 }` |
| Message entrée 1 | `{ blockType: "run", value: "data-B", power: 1 }` |
| Message entrée 2 | `{ blockType: "run", value: "data-C", power: 1 }` |
| Message hors norme | `{ blockType: "run", value: "data-err", power: 2 }` |
| Réécriture port 0 | `v1 (power 0)` puis `v2 (power 1)` avant complétude |
| Bloc mono-entrée | `id: "run-single"`, $N=1$ |
| Message entrée mono | `{ blockType: "run", value: "data-0", power: 1 }` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut après 2 messages sur 3 (run-join) | `EN_ATTENTE_JOIN` | Messages reçus : 2 / 3 $\rightarrow$ Join incomplet |
| Somme des puissances après 3 messages (run-join) | `3` | $1 + 1 + 1 = 3 === N (3)$ |
| Déclenchement de run-join | `OUI` (immédiat) | $N=3$ reçus et $\sum power === 3$ (R-42) |
| Déclenchement sur message unique `power: 2` ($N=2$) | `NON` | Cardinalité stricte : 1 message reçu $< N=2$ (SPEC-ENG-02 l.51) |
| Réécriture port 0 avant join | `value: "v2", power: 1` | Sémantique Last-Write-Wins sur port identique |
| Somme des puissances mono-entrée (run-single) | `1` | $1 === N (1)$ |
| Déclenchement de run-single | `OUI` (immédiat) | $N=1$ reçu et $\sum power === 1$ (R-42, cas limite 4) |

## Ce que ce cas ne vérifie pas

- La bascule en état de pause quand $\sum power < N$ → `CASE-ENG-02-2` ;
- Le comportement des blocs à $N=0$ entrée → `CASE-ENG-02-3` ;
- L'émission d'un bloc Start (0 entrée) → `CASE-ENG-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_02_1_join_trigger_when_all_inputs_received_with_full_power`
**Fichier :** `tests/tests-unitaires/eng/case-eng-02-1.test.ts`

## Revue du test automatisé

- [ ] Le test configure un bloc avec $N=3$ entrées câblées et simule l'arrivée séquentielle des messages.
- [ ] Le test flushe explicitement la file de microtâches/promesses (`flushPromises`, ADR-006) avant chaque assertion d'état (attente à 2 messages, déclenchement au 3e message, `power: 2`, Last-Write-Wins).
- [ ] Le test valide le cas nominal $N=1$ avec `power: 1`.
- [ ] Le test vérifie l'absence de déclenchement prématuré sur message unique non unitaire `power: 2` ($1 < N=2$).
- [ ] Le test valide la sémantique *Last-Write-Wins* sur un même port réécrit avant complétude du join.
- [ ] Le test échoue si la condition de déclenchement est relâchée à $\sum power < N$.
- [ ] Le nom du test contient `CASE_ENG_02_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
