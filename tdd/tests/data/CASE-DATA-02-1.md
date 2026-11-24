# CASE-DATA-02-1 — Détection, chargement et listage des scripts conditionnels JS sous `.agents/data/if/`

**Spécification :** `SPEC-DATA-02`
**Critère d'acceptation :** `AC-DATA-02-1`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Le système doit être capable de découvrir et de charger dynamiquement tous les fichiers `.js` présents sous `.agents/data/if/` (`R-01`, `R-02`, `REQ-011`). Si cette capacité de découverte disparaît, les blocs If ne peuvent pas référencer leurs scripts conditionnels, rendant les scénarios conditionnels inutilisables.

## Cas

```gherkin
Étant donné un répertoire ".agents/data/if/" contenant les fichiers suivants :
  - "check-status.js"
  - "check-role.js"
  - "readme.txt"
Quand le chargeur scanne le répertoire ".agents/data/if/"
Alors la liste retournée contient exactement les entrées :
  - "check-status"
  - "check-role"
Et le fichier "readme.txt" n'est pas inclus dans la liste (filtre sur l'extension .js)

Étant donné un répertoire ".agents/data/if/" vide (aucun fichier .js)
Quand le chargeur scanne le répertoire
Alors la liste retournée est vide
Et aucune erreur n'est levée

Étant donné un répertoire ".agents/data/if/" inexistant
Quand le chargeur tente de scanner ce répertoire
Alors la liste retournée est vide
Et un avertissement (non bloquant) est émis indiquant que le répertoire est absent
```

## Données

| Élément | Valeur |
|---|---:|
| Chemin du répertoire | `.agents/data/if/` |
| Fichiers JS présents | `check-status.js`, `check-role.js` |
| Fichier non JS présent | `readme.txt` |
| Noms dans la liste attendue | `"check-status"`, `"check-role"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre d'entrées listées (2 JS + 1 txt) | `2` | Filtre `.js` uniquement |
| Entrée `"check-status"` dans la liste | `OUI` | Fichier JS valide |
| Entrée `"readme"` dans la liste | `NON` | Extension `.txt` exclue |
| Résultat répertoire vide | `[]` sans erreur | Liste vide, pas d'exception |
| Résultat répertoire absent | `[]` + avertissement | Dégradé gracieux |

## Ce que ce cas ne vérifie pas

- L'exécution de la fonction `if(sac)` → `CASE-DATA-02-2` ;
- La gestion des erreurs de syntaxe dans le script → `CASE-DATA-02-3` ;
- La logique de propagation de puissance du bloc If → hors périmètre DATA.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_02_1_if_scripts_detection_and_listing`
**Fichier :** `tests/tests-unitaires/data/case-data-02-1.test.ts`

## Revue du test automatisé

- [ ] Le test crée un répertoire temporaire avec 2 fichiers JS et 1 fichier txt.
- [ ] Le test vérifie que la liste retournée contient exactement les 2 noms JS (sans extension).
- [ ] Le test vérifie que le fichier txt est exclu.
- [ ] Le test vérifie le comportement sur répertoire vide (liste vide, pas d'erreur).
- [ ] Le test vérifie le comportement sur répertoire absent (liste vide, avertissement).
- [ ] Le test échoue si le filtre d'extension `.js` est supprimé.
- [ ] Le nom du test contient `CASE_DATA_02_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
