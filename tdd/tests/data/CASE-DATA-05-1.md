# CASE-DATA-05-1 — Présence du miroir Markdown sous `.agents/docs/` après export réussi

**Spécification :** `SPEC-DATA-05`  
**Critère d'acceptation :** `AC-DATA-05-1`  
**Type :** acceptation  
**Niveau de risque :** majeur  
**ADR liés :** `ADR-017`, `ADR-005`, `ADR-012`

## Ce que ce cas protège

Après une action d'export réussie, l'arborescence de documentation opérateur doit être matérialisée sous `<AGENTS_DIR>/docs/` (défaut `.agents/docs/`), en miroir de la source embarquée issue de `docs/instructions/`. Sans cette garantie, le bouton « Enregistrer dans le dossier local » serait cosmétique et les opérateurs / agents workspace n'auraient aucun fichier MD local.

## Cas

```gherkin
Étant donné une source de documentation utilisateur embarquée non vide
  (au moins README.md et une page sous demarrage/)
Et un workspace temporaire avec AGENTS_DIR résolu
Quand l'export local est déclenché avec succès (POST /api/docs/export ou service SVC-013)
Alors le dossier ".agents/docs/" (ou <AGENTS_DIR>/docs/) existe
Et le fichier ".agents/docs/README.md" est présent
Et au moins un fichier Markdown attendu du manifeste y est présent avec un contenu non vide cohérent avec la source embarquée
```

## Données

| Élément | Valeur |
|---|---:|
| Cible | `<AGENTS_DIR>/docs/` (défaut `.agents/docs/`) |
| Fichier index attendu | `README.md` |
| Source | Contenu embarqué (`docs/instructions/`), pas `docs/deploy/` |
| Résultat HTTP nominal (si via API) | `200 OK` avec chemin cible |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Existence `docsRoot` | `OUI` | Création si absent puis écriture |
| Présence `README.md` | `OUI` | Miroir du manifeste |
| Contenu non vide | `OUI` | Copie de la source embarquée |
| Pas de dépendance à `public/` | `OUI` | ADR-012 / ADR-017 |

## Ce que ce cas ne vérifie pas

- L'absence d'écriture sous `.agents/data/` → `CASE-DATA-05-2` ;
- L'idempotence du ré-export → `CASE-DATA-05-3` ;
- Le feedback UI du bouton → `CASE-UI-04-3` ;
- La route HTTP détaillée → `CASE-SRV-02-18`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_DATA_05_1_export_creates_markdown_mirror_under_agents_docs`  
**Fichier :** `tests/units/data/CASE-DATA-05-1.test.ts`

## Revue du test automatisé

- [ ] Le test utilise un workspace temporaire isolé.
- [ ] Le test déclenche un export réussi via le service ou l'API.
- [ ] Le test vérifie l'existence de `docsRoot` et de `README.md`.
- [ ] Le test vérifie qu'au moins un fichier du manifeste est présent avec contenu non vide.
- [ ] Le nom du test contient `CASE_DATA_05_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*
