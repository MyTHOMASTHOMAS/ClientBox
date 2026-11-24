# CASE-SRV-02-9 — Consultation sécurisée de script GET /api/if/:id et rejet strict du path traversal

**Spécification :** `SPEC-SRV-02`, `SPEC-DATA-02`  
**Critère d'acceptation :** `AC-SRV-02-1`, `AC-DATA-02-1`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-005`  

---

## Ce que ce cas protège

Le contrôleur de ressources (`CTL-001 resource.controller.ts`) doit exposer l'endpoint `GET /api/if/:id` permettant la consultation en lecture seule du code source d'un script conditionnel par l'IHM (`REQ-011`). Ce cas garantit que l'identifiant est validé, que les tentatives de traversée de répertoire (*path traversal* avec `..` ou slashs) sont strictement rejetées avec un statut HTTP `400 Requête invalide` formulé en français, et qu'un script inexistant retourne un statut `404 Non trouvé`.

---

## Cas

```gherkin
Étant donné un serveur HTTP en écoute avec le contrôleur de ressources enregistré
Et un script conditionnel valide existant sous ".agents/data/if/custom-check.js"
Quand un client effectue une requête "GET /api/if/custom-check"
Alors le serveur répond avec un code HTTP 200 (OK)
Et le corps de la réponse contient le contenu textuel exact du script JavaScript

Étant donné une requête contenant une tentative de path traversal "GET /api/if/..%2F..%2Fetc%2Fpasswd"
Quand la requête est traitée par le contrôleur
Alors le serveur répond avec un code HTTP 400 (Bad Request)
Et le corps JSON contient '{ "message": "Identifiant de script invalide." }'

Étant donné une requête ciblant un identifiant inexistant "GET /api/if/script-fantome"
Quand la requête est traitée
Alors le serveur répond avec un code HTTP 404 (Not Found)
Et le corps JSON contient '{ "message": "Script introuvable." }'
```

---

## Données

| Élément | Valeur |
|---|---:|
| Script nominal | `custom-check.js` sous `.agents/data/if/` |
| Vecteurs path traversal testés | `../script.js`, `../../secrets.json`, `..%2F..%2Fpasswd`, `sub/nested.js` |
| Statut succès | `200 OK` avec contenu source UTF-8 |
| Statut rejet traversal | `400 Bad Request` |
| Statut script absent | `404 Not Found` |
| Format d'erreur | JSON `{ "message": string }` 100% en français (`REQ-007`) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Code HTTP nominal | `200 OK` | Script existant dans `.agents/data/if/` |
| Sécurité path traversal | Rejet systématique en `400` | Détection `..` ou séparateurs de chemin |
| Format d'erreur | Langue française | `{ "message": "Identifiant de script invalide." }` |

---

## Ce que ce cas ne vérifie pas

- L'affichage dans la modale UI en lecture seule → `CASE-UI-01-7` ;
- L'exécution du script avec le sac d'entrées → `CASE-DATA-02-2` ;
- La suppression du script → `CASE-SRV-02-7`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_9_get_if_script_secure_consultation`  
**Fichier :** `tests/units/srv/case-srv-02-9.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie la récupération réussie d'un script existant en 200 OK.
- [ ] Le test vérifie le rejet en 400 avec message en français pour plusieurs vecteurs de path traversal.
- [ ] Le test vérifie le retour 404 pour un script inexistant.
- [ ] Le test échoue si un chemin en dehors de `.agents/data/if/` peut être lu.
- [ ] Le nom du test contient `CASE_SRV_02_9`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
