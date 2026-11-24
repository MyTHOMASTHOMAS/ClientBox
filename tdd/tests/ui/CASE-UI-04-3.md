# CASE-UI-04-3 — Bouton d'export local et feedback avec chemin `.agents/docs`

**Spécification :** `SPEC-UI-04`  
**Critère d'acceptation :** `AC-UI-04-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-017`, `ADR-013`

## Ce que ce cas protège

Le bouton **« Enregistrer dans le dossier local »** doit appeler l'export (`POST /api/docs/export`) et afficher un retour clair : succès avec mention du chemin `.agents/docs` (ou équivalent `AGENTS_DIR`), ou erreur en français. Sans feedback, l'opérateur ne sait pas si l'export a fonctionné.

## Cas

```gherkin
Étant donné la page Instructions ouverte
Quand l'utilisateur clique sur "Enregistrer dans le dossier local"
Et que l'API répond succès avec un chemin cible
Alors un message de succès est affiché
Et le message contient une référence à "docs" sous le répertoire agents (ex. ".agents/docs")

Étant donné la page Instructions ouverte
Quand l'utilisateur clique sur "Enregistrer dans le dossier local"
Et que l'API répond en erreur
Alors un message d'erreur en français est affiché
Et l'UI ne plante pas
```

## Données

| Élément | Valeur |
|---|---:|
| Libellé bouton | `Enregistrer dans le dossier local` |
| Endpoint | `POST /api/docs/export` |
| Succès attendu | feedback + chemin cible |
| Échec attendu | message FR |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Appel export au clic | `OUI` | Client HTTP UI-002 |
| Feedback succès | `OUI` + chemin | AC-UI-04-3 |
| Feedback erreur FR | `OUI` | C-06 / REQ-007 |

## Ce que ce cas ne vérifie pas

- Le contenu disque du miroir → `CASE-DATA-05-1..3` ;
- Le contrat HTTP serveur isolé → `CASE-SRV-02-18`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_04_3_export_button_calls_api_and_shows_path_feedback`  
**Fichier :** `tests/units/ui/CASE-UI-04-3.test.ts`

## Revue du test automatisé

- [ ] Simule un client HTTP succès et vérifie l'appel `POST /api/docs/export`.
- [ ] Vérifie l'affichage d'un feedback contenant le chemin docs.
- [ ] Simule une erreur API et vérifie un message FR sans crash.
- [ ] Le nom du test contient `CASE_UI_04_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*
