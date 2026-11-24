# ADR-020 — Exécution directe de scénarios en ligne de commande (CLI Headless) sans socket HTTP

**Statut :** proposé  
**Date :** 16/11/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- une **ADR** enregistre une décision prise.

---

## Ancrage CDC (requis / complété)

| CDC | Rôle |
|---|---|
| REQ-044, R-48 | Exécution directe d'un scénario en CLI sans démarrer l'IHM web ni ouvrir de port réseau |
| REQ-001, REQ-002, REQ-006 | Résolution du workspace (`workspacePath = process.cwd()`), initialisation de l'arborescence `.agents/` |
| REQ-005, R-35 | Gestion du port HTTP : désactivée en mode headless (aucun socket ouvert) |
| REQ-024, REQ-025, REQ-026 | Cycle d'exécution du runner, streaming des chunks, arrêt immédiat sur échec de bloc |
| REQ-042, REQ-043, ADR-018, ADR-019 | Prise en charge transparente de tous les types de blocs (Run, If, ClearContext, CallScenario, Command) |
| CR-002, CDC v2.2 | Mode terminal direct Option B, streaming console natif avec balisage ClientsBox |

Cet ADR **complète** [`ADR-001`](./ADR-001-socle-applicatif.md) et [`ADR-004`](./ADR-004-moteur-blocs.md) : il définit comment ClientsBox bascule de son mode standard (serveur HTTP + IHM web) à un mode d'exécution purement terminal pour l'automatisation et les pipelines CI/CD.

---

## Contexte

ClientsBox a été conçu initialement comme un serveur HTTP local servant une IHM Web réactive Preact pour concevoir et superviser des scénarios d'orchestration (`ADR-001`, `ADR-013`).

Cependant, dans des cas d'usage avancés (pipelines d'intégration continue, tâches planifiées cron, scripting shell, validation rapide), l'utilisateur a exprimé le besoin fort (`CR-002`, `REQ-044`, `R-48`) de pouvoir exécuter un scénario directement dans le terminal en tapant :
```bash
node clientsbox.js --exec-scene <nom_ou_id_du_scenario>
```
Ce mode doit :
1. **Éviter tout serveur HTTP :** n'ouvrir aucun socket TCP (`0.0.0.0` ou `localhost`), supprimant tout risque de conflit de port (`EADDRINUSE`) en environnement de test ou conteneurisé.
2. **Restituer le flux en direct :** streamer les sorties standard et d'erreur (`stdout`/`stderr`) directement dans le terminal hôte avec un balisage clair des étapes (Option B retenue lors de l'interview CR-002).
3. **Fournir des codes de sortie déterministes :** retourner un code `0` en cas de succès, `1` en cas d'échec ou d'erreur de résolution, et `130` en cas d'interruption par signal `SIGINT` (Ctrl+C).
4. **Assurer le nettoyage des processus enfants :** garantir qu'aucune commande ou agent CLI enfant ne devienne orphelin en cas d'interruption prématurée.

---

## Options envisagées

### Option A — Démarrage d'un serveur HTTP éphémère (port 0) et pilotage interne via HTTP

| | |
|---|---|
| Ce qu'elle apporte | Réutilisation directe de l'existant serveur HTTP sans nouveau point d'entrée |
| Ce qu'elle coûte | Ouverture inutile de sockets réseau (potentiels blocages pare-feu/sandbox) ; latence de démarrage ; complexité de tuyauterie pour écouter les Server-Sent Events en interne |
| Ce qu'elle rend difficile plus tard | Déterminisme strict en CI/CD ; élimination totale des dépendances réseau |

### Option B — Exécution in-process directe du `ScenarioRunnerService` avec streaming console natif (Retenue)

| | |
|---|---|
| Ce qu'elle apporte | Zéro socket TCP ouvert ; démarrage quasi instantané ; streaming direct sans surcharge HTTP ; gestion unifiée des codes de sortie shell (`0`, `1`, `130`) ; contrôle parfait du cycle de vie des sous-processus |
| Ce qu'elle coûte | Un embranchement logique dans `index.ts` / point d'entrée pour aiguiller vers l'exécuteur headless |
| Ce qu'elle rend difficile plus tard | Rien : la logique d'orchestration (`ScenarioRunnerService`) est déjà modulaire et agnostique du transport HTTP |

