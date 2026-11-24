# CASE-ENG-03-6 — Résilience et statut d'erreur en français sur échec de script If sans crash process

**Spécification :** `SPEC-ENG-03`, `SPEC-DATA-02`  
**Critère d'acceptation :** `AC-ENG-03-3`, `AC-DATA-02-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`  

---

## Ce que ce cas protège

Lors de l'évaluation d'un script conditionnel `If`, une exception runtime peut survenir (erreur de syntaxe, division par zéro, référence indéfinie ou levée explicite de `throw`). Ce cas garantit que le moteur de scénario intercepte proprement l'exception sans la laisser remonter de façon non gérée au runtime Node.js, marque le bloc If avec le statut `'error'` accompagné d'un diagnostic en langue française, et déclenche l'arrêt sécurisé du scénario tout en maintenant le serveur HTTP parfaitement opérationnel.

---

## Cas

```gherkin
Étant donné un bloc If exécutant un script qui lève une exception "throw new Error('Condition invalide');"
Quand le runner évalue ce bloc conditionnel
Alors le runner intercepte l'exception sans planter le processus global Node.js
Et le bloc If émet une notification d'état "BlockStatus" avec :
  | champ   | valeur                                                  |
  | status  | "error"                                                 |
  | message | "Erreur lors de l'exécution du script If : Condition invalide" |
Et le runner bascule en arrêt d'erreur sans exécuter les blocs avals
Et le processus serveur Node.js continue de fonctionner
```

---

## Données

| Élément | Valeur |
|---|---:|
| Exception simulée | `throw new Error('Donnée manquante')` ou syntaxe erronée |
| Statut attendu sur le bloc | `'error'` |
| Message de statut | Libellé explicite en français (`REQ-007`) |
| Comportement du processus hôte | Reste en écoute (zéro `process.exit`) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Survie du processus serveur | `OUI (100%)` | Enveloppement dans `try/catch` du chargeur de script |
| Statut du bloc fautif | `'error'` | Signalement propre via `block_status` |

---

## Ce que ce cas ne vérifie pas

- Le résultat booléen nominal d'un script valide → `CASE-ENG-03-3` ;
- L'arrêt d'urgence volontaire par l'utilisateur → `CASE-UI-03-2`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_03_6_if_script_error_resilience_and_french_status`  
**Fichier :** `tests/units/eng/case-eng-03-6.test.ts`  

## Revue du test automatisé

- [ ] Le test configure un script If qui lève une exception.
- [ ] Le test vérifie que le runner intercepte l'erreur.
- [ ] Le test vérifie l'émission de `BlockStatus` avec `'error'` et message en français.
- [ ] Le test vérifie que le processus ne crashe pas.
- [ ] Le nom du test contient `CASE_ENG_03_6`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
