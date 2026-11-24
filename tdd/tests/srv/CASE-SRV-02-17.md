# CASE-SRV-02-17 — `GET /api/docs` expose la documentation embarquée sans `public/`

**Spécification :** `SPEC-SRV-02`  
**Critère d'acceptation :** `AC-SRV-02-10`  
**Type :** acceptation  
**Niveau de risque :** majeur  
**ADR liés :** `ADR-017`, `ADR-012`

## Ce que ce cas protège

La route `GET /api/docs` (`CTL-007`) doit renvoyer la liste / le contenu de la documentation opérateur **embarquée** dans le livrable. Elle ne doit pas lire un dossier `public/` disque (interdit ADR-012).

## Cas

```gherkin
Étant donné le serveur HTTP en écoute avec le contrôleur docs enregistré
Quand un client effectue GET "/api/docs"
Alors le serveur répond 200
Et le corps contient une représentation de la documentation embarquée (liste et/ou documents)
Et aucune lecture d'un chemin "public/" n'est réalisée pour satisfaire cette requête

Étant donné une panne interne du service docs
Quand un client effectue GET "/api/docs"
Alors le serveur répond une erreur HTTP avec message en français
Et le processus serveur ne crashe pas
```

## Données

| Élément | Valeur |
|---|---:|
| Route | `GET /api/docs` |
| Contrôleur | `CTL-007` |
| Service | `SVC-013` |
| Source | Manifeste embarqué (`docs/instructions/`) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Code nominal | `200` | AC-SRV-02-10 |
| Contenu présent | `OUI` | Liste/docs non vides si manifeste peuplé |
| Accès `public/` | `NON` | ADR-012 |

## Ce que ce cas ne vérifie pas

- L'écriture disque `.agents/docs/` → `CASE-SRV-02-18` / `CASE-DATA-05-*` ;
- Le rendu UI → `CASE-UI-04-2`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_17_get_api_docs_returns_embedded_documentation`  
**Fichier :** `tests/units/srv/CASE-SRV-02-17.test.ts`

## Revue du test automatisé

- [ ] Enregistre les routes docs et appelle `GET /api/docs`.
- [ ] Vérifie 200 + payload documentaire.
- [ ] Vérifie (espion / absence d'API) qu'aucun chemin `public/` n'est lu.
- [ ] Le nom du test contient `CASE_SRV_02_17`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** Ne pas confondre avec `CASE-SRV-02-11` (gardes runner), déjà existant.