### Option C — Mode hybride avec socket Unix local (Domain Socket)

| | |
|---|---|
| Ce qu'elle apporte | Pas de port TCP exposé |
| Ce qu'elle coûte | Problèmes récurrents de portabilité cross-platform (notamment sous Windows) ; sur-ingénierie manifeste pour un besoin d'exécution terminal séquentielle |
| Ce qu'elle rend difficile plus tard | Maintenance de chemins de socket temporaires et nettoyage lors de crashs brutaux |

---

## Décision

1. **Aiguillage au démarrage (`ROOT-001`) :**
   - L'argument `--exec-scene <valeur>` ou `--exec-scene=<valeur>` est parsé dès l'analyse des arguments CLI (`process.argv`).
   - S'il est présent, ClientsBox active immédiatement le mode **CLI Headless** et **n'appelle jamais `server.listen()`**. Aucun port TCP n'est lié.

2. **Résolution du scénario cible :**
   - Le paramètre `<valeur>` est recherché en priorité comme identifiant exact (`scenario.id === valeur`), puis comme correspondance insensible à la casse sur le libellé (`scenario.name.toLowerCase() === valeur.toLowerCase()`).
   - Si aucun scénario ne correspond, un message d'erreur explicite en français est émis sur `stderr` et le processus quitte immédiatement avec le **code de sortie 1**.

3. **Restitution des flux (Option B retenue au CR-002) :**
   - Les chunks de sortie textuelle émis par les agents CLI ou les blocs `Command` sont dirigés en continu et en temps réel vers les flux standard de l'OS (`process.stdout.write` / `process.stderr.write`).
   - L'exécution est encadrée par des balises de cycle de vie explicites préfixées par `[ClientsBox]` et `[Bloc: <id>]` :
     - `[ClientsBox] Démarrage du scénario "<nom>" (<id>)...`
     - `[Bloc: <id>] Début d'exécution (<type>)`
     - `[Bloc: <id>] Terminé avec succès (power: 1)`
     - `[ClientsBox] Exécution terminée avec succès.`
     - En cas d'erreur : `[ClientsBox] Échec de l'exécution du scénario : <motif>` sur `stderr`.

4. **Codes de sortie OS normalisés :**
   - **`0`** : Le scénario s'est exécuté jusqu'à son terme nominal avec succès.
   - **`1`** : Scénario introuvable, fichier invalide, ou interruption suite à l'échec d'un bloc (`status: 'error'`).
   - **`130`** : Interruption utilisateur via `SIGINT` (Ctrl+C), conforme aux conventions POSIX.

5. **Interruption et sécurité des sous-processus :**
   - En cas de signal `SIGINT` ou `SIGTERM`, le runner invoque immédiatement l'arrêt d'urgence (`stop()`) et tue en cascade tous les processus actifs enregistrés dans `runner-active-processes`.
   - Aucun processus zombie orphelin n'est laissé en arrière-plan.

---

## Raisons

- **Élimination des collisions de ports en CI/CD :** Les environnements de build concurrents et les conteneurs souffrent fréquemment d'erreurs `EADDRINUSE`. En garantissant 0 socket ouvert, l'exécution est garantie d'être reproductible et isolée.
- **Réutilisation directe du socle existant :** Le moteur `ScenarioRunnerService` est nativement découplé du protocole HTTP. Il s'exécute de la même manière qu'il soit invoqué par un contrôleur REST ou par le CLI direct.
- **Conformité aux standards shell :** L'émission directe sur `stdout`/`stderr` avec des codes de sortie déterministes permet d'intégrer immédiatement ClientsBox dans des scripts Bash, PowerShell ou des Makefiles (`node clientsbox.js --exec-scene mon-test && echo "Succès"`).

---

## Conséquences acceptées

- En mode `--exec-scene`, aucune interface web n'est accessible simultanément pour observer le graphe (comportement explicitement souhaité).
- Le balisage console Option B ajoute quelques lignes de cadrage textuel autour du flux brut des agents, ce qui rend la lecture humaine plus confortable au détriment d'une sortie 100% silencieuse.

---

## Ce qui nous ferait revenir dessus

- Une demande ultérieure d'ajouter un drapeau `--json` pour formater la sortie console sous forme d'événements JSON Lines parsables par des machines (ceci ferait l'objet d'un drapeau additionnel sans remettre en cause l'architecture headless sans socket).
