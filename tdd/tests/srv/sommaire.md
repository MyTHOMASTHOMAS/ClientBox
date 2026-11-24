# Sommaire des cas de test — Domaine SRV (Socle Applicatif & Serveur HTTP)

**Domaine :** `SRV`  
**Document maître des spécifications :** [`tdd/specs/SRV.md`](../../specs/SRV.md)  
**ADR d'ancrage :** [`ADR-001`](../../docs/adr/ADR-001-socle-applicatif.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v1.md` (statut §12 verrouillé)  

---

## 1. Spécifications couvertes

- [`SPEC-SRV-01`](../../specs/SRV.md#spec-srv-01--démarrage-cli-configuration-du-port-et-résolution-du-workspace) — Démarrage CLI, configuration du port, résolution du workspace et exécution directe sans UI (`REQ-001`, `REQ-002`, `REQ-005`, `REQ-006`, `REQ-044`, `R-35`, `R-48`, `C-01`, `C-02`, `C-04`, `C-07`, `REQ-102`, `REQ-108`)
- [`SPEC-SRV-02`](../../specs/SRV.md#spec-srv-02--serveur-http-local-exposition-de-lapi-et-affichage-console) — Serveur HTTP local, exposition de l'API et affichage console (`REQ-003`, `REQ-004`, `REQ-040`, `C-05`, `C-11`, `REQ-106`, `REQ-109`)

---

## 2. Tableau d'indexation des Cas de Test

| numéro | testfile | description rapide | clause / exigence spec liée |
|---|---|---|---|
| 01-1 | `CASE-SRV-01-1.md` | Démarrage du serveur sur le port par défaut 2974 en l'absence d'argument de port | `SPEC-SRV-01`, `AC-SRV-01-1`, `REQ-005`, `REQ-006`, `C-04` |
| 01-2 | `CASE-SRV-01-2.md` | Surcharge dynamique du port d'écoute via les options en ligne de commande `-p` et `--port` | `SPEC-SRV-01`, `AC-SRV-01-2`, `REQ-005`, `REQ-006` |
| 01-3 | `CASE-SRV-01-3.md` | Arrêt immédiat avec code de sortie non nul en cas de port déjà occupé (`EADDRINUSE`) ou invalide | `SPEC-SRV-01`, `AC-SRV-01-3`, `REQ-005`, `R-35` |
| 01-4 | `CASE-SRV-01-4.md` | Résolution stricte et assignation de `workspacePath` à partir du répertoire courant d'exécution `process.cwd()` | `SPEC-SRV-01`, `AC-SRV-01-4`, `REQ-001`, `REQ-002`, `C-07` |
| 01-5 | `CASE-SRV-01-5.md` | Parsing et extraction de l'argument CLI d'exécution sans UI `--exec-scene <id>` / `--exec-scene=<id>` | `SPEC-SRV-01`, `AC-SRV-01-5`, `REQ-044`, `R-48` |
| 01-6 | `CASE-SRV-01-6.md` | Exécution nominale headless d'un scénario en terminal avec streaming direct (Option B), exit code 0 et 0 port HTTP ouvert | `SPEC-SRV-01`, `AC-SRV-01-6`, `REQ-044`, `R-48` |
| 01-7 | `CASE-SRV-01-7.md` | Résilience CLI headless : scénario inexistant (exit 1), erreur d'exécution (exit 1), et interruption SIGINT (exit 130 + kill child) | `SPEC-SRV-01`, `AC-SRV-01-7`, `REQ-044`, `R-48` |
| 01-8 | `CASE-SRV-01-8.md` | Parsing et validation des options CLI de fichier d'environnement `-e <path>` et `--env <path>` | `SPEC-SRV-01`, `AC-SRV-01-8`, `REQ-046`, `R-50` |
| 01-9 | `CASE-SRV-01-9.md` | Résolution runtime de l'environnement : chargement `env/.env` résilient, arrêt fatal si -e inexistant ou variable obligatoire manquante | `SPEC-SRV-01`, `AC-SRV-01-9`, `REQ-046`, `R-50`, `ADR-022` |
| 02-1 | `CASE-SRV-02-1.md` | Distribution des fichiers statiques de l'interface utilisateur web sur la racine HTTP (`/`) | `SPEC-SRV-02`, `AC-SRV-02-1`, `REQ-003` |
| 02-2 | `CASE-SRV-02-2.md` | Impression de l'URL d'accès dans la console du terminal OS au démarrage sans ouverture automatique du navigateur | `SPEC-SRV-02`, `AC-SRV-02-2`, `REQ-004` |
| 02-3 | `CASE-SRV-02-3.md` | Arrêt gracieux du serveur HTTP avec libération effective du port sur réception de `SIGINT` ou `SIGTERM` | `SPEC-SRV-02`, `AC-SRV-02-3` |
| 02-4 | `CASE-SRV-02-4.md` | Fonctionnement en local mono-utilisateur sans barrière d'authentification ni sandbox | `SPEC-SRV-02`, `AC-SRV-02-4`, `C-11`, `REQ-106` |
| 02-5 | `CASE-SRV-02-5.md` | Cascade SIGINT/SIGTERM : libération HTTP et interruption des sous-processus CLI actifs | `SPEC-SRV-02`, `AC-SRV-02-5`, `SPEC-ADPT-03` |
| 02-6 | `CASE-SRV-02-6.md` | Extraction streaming sécurisée du corps JSON avec garde-fou mémoire (`LIB-009`) | `SPEC-SRV-02`, `AC-SRV-02-1`, `LIB-009` |
| 02-7 | `CASE-SRV-02-7.md` | Enregistrement et routage des contrôleurs REST CRUD via l'interface HttpRouter (`CTL-001`) | `SPEC-SRV-02`, `AC-SRV-02-1`, `AC-ARCH-04-1`, `CTL-001` |
| 02-8 | `CASE-SRV-02-8.md` | Contrôle d'exécution des scénarios et diffusion d'événements temps réel SSE (`CTL-002`, `CTL-003`) | `SPEC-SRV-02`, `AC-SRV-02-1`, `AC-SRV-02-5`, `CTL-002`, `CTL-003` |
| 02-9 | `CASE-SRV-02-9.md` | Consultation sécurisée de script GET /api/if/:id et rejet strict du path traversal (`CTL-001`) | `SPEC-SRV-02`, `AC-SRV-02-1`, `AC-DATA-02-1`, `CTL-001` |
| 02-10 | `CASE-SRV-02-10.md` | Validation E2E dans un navigateur réel du chargement des fichiers de configuration depuis un chemin personnalisé via `AGENTS_DIR` | `SPEC-SRV-02`, `AC-SRV-02-9`, `ADR-011` |
| 02-11 | `CASE-SRV-02-11.md` | Contrôleur d'exécution : gardes 503 / 409 (activeRunner y compris paused) et absence de clear manuel (`CTL-002`) | `SPEC-SRV-02`, `AC-SRV-02-1`, `AC-ENG-04-3`, `CTL-002` |
| 02-12 | `CASE-SRV-02-12.md` | Rupture de flux SSE et cycle de désabonnement systématique via runner.off (`CTL-003`) | `SPEC-SRV-02`, `AC-SRV-02-1`, `AC-UI-03-1`, `CTL-003` |
| 02-13 | `CASE-SRV-02-13.md` | Matrice complète de localisation en français des erreurs HTTP JSON | `SPEC-SRV-02`, `AC-SRV-02-1`, `AC-ARCH-04-3` |
| 02-14 | `CASE-SRV-02-14.md` | Validation E2E de la déconnexion client navigateur pendant un flux SSE et absence de fuite mémoire | `SPEC-SRV-02`, `AC-SRV-02-1`, `AC-UI-03-1`, `ADR-011` |
| 02-15 | `CASE-SRV-02-15.md` | Atomicité et intégrité face à des requêtes PUT concurrentes sur la même ressource via AtomicWriter | `SPEC-SRV-02`, `SPEC-DATA-04`, `AC-SRV-02-2`, `AC-DATA-04-1`, `ADR-004` |
| 02-16 | `CASE-SRV-02-16.md` | Snapshot d'exécution `GET /api/scenarios/:id/run` pour réhydratation UI (sans replay terminal) | `SPEC-SRV-02`, `SPEC-UI-03`, `AC-SRV-02-1`, `AC-UI-03-1`, `CTL-002` |
| 02-17 | `CASE-SRV-02-17.md` | `GET /api/docs` : documentation utilisateur embarquée sans lecture `public/` (`CTL-007`) | `SPEC-SRV-02`, `AC-SRV-02-10`, `ADR-017`, `ADR-012`, `CTL-007` |
| 02-18 | `CASE-SRV-02-18.md` | `POST /api/docs/export` : miroir `.agents/docs/` ou erreur FR (`CTL-007`) | `SPEC-SRV-02`, `AC-SRV-02-11`, `SPEC-DATA-05`, `ADR-017`, `CTL-007` |
| 02-19 | `CASE-SRV-02-19.md` | CallScenario : `activeScenarioId` racine, GET/SSE enfant inertes, second `POST /run` → 409 | `SPEC-SRV-02`, `AC-SRV-02-12`, `REQ-040`, `ADR-018`, `CTL-002`, `CTL-003` |
