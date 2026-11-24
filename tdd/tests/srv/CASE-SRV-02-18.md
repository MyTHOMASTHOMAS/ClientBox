# CASE-SRV-02-18 — `POST /api/docs/export` matérialise `.agents/docs/` ou renvoie une erreur FR

**Spécification :** `SPEC-SRV-02`  
**Critère d'acceptation :** `AC-SRV-02-11`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-017`, `ADR-012`

## Ce que ce cas protège

La route `POST /api/docs/export` (`CTL-007`) doit écrire le miroir Markdown sous `docsRoot` (`.agents/docs/`) et répondre avec un succès contenant le chemin cible, ou une erreur HTTP en français en cas d'échec I/O — sans planter le processus.

## Cas

```gherkin
Étant donné le serveur HTTP en écoute et un workspace temporaire
Quand un client effectue POST "/api/docs/export"
Alors le serveur répond 200
Et le corps indique le succès et le chemin cible (ex. se terminant par "/docs" sous AGENTS_DIR)
Et le miroir Markdown est présent sous ce chemin

Étant donné un échec I/O simulé à l'écriture
Quand un client effectue POST "/api/docs/export"
Alors le serveur répond une erreur HTTP
Et le message d'erreur est en français
Et le processus Node ne se termine pas anormalement
```

## Données

| Élément | Valeur |
|---|---:|
| Route | `POST /api/docs/export` |
| Contrôleur | `CTL-007` |
| Cible | `<AGENTS_DIR>/docs/` |
| Corps succès (exemple) | `{ ok: true, target: ".../docs", files: [...] }` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Code nominal | `200` | AC-SRV-02-11 |
| Chemin dans la réponse | `OUI` | Feedback opérateur |
| Miroir créé | `OUI` | SVC-013 + LIB-016 |
| Erreur I/O | HTTP + FR | Cas limite SPEC-SRV-02 |

## Ce que ce cas ne vérifie pas

- La non-écriture sous `data/` → `CASE-DATA-05-2` ;
- Le feedback UI → `CASE-UI-04-3` ;
- `GET /api/docs` → `CASE-SRV-02-17`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_18_post_api_docs_export_writes_agents_docs_or_french_error`  
**Fichier :** `tests/units/srv/CASE-SRV-02-18.test.ts`

## Revue du test automatisé

- [ ] Workspace temporaire + POST export → 200 + chemin + fichiers.
- [ ] Simule une erreur d'écriture → erreur HTTP + message FR.
- [ ] Le nom du test contient `CASE_SRV_02_18`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** Ne pas confondre avec `CASE-SRV-02-12` (SSE), déjà existant.
