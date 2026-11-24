# CASE-ENG-02-2 — Bascule automatique en état de pause en cas de puissance insuffisante ($\sum power < N$) et déblocage ultérieur

**Spécification :** `SPEC-ENG-02`
**Critère d'acceptation :** `AC-ENG-02-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Dès que les $N$ messages d'entrées sont tous reçus, si la somme des puissances est strictement inférieure à $N$ ($\sum power < N$), le bloc bascule en état **pause** sans exécuter son traitement (`R-42b`). Si une entrée à `power: 0` reçoit ultérieurement une mise à jour à `power: 1`, le join est réévalué et le bloc est débloqué. Sans ce mécanisme, des branches inactives bloqueraient définitivement le graphe ou s'exécuteraient par erreur avec une énergie nulle.

## Cas

```gherkin
Étant donné un bloc Run "run-pause" ayant N=2 entrées câblées
Quand le port 0 reçoit un message avec power 1
Et le port 1 reçoit un message avec power 0
Alors les N=2 messages sont bien reçus
Et la somme sum(power) est égale à 1 (inférieure à N=2)
Et le bloc "run-pause" bascule en état "pause" sans exécuter son traitement

Étant donné le bloc "run-pause" actuellement en état "pause"
Quand le port 1 reçoit un nouveau message avec power 1
Alors la somme des puissances devient égale à 2
Et le bloc "run-pause" quitte l'état pause pour démarrer immédiatement son exécution

Étant donné un bloc Run "run-single-pause" ayant N=1 entrée câblée
Quand son port d'entrée reçoit un message avec power 0
Alors sum(power) === 0 (inférieur à 1)
Et le bloc "run-single-pause" bascule en état "pause"
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc cible | `id: "run-pause"`, $N=2$ |
| Message initial port 0 | `{ blockType: "if", value: "ok", power: 1 }` |
| Message initial port 1 | `{ blockType: "if", value: "skip", power: 0 }` |
| Message mis à jour port 1 | `{ blockType: "if", value: "retry_ok", power: 1 }` |
| Bloc mono-entrée | `id: "run-single-pause"`, $N=1$ |
| Message mono-entrée | `{ blockType: "if", value: "skip", power: 0 }` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Somme initiale (run-pause) | `1` | $1 + 0 = 1 < N (2)$ |
| État initial (run-pause) | `PAUSE` | $\sum power < N \rightarrow$ mise en pause (R-42b) |
| Exécution initiale traitement | `NON` | Traitement suspendu |
| Somme mise à jour (run-pause) | `2` | $1 + 1 = 2 === N (2)$ |
| État après mise à jour (run-pause) | `RUNNING` | $\sum power === N \rightarrow$ déblocage et exécution (R-42b) |
| État initial (run-single-pause) | `PAUSE` | $0 < N (1) \rightarrow$ mise en pause (cas limite 3) |

## Ce que ce cas ne vérifie pas

- L'exécution nominale directe $\sum power === N$ sans passage par pause → `CASE-ENG-02-1` ;
- L'inactivité des blocs à $N=0$ entrée → `CASE-ENG-02-3` ;
- L'interruption de la pause par signal Stop manuel → `SPEC-ADPT-03`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_02_2_pause_state_transition_and_subsequent_unpause`
**Fichier :** `tests/tests-unitaires/eng/case-eng-02-2.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie la réception des $N$ messages dont un avec `power: 0`.
- [ ] Le test vérifie que l'état du bloc passe à `PAUSE` et qu'aucune commande CLI n'est lancée.
- [ ] Le test synchronise la boucle d'événements (flush des microtâches, ADR-006) pour valider sans race condition la bascule en pause puis la transition `PAUSE` $\rightarrow$ `RUNNING` après mise à jour d'entrée.
- [ ] Le test valide le cas mono-entrée $N=1$ avec `power: 0`.
- [ ] Le test échoue si un bloc à `power < N` démarre son traitement.
- [ ] Le nom du test contient `CASE_ENG_02_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
