# CASE-SRV-02-8 — Contrôle d'exécution des scénarios et diffusion d'événements temps réel SSE

**Spécification :** `SPEC-SRV-02`, `SPEC-ADPT-03`, `SPEC-UI-02..03`
**Critère d'acceptation :** `AC-SRV-02-1`, `AC-SRV-02-5`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Les contrôleurs d'exécution et de streaming de ClientsBox (`CTL-002 execution.controller.ts` et `CTL-003 stream.controller.ts`) doivent exposer les points d'entrée de lancement (`POST /api/scenarios/:id/run`), d'arrêt d'urgence (`DELETE /api/scenarios/:id/run`) et de diffusion temps réel unidirectionnelle Server-Sent Events (`GET /api/scenarios/:id/stream`). Ce cas protège l'orchestration découplée via le holder de runner et la robustesse de la connexion SSE sans rétention de buffer persistant (R-26).

## Cas

```gherkin
Étant donné un client HTTP effectuant "POST /api/scenarios/:id/run"
Quand la requête est reçue
Alors le contrôleur instancie un nouveau ScenarioRunnerService via le holder injecté
Et le scénario démarre son exécution
Et le serveur répond avec un code HTTP 200 (ou 202)

Étant donné un scénario en cours d'exécution
Quand un client HTTP effectue "DELETE /api/scenarios/:id/run"
Alors le contrôleur transmet immédiatement l'arrêt au runner actif via sa méthode "stop()"
Et le serveur répond avec un code HTTP 200

Étant donné un client HTTP établissant la connexion "GET /api/scenarios/:id/stream"
Quand la requête est engagée
Alors le serveur positionne les en-têtes "Content-Type: text/event-stream" et "Cache-Control: no-cache"
Et chaque changement d'état ou chunk de texte du runner actif est diffusé sous forme de ligne SSE "data: {...}\n\n"
Et la fermeture de la connexion par le client désabonne proprement les écouteurs sans fuite mémoire
```

## Données

| Élément | Valeur |
|---|---:|
| Route de lancement | `POST /api/scenarios/:id/run` |
| Route d'arrêt d'urgence | `DELETE /api/scenarios/:id/run` |
| Route SSE streaming | `GET /api/scenarios/:id/stream` (R-26, REQ-003) |
| En-têtes HTTP SSE | `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut `POST /run` | `200 OK` | Instanciation et démarrage du runner |
| Statut `DELETE /run` | `200 OK` | Invocation `stop()` sur le runner actif |
| Format trame SSE | `data: {"type":...}\n\n` | Protocole Server-Sent Events standard |
| Persistance des chunks SSE sur disque | `0 octet écrit` | Volatilité totale du flux (R-26, R-37) |

## Ce que ce cas ne vérifie pas

- L'algorithme interne de Join et d'évaluation des blocs → `SPEC-ENG-02` ;
- Le rendering du terminal dans l'UI web → `SPEC-UI-03` ;
- Les routes REST CRUD déclaratives → `CASE-SRV-02-7` ;
- Les gardes 503 / 409 et l'unicité d'exécution → `CASE-SRV-02-11` ;
- Le snapshot `GET /api/scenarios/:id/run` (réhydratation) → `CASE-SRV-02-16`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_02_8_execution_and_sse_streaming_controllers_integration`
**Fichier :** `tests/srv/CASE-SRV-02-8.test.ts` (ou `tests/controllers/execution-and-stream.test.ts`)

## Revue du test automatisé

- [ ] Le test vérifie le démarrage et l'arrêt d'un runner via `POST/DELETE /api/scenarios/:id/run`.
- [ ] Le test vérifie la mise en place des headers SSE et le formatage des événements.
- [ ] Le test vérifie le désabonnement propre lors de la déconnexion client.
- [ ] Le nom du test contient `CASE_SRV_02_8`.

**Relu par :** Autrement (`U`)  
**Remarques :** Spécification formelle de `CTL-002` et `CTL-003` (`signature-controllers.md`).
