# CASE-SRV-02-4 — Fonctionnement en local mono-utilisateur sans barrière d'authentification ni sandbox

**Spécification :** `SPEC-SRV-02`
**Critère d'acceptation :** `AC-SRV-02-4`
**Type :** acceptation
**Niveau de risque :** modéré

## Ce que ce cas protège

ClientsBox est une application locale destinée à un usage individuel mono-utilisateur sur la machine du développeur (`C-11`, `REQ-106`). En conformité avec l'ADR-001 et le CDC, le serveur HTTP ne doit imposer aucun mécanisme d'authentification (aucun cookie de session requis, aucun token JWT, aucun en-tête `Authorization` obligatoire, aucun prompt de login) ni aucune couche de sandbox artificielle empêchant l'accès direct aux API locales de l'application.

## Cas

```gherkin
Étant donné le serveur HTTP ClientsBox en cours d'exécution sur le port 2974
Quand un client HTTP effectue une requête GET sur la racine "/" ou sur les endpoints locaux
Sans fournir aucun identifiant, mot de passe, jeton Bearer ni cookie d'authentification
Alors le serveur répond avec un code HTTP 200 (OK)
Et le serveur ne renvoie aucun code HTTP 401 (Unauthorized) ni 403 (Forbidden)
Et aucune redirection vers une page de connexion (statut 301/302/307 vers "/login") n'est déclenchée
```

## Données

| Élément | Valeur |
|---|---:|
| En-têtes d'authentification fournis | `AUCUN` (pas d'`Authorization`, pas de `Cookie`) |
| Routes testées sans credentials | `GET /` (racine UI), endpoints HTTP locaux |
| Mode d'exécution | Local mono-utilisateur (`127.0.0.1` / `localhost`) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Réponse sur requête sans authentification | `200 OK` | Accès direct sans middleware d'auth bloquant (C-11, REQ-106) |
| Codes 401 / 403 reçus | `0` | Aucun rejet de sécurité mono-utilisateur |
| Redirection vers `/login` | `NON` | Pas de flux d'authentification requis |

## Ce que ce cas ne vérifie pas

- La validation du contenu des payloads métiers transmis aux API → `SPEC-DATA-01` ;
- La distribution des fichiers statiques de l'UI → `CASE-SRV-02-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_02_4_local_single_user_operation_without_auth_or_sandbox`
**Fichier :** `tests/tests-unitaires/srv/case-srv-02-4.test.ts`

## Revue du test automatisé

- [ ] Le test effectue des requêtes HTTP (notamment `GET /` et endpoints locaux) sans en-tête d'autorisation et vérifie une réponse directe `200 OK`.
- [ ] Le test vérifie qu'aucun statut HTTP 401 ou 403 n'est retourné en l'absence de credentials.
- [ ] Le test vérifie qu'aucune redirection vers une URL de login n'est opérée.
- [ ] Le test échoue si un middleware d'authentification bloquant est injecté.
- [ ] Le nom du test contient `CASE_SRV_02_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
