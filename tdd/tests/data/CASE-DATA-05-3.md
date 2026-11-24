# CASE-DATA-05-3 — Ré-export : mise à jour du miroir depuis la source embarquée

**Spécification :** `SPEC-DATA-05`  
**Critère d'acceptation :** `AC-DATA-05-3`  
**Type :** acceptation  
**Niveau de risque :** majeur  
**ADR liés :** `ADR-017`

## Ce que ce cas protège

Un second export doit réaligner `.agents/docs/` sur la source embarquée **sans** exiger que l'utilisateur vide le dossier à la main. Sinon les opérateurs resteraient avec une doc locale obsolète ou bloqués par des fichiers déjà présents.

## Cas

```gherkin
Étant donné un premier export réussi sous ".agents/docs/"
Et un fichier du miroir modifié manuellement (contenu divergent)
Quand un nouvel export est déclenché avec succès
Alors le fichier concerné reflète à nouveau le contenu de la source embarquée
Et l'export ne échoue pas au motif que le dossier cible existe déjà
```

## Données

| Élément | Valeur |
|---|---:|
| Fichier témoin | `.agents/docs/README.md` (ou autre entrée du manifeste) |
| Contenu pollué | chaîne distincte ex. `"DOC_LOCALE_OBSOLETE"` |
| Contenu attendu après ré-export | contenu embarqué d'origine (ne contient pas la pollution) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Succès du 2ᵉ export | `OUI` | Idempotence contrôlée |
| Pollution écrasée | `OUI` | Écriture miroir source → cible |
| Nettoyage manuel préalable | `NON requis` | AC-DATA-05-3 |

## Ce que ce cas ne vérifie pas

- La purge totale des fichiers hors manifeste sous `.agents/docs/` → hors v1 (cas limite SPEC-DATA-05) ;
- L'UI de feedback → `CASE-UI-04-3`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_DATA_05_3_reexport_overwrites_mirror_from_embedded_source`  
**Fichier :** `tests/units/data/CASE-DATA-05-3.test.ts`

## Revue du test automatisé

- [ ] Premier export, pollution d'un fichier miroir, second export.
- [ ] Vérifie que le contenu post ré-export correspond à la source embarquée.
- [ ] Vérifie que le 2ᵉ export ne échoue pas si `docsRoot` existe.
- [ ] Le nom du test contient `CASE_DATA_05_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*
