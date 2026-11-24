# ADR-019 — Bloc Command : exécution shell OS, cycle de vie et tracking d'arrêt

**Statut :** proposé  
**Date :** 13/11/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC (requis / complété)

| CDC | Rôle |
|---|---|
| R-47, REQ-042, REQ-043 | Contrat Command, paramètre statique `commandLine`, `cwd = workspacePath`, streaming live |
| R-25, REQ-026 | Échec bloc (code de sortie ≠ 0 ou commande invalide) ⇒ arrêt global du scénario racine |
| R-34, REQ-025 | Stop racine ⇒ interruption immédiate (kill) du process Command |
| REQ-006 | Répertoire de travail : `workspacePath` (cwd de démarrage) |
| REQ-024, REQ-110, R-26, R-37 | Chunks stdout/stderr relayés en live, non persistés sous `.agents/data/` |
| R-08, R-09, R-42*, R-42d | Modèle de bloc de base, join/power 1..N in / 0..N out, sac non lu |
| CDC v2.1 | Typologie étendue à 6 blocs ; Annexe B.4 Command ; messages D.2 |

Cet ADR **complète** [`ADR-004`](./ADR-004-moteur-blocs.md) : le moteur événementiel par graphe reste le socle d'orchestration ; ici on fige **comment** le moteur exécute une commande système arbitraire sans passer par un adapter d'agent CLI, comment le processus est tracké pour le Stop d'urgence, et comment ses flux sont restitués.

---

## Contexte

ClientsBox permettait jusqu'ici d'exécuter des requêtes vers des agents CLI via des adapters dédiés (`Run`), d'évaluer des conditions (`If`), de réinitialiser la mémoire (`ClearContext`), et d'appeler un sous-scénario (`CallScenario`, ADR-018).

Le besoin utilisateur pour le CDC v2.1 inclut la capacité d'exécuter directement des **commandes système OS** dans le workspace (ex. `npm test`, scripts de build, commandes git, utilitaires shell) au sein du même graphe de scénario :
- sans devoir créer un faux agent ou un faux profil CLI ;
- en attendant la fin de la commande avant d'émettre la suite du graphe (`power: 1`) ;
- en stoppant tout le scénario si la commande échoue (`exitCode !== 0`) ;
- en visualisant les sorties en direct dans le terminal de l'IHM ;
- en garantissant que le bouton d'arrêt d'urgence (**Stop**) interrompt immédiatement le processus système lancé.

Il faut statuer sur la façon dont cette exécution s'articule avec l'architecture runner, le tracking des processus et les adapters existants.

---

## Options envisagées

### Option A — Bloc spécialisé natif hors `CLIAdapter`, réutilisation de `runner-active-processes` (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Découplage complet vis-à-vis des agents CLI ; réutilisation du registre de processus existant pour le Stop ; respect strict du contrat join/power ; flux live naturel |
| Ce qu'elle coûte | Un exécuteur de bloc dédié dans le runner ; gestion des particularités shell selon l'OS |
| Ce qu'elle rend difficile plus tard | Interception sémantique de structured output (volontairement hors scope V1) |

### Option B — Créer un pseudo-adapter agent « shell / bash »

| | |
|---|---|
| Ce qu'elle apporte | Réutilisation de la plomberie du bloc Run |
| Ce qu'elle coûte | Pollution du modèle conceptuel (agents, profils, prompts, sessions factices créés pour lancer un `npm run build`) ; violation du modèle de données de nœud |
| Ce qu'elle rend difficile plus tard | Distinction claire dans l'IHM entre un agent cognitif et un utilitaire shell |

### Option C — Exécution synchrone bloquante via `execSync`

| | |
|---|---|
| Ce qu'elle apporte | Code très court |
| Ce qu'elle coûte | Bloque la boucle d'événements Node.js ; impossible de streamer les chunks en SSE ; impossible d'interrompre via Stop |
| Ce qu'elle rend difficile plus tard | Viole fondamentalement REQ-024, REQ-025 et R-34 |

---

## Décision

