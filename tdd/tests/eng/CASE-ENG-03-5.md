# CASE-ENG-03-5 — Règles de consommation du sac d'entrées : non-lecture Run/ClearContext vs lecture If

**Spécification :** `SPEC-ENG-01`, `SPEC-ENG-03`  
**Critère d'acceptation :** `AC-ENG-01-2`, `AC-ENG-03-3`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`  

---

## Ce que ce cas protège

Le sac d'entrées (`BlockInputBag`) accumule les valeurs transmises par les liaisons entrantes d'un bloc selon leurs clés. Ce cas garantit contractuellement que :
1. Les blocs de type `Run` et `ClearContext` n'effectuent aucune lecture ni extraction sur le sac d'entrées (leur exécution dépend exclusivement de leurs paramètres statiques configurés).
2. Le bloc conditionnel `If` lit impérativement le sac d'entrées et le transmet en argument à la fonction `if(sac)` pour décider dynamiquement de la branche active.

---

## Cas

```gherkin
Étant donné un sac d'entrées contenant '{ "0": "valeur-1", "cle_custom": 42 }'
Quand un bloc de type "Run" est exécuté avec ce sac
Alors le bloc Run n'extrait aucune clé du sac et exécute son prompt statique configuré

Étant donné le même sac d'entrées
Quand un bloc de type "ClearContext" est exécuté avec ce sac
Alors le bloc ClearContext n'extrait aucune clé du sac et exécute le reset statique de son agent

Étant donné le même sac d'entrées
Quand un bloc de type "If" est exécuté
Alors le bloc If transmet fidèlement l'objet sac en argument à la fonction conditionnelle "if(sac)"
Et la décision du bloc repose sur le retour booléen calculé à partir des clés du sac
```

---

## Données

| Élément | Valeur |
|---|---:|
| Sac d'entrées modèle | `{ "0": "résultat précédent", "param": 100 }` |
| Règle bloc Run | Ne lit pas le sac (`inputs` non consommé pour le prompt) |
| Règle bloc ClearContext | Ne lit pas le sac |
| Règle bloc If | Consomme obligatoirement le sac `if(sac)` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Accès au sac par Run | `0 accès` | Indépendance vis-à-vis des données amont |
| Accès au sac par ClearContext | `0 accès` | Indépendance vis-à-vis des données amont |
| Argument passé au script If | `sac` complet | Passage intégral des entrées câblées |

---

## Ce que ce cas ne vérifie pas

- L'assemblage du prompt utilisateur avec le prompt système → `CASE-ENG-04-1` ;
- Le calcul de collision de clés d'entrées → `CASE-DATA-03-4`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_03_5_input_bag_consumption_rules`  
**Fichier :** `tests/units/eng/case-eng-03-5.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie que le bloc Run s'exécute sans dépendre du sac d'entrées.
- [ ] Le test vérifie que le bloc ClearContext ignore le sac d'entrées.
- [ ] Le test vérifie que le bloc If reçoit et évalue le sac d'entrées complet.
- [ ] Le nom du test contient `CASE_ENG_03_5`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
