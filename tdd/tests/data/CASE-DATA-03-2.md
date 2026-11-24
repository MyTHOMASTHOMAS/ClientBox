# CASE-DATA-03-2 — Renumérotation automatique et séquentielle des clés d'entrées numériques par défaut après suppression de liaison

**Spécification :** `SPEC-DATA-03`
**Critère d'acceptation :** `AC-DATA-03-2`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Lorsqu'une liaison est supprimée, les clés numériques par défaut restantes doivent être automatiquement renumérotées pour maintenir la séquence `0, 1, 2…` sans trous (`REQ-035`, `R-43`). Si cet algorithme disparaît, les clés forment des séquences avec trous, rendant leur utilisation par les scripts `if` imprédictible.

## Cas

```gherkin
Étant donné un bloc cible "if-1" ayant 3 entrées câblées avec les clés numériques par défaut :
  - connexion A → clé "0"
  - connexion B → clé "1"
  - connexion C → clé "2"
Quand l'utilisateur supprime la connexion correspondant à la clé "1" (connexion B)
Alors la clé de la connexion C est automatiquement renumérotée de "2" à "1"
Et les clés résultantes sur le bloc "if-1" sont exactement : "0" et "1"
Et aucune clé "2" ne subsiste

Étant donné un bloc cible "if-2" ayant 2 entrées câblées :
  - connexion A → clé "0"
  - connexion B → clé "1"
Quand l'utilisateur supprime la connexion correspondant à la clé "0" (connexion A)
Alors la clé de la connexion B est renumérotée de "1" à "0"
Et les clés résultantes sur le bloc "if-2" sont exactement : "0"
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc cible | `"if-1"` |
| Clés initiales | `"0"`, `"1"`, `"2"` |
| Connexion supprimée | clé `"1"` |
| Clés attendues après suppression | `"0"`, `"1"` |
| Clé renumérotée | `"2"` → `"1"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre de clés après suppression | `2` | `3 - 1 = 2` |
| Première clé | `"0"` | Inchangée (connexion A) |
| Deuxième clé | `"1"` | Renumérotée depuis `"2"` |
| Présence de la clé `"2"` | `NON` | Supprimée après renumérotation |

## Ce que ce cas ne vérifie pas

- La préservation des clés personnalisées lors d'une suppression → `CASE-DATA-03-3` ;
- La détection de collision de clés → `CASE-DATA-03-4` ;
- La persistance initiale du scénario → `CASE-DATA-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_03_2_default_key_renumbering_after_deletion`
**Fichier :** `tests/tests-unitaires/data/case-data-03-2.test.ts`

## Revue du test automatisé

- [ ] Le test crée un bloc cible avec 3 connexions de clés `"0"`, `"1"`, `"2"`.
- [ ] Le test supprime la connexion de clé `"1"` et vérifie la renumérotation de `"2"` → `"1"`.
- [ ] Le test vérifie que les clés résultantes sont exactement `["0", "1"]`.
- [ ] Le test vérifie le cas de suppression de la clé `"0"` (renumérotation `"1"` → `"0"`).
- [ ] Le test échoue si l'algorithme de renumérotation est supprimé du code.
- [ ] Le nom du test contient `CASE_DATA_03_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
