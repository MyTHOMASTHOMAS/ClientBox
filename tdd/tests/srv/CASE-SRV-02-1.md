# CASE-SRV-02-1 — Distribution des fichiers statiques de l'interface utilisateur web sur la racine HTTP

**Spécification :** `SPEC-SRV-02`
**Critère d'acceptation :** `AC-SRV-02-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le serveur HTTP local embarqué doit distribuer les fichiers statiques de l'interface utilisateur web (HTML, JavaScript, CSS, assets) sur la racine web (`/`) et répondre avec un code `200 OK` et les bons types MIME (`REQ-003`). Si le service des fichiers statiques était défaillant ou non routé, le navigateur web ne pourrait pas charger l'IHM de ClientsBox et afficherait une page blanche ou une erreur 404.

## Cas

```gherkin
Scénario : Distribution des assets embarqués en mémoire (mode autonome)
  Étant donné le serveur HTTP local démarré
  Quand un client HTTP effectue une requête GET sur "/"
  Alors le serveur répond avec un code HTTP 200 (OK)
  Et l'en-tête "Content-Type" indique "text/html; charset=utf-8"
  Et le corps de la réponse contient l'UI HTML embarquée de ClientsBox

Scénario : Distribution d'un asset statique CSS ou JS
  Étant donné le serveur HTTP en écoute
  Quand un client HTTP demande un asset statique existant (ex. "/assets/app.js" ou "/styles/app.css")
  Alors le serveur répond avec un code HTTP 200
  Et l'en-tête "Content-Type" est adapté au type de fichier ("application/javascript" ou "text/css")

Scénario : Gestion d'une ressource inconnue
  Étant donné le serveur HTTP en écoute
  Quand un client HTTP effectue une requête GET sur une ressource inexistante "/inexistant.xyz"
  Alors le serveur répond avec un code HTTP 404 (Not Found) sans planter le processus
```

## Données

| Élément | Valeur |
|---|---:|
| Route racine | `GET /` |
| Route asset JS | `GET /assets/app.js` (ou bundle équivalent) |
| Route inexistante | `GET /inexistant.xyz` |
| Headers de contenu attendus | `text/html; charset=utf-8`, `application/javascript`, `text/css` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Code HTTP pour `GET /` | `200` | Livraison de l'index HTML de l'IHM (REQ-003) |
| Code HTTP pour asset valide | `200` | Livraison du fichier binaire ou texte statique |
| Code HTTP pour ressource inconnue | `404` | Gestion d'erreur standard sans crash |
| Processus serveur après requête 404 | `EN VIE / STABLE` | Résilience aux erreurs de routage HTTP |

## Ce que ce cas ne vérifie pas

- L'affichage de l'URL dans la console OS → `CASE-SRV-02-2` ;
- Le rendu graphique et fonctionnel du DOM dans le navigateur → `SPEC-UI-01` et `SPEC-UI-02` ;
- L'arrêt gracieux du serveur → `CASE-SRV-02-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_02_1_static_ui_files_distribution_on_http_root`
**Fichier :** `tests/tests-unitaires/srv/case-srv-02-1.test.ts`

## Revue du test automatisé

- [ ] Le test effectue une requête HTTP `GET /` et valide la réception d'un statut 200 avec `Content-Type: text/html`.
- [ ] Le test valide le service d'un fichier statique JS/CSS avec son type MIME approprié.
- [ ] Le test vérifie qu'une requête sur un fichier inexistant renvoie une réponse 404.
- [ ] Le test vérifie que le serveur continue à répondre normalement après une réponse 404.
- [ ] Le nom du test contient `CASE_SRV_02_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
