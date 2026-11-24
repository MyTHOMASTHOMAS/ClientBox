# CASE-UI-01-6 — Client HTTP et flux SSE navigateur avec normalisation des erreurs en français

**Spécification :** `SPEC-UI-01`, `SPEC-UI-03`  
**Critère d'acceptation :** `AC-UI-01-1`, `AC-UI-03-1`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-001`, `ADR-012`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Le client réseau navigateur (`UI-002 api/client.ts`) et le client SSE dédié (`UI-003 api/sse.client.ts`) fournissent l'implémentation opérationnelle consommant les API natives `fetch` et `EventSource`. Ce cas garantit :
1. La bonne transmission des méthodes HTTP (`GET`, `POST`, `PUT`, `DELETE`) avec sérialisation JSON automatique et injection dans les composants/hooks Preact (`ADR-013`).
2. L'interception et la normalisation centralisée des erreurs réseau et statuts d'erreur HTTP avec libellés en langue française (`REQ-007`, `UI-004 i18n/fr.i18n.ts`).
3. L'ouverture et la fermeture propre des flux Server-Sent Events sur la route canonique `GET /api/scenarios/:id/stream` (`ADR-013`), avec fonction de nettoyage `unsubscribe()` exécutable au démontage du composant Preact (`useEffect` cleanup via le hook `UI-010 use-execution-stream.hook.ts`).

---

## Cas

```gherkin
Étant donné la fabrique "createHttpClient()" initialisée dans un environnement navigateur
Quand un appel "client.get('/api/agents')" est exécuté avec succès
Alors les données JSON typées sont désérialisées et retournées

Étant donné un appel réseau qui échoue (ex: serveur indisponible ou erreur 503)
Quand la promesse est rejetée
Alors l'erreur levée est une instance d'erreur normalisée
Et le message d'erreur est rédigé en français (ex: "Service indisponible. Veuillez réessayer ultérieurement.")

Étant donné un abonnement au flux SSE via "client.subscribeStream('/api/scenarios/:id/stream', callbacks)"
Quand des événements textuels ("data: ...") sont reçus
Alors les callbacks "onStdout", "onStderr", "onBlockStatus" sont déclenchés
Et l'appel à la fonction d'annulation "unsubscribe()" ferme immédiatement l'instance EventSource
```

---

## Données

| Élément | Valeur |
|---|---:|
| Modules testés | `api/client.ts` (`UI-002`), `api/sse.client.ts` (`UI-003`) |
| API natives utilisées | `window.fetch`, `window.EventSource` |
| Normalisation d'erreurs | 400 $\to$ "Données invalides.", 404 $\to$ "Ressource introuvable.", 503 $\to$ "Service indisponible." |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Normalisation erreurs réseau | 100% en français | Centralisation dans `http.client.ts` et `sse.client.ts` |
| Fermeture SSE | `EventSource.close()` | Vérification de fermeture effective |

---

## Ce que ce cas ne vérifie pas

- L'affichage graphique dans le terminal → `CASE-UI-03-1` ;
- Le serveur backend → `CASE-SRV-02-1`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_01_6_browser_http_client_implementation`  
**Fichier :** `tests/units/ui/case-ui-01-6.test.ts`  

## Revue du test automatisé

- [ ] Le test mocke `fetch` et vérifie la sérialisation JSON.
- [ ] Le test vérifie la normalisation en français des codes 404 et 500.
- [ ] Le test mocke `EventSource` sur la route canonique `GET /api/scenarios/:id/stream` et valide le nettoyage (`unsubscribe`/`useEffect`).
- [ ] Le nom du test contient `CASE_UI_01_6`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
