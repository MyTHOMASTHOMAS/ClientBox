# CASE-ENG-03-3 — Évaluation de la condition `if(sac)` et distribution différentielle de puissance ($1$ / $0$)

**Spécification :** `SPEC-ENG-03`
**Critère d'acceptation :** `AC-ENG-03-3`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le bloc If évalue le contenu de son sac d'entrées via la fonction JavaScript `if(sac) → boolean` (`R-14`). Il dispose de deux familles de sorties distinctes : la branche vraie et la branche fausse (`R-10b`). La branche sélectionnée reçoit des messages avec `power: 1`, tandis que la branche non sélectionnée reçoit des messages avec `power: 0` (`R-15`, `R-22`, `REQ-018`, `REQ-019`). Si cette répartition différentielle est défaillante, les deux branches s'activeraient simultanément ou aucune ne progresserait.

## Cas

```gherkin
Étant donné un bloc If "if-decision" avec une condition script vérifiant si "status" vaut "OK"
Et possédant :
  - deux sorties sur sa branche vraie (True-1, True-2)
  - une sortie sur sa branche fausse (False-1)
Quand le bloc If est exécuté avec un sac d'entrées où "status" vaut "OK" (évaluation = true)
Alors les sorties True-1 et True-2 émettent chacune un message avec power 1
Et la sortie False-1 émet un message avec power 0

Quand le bloc If est exécuté avec un sac d'entrées où "status" vaut "KO" (évaluation = false)
Alors les sorties True-1 et True-2 émettent chacune un message avec power 0
Et la sortie False-1 émet un message avec power 1

Étant donné un bloc If n'ayant aucune connexion sur sa branche fausse (0 sortie fausse)
Quand la condition s'évalue à false
Alors aucun message n'est émis et la branche se termine normalement sans erreur
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc If | `id: "if-decision"` |
| Script évalué | `if(sac) => sac.data?.value === "OK"` |
| Sac d'entrées (cas vrai) | `{ data: { blockType: "run", value: "OK", power: 1 } }` |
| Sac d'entrées (cas faux) | `{ data: { blockType: "run", value: "KO", power: 1 } }` |
| Sorties branche vraie | 2 liaisons |
| Sorties branche fausse | 1 liaison |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Évaluation condition (sac OK) | `true` | `"OK" === "OK"` $\rightarrow$ condition vraie |
| Puissance sur sorties True (sac OK) | `1` | Branche active $\rightarrow$ `power: 1` (R-15, R-22) |
| Puissance sur sortie False (sac OK) | `0` | Branche inactive $\rightarrow$ `power: 0` (R-15, R-22) |
| Évaluation condition (sac KO) | `false` | `"KO" === "OK"` $\rightarrow$ condition fausse |
| Puissance sur sorties True (sac KO) | `0` | Branche inactive $\rightarrow$ `power: 0` (R-15, R-22) |
| Puissance sur sortie False (sac KO) | `1` | Branche active $\rightarrow$ `power: 1` (R-15, R-22) |
| Évaluation false avec 0 sortie fausse | `PASS` | Cas limite 1 : terminaison normale sans message |

## Ce que ce cas ne vérifie pas

- L'interception des exceptions JavaScript dans `if.js` → `CASE-DATA-02-3` et `CASE-ENG-04-3` ;
- La bascule en état de pause en aval sur réception de `power: 0` → `CASE-ENG-02-2` ;
- La persistance du script `if.js` sur disque → `CASE-DATA-02-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_03_3_if_block_evaluation_and_differential_power_dispatch`
**Fichier :** `tests/tests-unitaires/eng/case-eng-03-3.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie l'évaluation à `true` avec `power: 1` sur la branche vraie et `power: 0` sur la fausse.
- [ ] Le test vérifie l'évaluation à `false` avec `power: 0` sur la branche vraie et `power: 1` sur la fausse.
- [ ] Le test valide le comportement sans crash avec 0 sortie sur la branche non prise.
- [ ] Le test vérifie que le champ `blockType` du message émis est `"if"`.
- [ ] Le test échoue si la branche inactive émet avec `power: 1`.
- [ ] Le nom du test contient `CASE_ENG_03_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
