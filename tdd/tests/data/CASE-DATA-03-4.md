# CASE-DATA-03-4 — Détection et rejet strict de toute collision de clé d'entrée sur un même bloc cible

**Spécification :** `SPEC-DATA-03`
**Critère d'acceptation :** `AC-DATA-03-4`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Deux connexions arrivant sur le même bloc cible ne peuvent jamais partager la même clé d'entrée (`R-13`, `REQ-033`). Si la détection de collision disparaît, deux sources distinctes écriraient au même emplacement du sac d'entrées, rendant le résultat d'une condition `if` indéterminé et corruptant le scénario persisté.

## Cas

```gherkin
Étant donné un bloc cible "if-1" ayant déjà une connexion câblée avec la clé "0"
Quand l'utilisateur tente d'ajouter une seconde connexion avec la même clé "0" sur le même bloc "if-1"
Alors la validation de collision détecte le doublon
Et la connexion est rejetée immédiatement
Et l'état antérieur du scénario est conservé intact (rollback)
Et un message d'erreur explicite signale la collision sur la clé "0"

Étant donné un bloc cible "run-1" ayant déjà une connexion avec la clé personnalisée "contextInput"
Quand l'utilisateur tente d'ajouter une seconde connexion avec la même clé "contextInput" sur le même bloc "run-1"
Alors la validation de collision détecte le doublon sur la clé personnalisée
Et la connexion est rejetée
Et un message d'erreur explicite signale la collision sur la clé "contextInput"

Étant donné un bloc cible "if-2" avec aucune connexion existante
Quand l'utilisateur ajoute une connexion avec la clé "0"
Alors la connexion est acceptée (aucune collision possible)
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc cible | `"if-1"` |
| Clé existante (numérique) | `"0"` |
| Clé tentée (doublon numérique) | `"0"` |
| Clé existante (personnalisée) | `"contextInput"` |
| Clé tentée (doublon personnalisée) | `"contextInput"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Ajout connexion doublon clé `"0"` | `REJETÉ` | Collision détectée : R-13 |
| Rollback de l'état du scénario | `OUI` | Conservation de l'état antérieur |
| Message d'erreur (clé `"0"`) | `OUI` | Nominatif avec le nom de la clé |
| Ajout connexion doublon clé `"contextInput"` | `REJETÉ` | Collision sur clé personnalisée |
| Ajout connexion sur bloc vide | `ACCEPTÉ` | Aucune collision possible |

## Ce que ce cas ne vérifie pas

- La renumérotation des clés numériques après suppression → `CASE-DATA-03-2` ;
- La préservation des clés personnalisées → `CASE-DATA-03-3` ;
- La persistance initiale du scénario → `CASE-DATA-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_03_4_key_collision_detection_and_rejection`
**Fichier :** `tests/tests-unitaires/data/case-data-03-4.test.ts`

## Revue du test automatisé

- [ ] Le test tente d'ajouter une connexion avec une clé numérique déjà présente et vérifie le rejet.
- [ ] Le test vérifie que l'état du scénario est conservé intact après le rejet (rollback).
- [ ] Le test vérifie qu'un message d'erreur explicite identifie la clé en collision.
- [ ] Le test tente d'ajouter une connexion avec une clé personnalisée déjà présente et vérifie le rejet.
- [ ] Le test vérifie que l'ajout sur un bloc vide est accepté.
- [ ] Le test échoue si la vérification de collision est supprimée du code.
- [ ] Le nom du test contient `CASE_DATA_03_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
