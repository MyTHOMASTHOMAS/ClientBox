# CASE-DATA-05-2 — Aucune écriture de documentation sous `.agents/data/` lors de l'export

**Spécification :** `SPEC-DATA-05`  
**Critère d'acceptation :** `AC-DATA-05-2`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-017`, `ADR-005`

## Ce que ce cas protège

L'export de documentation ne doit **jamais** polluer `.agents/data/` (contrat ADR-005 : ressources JSON/JS uniquement). Un mélange doc / data casserait le CRUD, le seed et la lisibilité Git des ressources métier.

## Cas

```gherkin
Étant donné un workspace avec un dossier ".agents/data/" déjà peuplé ou vide
Et une source de documentation embarquée
Quand l'export local est déclenché avec succès
Alors des fichiers Markdown apparaissent sous ".agents/docs/"
Et aucun nouveau fichier ".md" de documentation n'est créé sous ".agents/data/"
Et aucune arborescence "docs/" n'est créée sous ".agents/data/"
```

## Données

| Élément | Valeur |
|---|---:|
| Zone autorisée | `.agents/docs/` |
| Zone interdite | `.agents/data/**` pour les fichiers du manifeste doc |
| Extensions surveillées sous data/ | `*.md` issus de l'export |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Fichiers MD sous `docs/` | `≥ 1` | Export réussi |
| Nouveaux MD doc sous `data/` | `0` | Frontière ADR-017 |
| Dossier `data/docs/` | `ABSENT` | Pas de miroir sous data |

## Ce que ce cas ne vérifie pas

- La présence positive du miroir → `CASE-DATA-05-1` ;
- Le ré-export → `CASE-DATA-05-3` ;
- L'absence de logs d'exécution sous data → `CASE-DATA-04-3`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_DATA_05_2_export_does_not_write_docs_under_agents_data`  
**Fichier :** `tests/units/data/CASE-DATA-05-2.test.ts`

## Revue du test automatisé

- [ ] Snapshot ou inventaire de `.agents/data/` avant/après export.
- [ ] Vérifie qu'aucun fichier du manifeste n'apparaît sous `data/`.
- [ ] Vérifie l'absence de sous-dossier `data/docs/`.
- [ ] Le nom du test contient `CASE_DATA_05_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*
