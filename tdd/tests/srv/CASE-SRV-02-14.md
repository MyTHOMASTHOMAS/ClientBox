# CASE-SRV-02-14 — Déconnexion client navigateur pendant un flux SSE et absence de fuite mémoire serveur

**Spécification :** `SPEC-SRV-02`, `SPEC-UI-03`  
**Critère d'acceptation :** `AC-SRV-02-1`, `AC-UI-03-1`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-001`, `ADR-004`, `ADR-011`  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) qu'en cas de déconnexion brutale d'un utilisateur pendant la diffusion d'un flux SSE (fermeture de l'onglet, navigation précipitée ou rechargement forcé de la page) :
1. Le serveur HTTP local intercepte la rupture de la socket TCP sans crasher ni émettre d'erreur non gérée.
2. Le contrôleur SSE exécute `runner.off()` et nettoie tous les écouteurs sur le runner.
3. Le serveur continue de répondre normalement à toutes les requêtes subséquentes sans dégradation de performance.

---

## Cas

```gherkin
Scénario : Fermeture brutale du navigateur pendant le streaming d'un scénario
  Étant donné le serveur HTTP démarré et un scénario actif produisant un streaming continu
  Et un navigateur web connecté au terminal et recevant les chunks SSE
  Quand le navigateur ferme brutalement l'onglet en cours de streaming
  Alors le serveur intercepte la déconnexion socket ('close')
  Et le runner désabonne les listeners SSE associés à cette requête
  Et le processus serveur Node.js demeure stable et actif
  Et une nouvelle requête GET sur "/" retourne immédiatement un statut 200 OK
```

---

## Données

| Élément | Valeur |
|---|---:|
| Durée minimale du scénario streamé | $\ge 2$ secondes |
| Action client Playwright | `page.close()` en plein milieu de la réception des événements SSE |
| Contrôle post-fermeture | `request.get('http://localhost:2974/api/agents')` $\to 200\text{ OK}$ |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut serveur post-déconnexion | `En vie (code 200)` | Absence de crash sur `ERR_STREAM_DESTROYED` ou socket close |
| Écouteurs résiduels | Stable | Vérification du décompte d'écouteurs d'événements |

---

## Ce que ce cas ne vérifie pas

- L'affichage scrollable dans le terminal web → `CASE-UI-03-1` ;
- L'arrêt manuel par bouton Stop → `CASE-UI-03-5`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_14_e2e_sse_client_disconnect_resilience`  
**Fichier :** `tests/e2e/srv/CASE-SRV-02-14.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test démarre un streaming SSE dans une page Playwright.
- [ ] Le test ferme brutalement la page pendant le streaming.
- [ ] Le test effectue une requête HTTP vers le serveur pour prouver sa réactivité.
- [ ] Le nom du test contient `CASE_SRV_02_14`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