1. **Typologie :** `command` constitue le **6ᵉ type de nœud** reconnu par ClientsBox (`NodeType = 'command'`, `BlockType = 'command'`).
2. **Paramètre statique :** le bloc possède l'unique paramètre statique **`commandLine`** (string non vide après trim). Aucun champ `agentId`, `promptId`, `exitId` ou `targetScenarioId` n'est autorisé ni persisté.
3. **Indépendance des adapters :** l'exécution est prise en charge directement par le runner (via un exécuteur spécialisé), **sans recourir à `CLIAdapter`** ni à la gestion des sessions d'agents.
4. **Environnement d'exécution :**
   - Le spawn est réalisé en mode shell hôte (`child_process.spawn(..., { shell: true })`).
   - Le répertoire de travail est obligatoirement **`cwd = workspacePath`** (`REQ-006`, `REQ-043`).
   - L'environnement hérite de `process.env` de l'hôte (aucun dictionnaire d'env custom en V1).
5. **Cycle de vie et tracking Stop :**
   - Dès le spawn, le handle du processus enfant est inscrit dans le registre partagé **`runner-active-processes`** de l'exécution (`REQ-025`, `R-34`).
   - L'action Stop racine tue immédiatement le processus via le signal approprié et retire le handle.
6. **Streaming & Terminal live :**
   - Les tronçons reçus sur `stdout` et `stderr` sont immédiatement propagés via le callback `chunkReceived` du runner racine pour affichage temps réel dans le terminal web via SSE (`REQ-024`, `REQ-110`).
   - Aucune trace d'exécution n'est persistée sur disque (`R-37`, `REQ-111`).
7. **Condition de terminaison :**
   - Le runner attend l'événement `close` / `exit` du processus.
   - Si `exitCode === 0` : succès nominal. Le bloc émet `{ blockType: 'command', value: null, power: 1 }` sur chacune de ses $0..N$ sorties câblées (`REQ-042`).
   - Si `exitCode !== 0` ou si `commandLine` est invalide : échec immédiat du bloc (`failBlock`), déclenchant l'arrêt global d'urgence du scénario racine (`R-25`, `REQ-026`).

---

## Raisons

- L'Option A maintient la séparation claire entre les agents cognitifs (wrappers CLI avec mémoire conversationnelle, profils et prompts) et les commandes système déterministes.
- Le raccordement au registre `runner-active-processes` garantit le respect de la règle d'arrêt d'urgence `R-34` sans créer de plomberie d'interruption parallèle.
- La sémantique power-only (`value: null`, `power: 1`) s'insère parfaitement dans le modèle de calcul de join et de saturation défini par `ADR-004`.

---

## Conséquences acceptées

- Pas de capture de `stdout` comme `value` métier vers le sac d'entrées aval en V1 (conforme à R-47 : le sac n'est pas alimenté en texte, seule la complétion power est propagée).
- L'interprétation shell dépend de l'OS hôte (Windows vs POSIX) ; aucune normalisation cross-OS de la ligne de commande n'est effectuée par ClientsBox.
- Tout code de sortie non nul interrompt le scénario sans tolérance (« mode ignore-exit » exclu en V1).

---

## Ce qui nous ferait revenir dessus

- Besoin utilisateur avéré d'injecter la sortie textuelle d'un script shell dans le prompt d'un bloc Run ultérieur (introduction d'un payload `value` non nul).
- Besoin d'isolation forte (sandbox type conteneur ou VM).
- Configuration avancée par bloc de timeouts ou de variables d'environnement dédiées.

---

## Liens

- Amont : [`cahier-des-charges-v2.1.md`](../cdc/cahier-des-charges-v2.1.md) (`R-47`, `REQ-042`, `REQ-043`)
- Amont : [`impact-CR-008-call-scenario-block.md`](../impact/impact-CR-008-call-scenario-block.md)
- Socle : [`ADR-004-moteur-blocs.md`](./ADR-004-moteur-blocs.md)
- Specs associées : [`SPEC-ENG-03`](../../specs/ENG.md), [`SPEC-ENG-04`](../../specs/ENG.md), [`SPEC-DATA-03`](../../specs/DATA.md), [`SPEC-UI-02`](../../specs/UI.md), [`SPEC-UI-03`](../../specs/UI.md)
