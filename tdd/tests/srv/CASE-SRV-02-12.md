# CASE-SRV-02-12 — Rupture de flux SSE et cycle de désabonnement systématique via runner.off

**Spécification :** `SPEC-SRV-02`, `SPEC-UI-03`  
**Critère d'acceptation :** `AC-SRV-02-1`, `AC-UI-03-1`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-001`, `ADR-004`  

---

## Ce que ce cas protège

Le contrôleur SSE (`CTL-003 stream.controller.ts`) relaye en flux continu les chunks textuels et transitions d'état du runner vers le navigateur client via `GET /api/scenarios/:id/stream`. Pour éviter toute fuite mémoire et saturation d'écouteurs Node.js (`MaxListenersExceededWarning`), ce cas garantit que le contrôleur écoute la déconnexion client (`req.on('close')`) et appelle systématiquement `runner.off()` sur tous les canaux abonnés (`stdout`, `stderr`, `block_status`, `done`, `error`).

---

## Cas

```gherkin
Étant donné un client HTTP ouvrant la connexion SSE "GET /api/scenarios/sc-1/stream"
Et un runner actif émettant des événements sur ce scénario
Quand la connexion est établie
Alors les en-têtes "Content-Type: text/event-stream" et "Cache-Control: no-cache" sont transmis
Et le contrôleur abonne des écouteurs sur les événements du runner

Étant donné la connexion SSE active
Quand le client se déconnecte brusquement (déclenchement de l'événement "close" sur req)
Alors le contrôleur intercepte immédiatement la fermeture
Et il invoque "runner.off()" pour chaque type d'événement abonné
Et aucune fuite d'écouteur ne subsiste sur le runner
```

---

## Données

| Élément | Valeur |
|---|---:|
| Route SSE | `GET /api/scenarios/:id/stream` |
| Événements abonnés sur le runner | `stdout`, `stderr`, `block_status`, `done`, `error` |
| Signal de coupure | Événement `'close'` ou `'aborted'` sur `req` |
| Méthode de nettoyage | Invocations `runner.off(event, listener)` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Écouteurs résiduels après déconnexion | `0 écouteur` | Désabonnement systématique per CTL-003 |
| En-têtes SSE | `text/event-stream` | Format streaming conforme W3C |

---

## Ce que ce cas ne vérifie pas

- L'affichage des chunks dans le terminal web → `CASE-UI-03-1` ;
- L'arrêt forcé du processus CLI → `CASE-ADPT-03-1`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_12_sse_client_disconnect_cleanup`  
**Fichier :** `tests/units/srv/case-srv-02-12.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie que les écouteurs sont attachés à l'ouverture de la connexion SSE.
- [ ] Le test simule la fermeture de la requête (`req.emit('close')`).
- [ ] Le test vérifie que `runner.off` est appelé pour tous les écouteurs enregistrés.
- [ ] Le nom du test contient `CASE_SRV_02_12`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
