# CASE-ENG-01-1 — Structure du message inter-blocs `BlockMessage` et absence de clé sur les ports de sortie

**Spécification :** `SPEC-ENG-01`
**Critère d'acceptation :** `AC-ENG-01-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Les ports de sortie des blocs émettent des messages normalisés `BlockMessage` comportant exclusivement les propriétés `blockType`, `value` et `power`, sans aucun champ `key` (`R-10`, `R-44`, `D.2`). Si une clé d'identification était attachée aux sorties, l'indépendance de routage serait brisée et les liaisons multi-cibles entreraient en collision.

## Cas

```gherkin
Étant donné un bloc Run "run-1" ayant exécuté sa commande avec la sortie textuelle "Résultat de génération"
Quand le bloc termine son exécution avec succès
Alors il émet sur chacun de ses ports de sortie le message :
  | champ     | valeur                    |
  | blockType | "run"                     |
  | value     | "Résultat de génération"  |
  | power     | 1                         |
Et le message émis ne possède aucune propriété "key"

Étant donné un bloc Start "start-0" au lancement d'un scénario
Quand le bloc s'exécute
Alors il émet sur chacun de ses ports de sortie le message :
  | champ     | valeur                    |
  | blockType | "start"                   |
  | value     | null                      |
  | power     | 1                         |
Et le message émis ne possède aucune propriété "key"
```

## Données

| Élément | Valeur |
|---|---:|
| Émetteur Run (`id`) | `"run-1"` |
| Sortie CLI Run (`value`) | `"Résultat de génération"` |
| Émetteur Start (`id`) | `"start-0"` |
| Sortie Start (`value`) | `null` |
| Énergie émise nominale (`power`) | `1` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Structure message Run | `{ blockType: "run", value: "Résultat de génération", power: 1 }` | Schéma `BlockMessage` conforme R-10/REQ-033 |
| Présence champ `key` sur message Run | `false` (`undefined`) | Règle R-10, R-44, Annexe D.2 : zéro clé sur sortie |
| Structure message Start | `{ blockType: "start", value: null, power: 1 }` | Schéma `BlockMessage` conforme R-19/R-20 |
| Présence champ `key` sur message Start | `false` (`undefined`) | Règle R-10, R-44, Annexe D.2 : zéro clé sur sortie |

## Ce que ce cas ne vérifie pas

- L'indexation du message dans le sac d'entrées `BlockInputBag` du bloc cible → `CASE-ENG-01-2` ;
- Le calcul de join et la somme des puissances → `CASE-ENG-02-1` ;
- L'émission différentielle de puissance pour le bloc If → `CASE-ENG-03-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_01_1_block_message_structure_no_output_key`
**Fichier :** `tests/tests-unitaires/eng/case-eng-01-1.test.ts`

## Revue du test automatisé

- [ ] Le test intercepte l'émission d'un bloc Run et vérifie les champs `blockType`, `value` et `power`.
- [ ] Le test vérifie formellement que `'key' in message === false`.
- [ ] Le test intercepte l'émission d'un bloc Start et valide `value === null` et `power === 1`.
- [ ] Le test échoue si un champ `key` est injecté dans le message émis par la sortie.
- [ ] Le nom du test contient `CASE_ENG_01_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
