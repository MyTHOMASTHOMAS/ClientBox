# CASE-SRV-02-7 — Enregistrement et routage des contrôleurs REST CRUD via l'interface HttpRouter

**Spécification :** `SPEC-SRV-02`, `SPEC-DATA-01..04`, `SPEC-UI-01`
**Critère d'acceptation :** `AC-SRV-02-1`, `AC-ARCH-04-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Les contrôleurs REST de ClientsBox (`CTL-001 resource.controller.ts`) doivent exposer les endpoints d'API pour toutes les ressources déclaratives (`agents`, `profils`, `prompts`, `exit`, `scenarios`, `if`, `adapters`) en dépendant exclusivement de l'interface abstraite `HttpRouter` (`TYPES-011`). Ce cas garantit le respect du découplage architectural, l'intégrité de suppression des profils (erreur 409) et la conformité des messages d'erreur en français (`REQ-007`).

## Cas

```gherkin
Étant donné une instance implémentant l'interface "HttpRouter"
Et les services "ResourceStoreService", "AgentService" et "AdapterRegistryService" injectés
Quand "registerResourceRoutes" est exécutée
Alors l'ensemble des routes CRUD REST sont enregistrées sans référence à l'implémentation concrète MiniRouter

Étant donné un client HTTP effectuant une requête "GET /api/agents"
Quand la requête est traitée par le routeur
Alors le serveur répond avec un code HTTP 200 et la liste JSON des agents existants

Étant donné un client HTTP demandant la suppression d'un profil lié à un ou plusieurs agents "DELETE /api/profils/:id"
Quand la requête est traitée
Alors le contrôleur intercepte le conflit via AgentService
Et le serveur répond avec un code HTTP 409 (Conflict) et un message explicatif en français

Étant donné un client HTTP effectuant "GET /api/adapters"
Quand la requête est traitée
Alors le serveur répond avec un code HTTP 200 et la liste des adapters opérationnels ("cursor-cli")

Étant donné une requête demandant une ressource inexistante "GET /api/prompts/inexistant"
Quand la requête est traitée
Alors le serveur répond avec un code HTTP 404 et le corps JSON '{ "message": "Ressource non trouvée." }'
```

## Données

| Élément | Valeur |
|---|---:|
| Routes Agents | `GET /api/agents`, `POST /api/agents`, `GET/PUT/DELETE /api/agents/:id` |
| Routes Profils | `GET /api/profils`, `POST /api/profils`, `GET/PUT/DELETE /api/profils/:id` |
| Routes Prompts | `GET/POST /api/prompts`, `GET/PUT/DELETE /api/prompts/:id` |
| Routes Exit | `GET/POST /api/exit`, `GET/PUT/DELETE /api/exit/:id` |
| Routes Scénarios | `GET/POST /api/scenarios`, `GET/PUT/DELETE /api/scenarios/:id` |
| Routes Scripts If | `GET /api/if`, `GET /api/if/:id` (consultation REQ-011), `DELETE /api/if/:id` |
| Route Adapters | `GET /api/adapters` |
| Code conflit suppression profil lié | `409 Conflict` (REQ-010, R-05) |
| Code ressource absente | `404 Not Found` avec `{ message: string }` en français |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut `GET /api/agents` | `200 OK` | Liste des agents sérialisée |
| Statut `DELETE /api/profils/utilise` | `409 Conflict` | Contrôle d'intégrité référentielle déclenché |
| Statut `GET /api/adapters` | `200 OK` | Contient `[{ id: 'cursor-cli', name: '...' }]` |
| Format d'erreur 404/409 | `{ message: string }` | Conformité linguistique française intégrale |

## Ce que ce cas ne vérifie pas

- L'exécution physique des scénarios et sous-processus → `CASE-SRV-02-8` ;
- La distribution des fichiers statiques UI → `CASE-SRV-02-1` ;
- Le rendu graphique du canvas → `SPEC-UI-02`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_02_7_resource_controller_rest_crud_and_integrity_routing`
**Fichier :** `tests/srv/CASE-SRV-02-7.test.ts` (ou `tests/controllers/resource.controller.test.ts`)

## Revue du test automatisé

- [ ] Le test vérifie l'enregistrement des routes contre l'interface `HttpRouter`.
- [ ] Le test vérifie les opérations CRUD sur les collections de ressources.
- [ ] Le test vérifie le retour 409 Conflict en français lors de la suppression d'un profil lié.
- [ ] Le test vérifie le retour 404 avec message en français sur ressource introuvable.
- [ ] Le test vérifie la liste des adapters retournée par `/api/adapters`.
- [ ] Le nom du test contient `CASE_SRV_02_7`.

**Relu par :** Autrement (`U`)  
**Remarques :** Spécification formelle de `CTL-001` (`signature-controllers.md`).
