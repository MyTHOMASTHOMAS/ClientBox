# Spécifications — Moteur de Blocs, Join & Ordonnancement

**Domaine :** `ENG`  
**Document maître :** `tdd/specs/sommaire.md`  
**ADR d'ancrage :** [`ADR-004`](../docs/adr/ADR-004-moteur-blocs.md), [`ADR-018`](../docs/adr/ADR-018-call-scenario-sous-runner.md), [`ADR-019`](../docs/adr/ADR-019-bloc-command.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v2.3.md` (CR-012 prompt `exit`, CR-008 CallScenario + Command ; bases v1..v2.2 intactes)  

---

## SPEC-ENG-01 — Messages inter-blocs et sac d'entrées

**Exigences :** `REQ-033`, `REQ-034`, `R-10`, `R-11`, `R-44`, `C-10`, `C-14`, `REQ-105`, `Annexe B.2`, `D.2`  
**Statut :** proposé  
**Version :** v1.2 (2026-11-13, CR-008 — `blockType` `callScenario` + `command`)  

### Règle

> Un message émis par un port de sortie est un objet `BlockMessage` : `{ blockType: string, value: unknown, power: number }`.
> Les ports de sortie n'ont aucune clé (`R-10`, `R-44`, `D.2`).
> Sur chaque port d'entrée câblé d'un bloc, le message reçu est stocké dans le sac d'entrées associé à sa clé d'entrée (`key`) : `BlockInputBag = Record<string, BlockMessage>` (`R-11`, `C-10`).
> Les schémas `value` des payloads sont déterminés par le type de bloc émetteur (Run : texte de sortie CLI ; Start / ClearContext / **CallScenario** / **Command** : `null`).
> Les `blockType` v2.1 incluent `'start' | 'run' | 'if' | 'clearContext' | 'callScenario' | 'command'` (`D.2`, CDC v2.1).

### Portée

- Couvre la structure et le typage TypeScript des interfaces `BlockMessage` et `BlockInputBag`.
- Couvre la transmission des messages sans clé depuis les sorties vers les entrées portant une clé.
- Couvre la constitution du sac d'entrées complet sur chaque bloc cible.
- Ne couvre pas la logique de join et calcul de puissance → `SPEC-ENG-02`.
- Ne couvre pas l'évaluation du sac par le bloc If → `SPEC-DATA-02` et `SPEC-ENG-03`.

### Scénarios nominaux

```gherkin
Scénario : Émission d'un message sans clé par un bloc Run
  Étant donné un bloc Run ayant produit la sortie textuelle "Build terminé avec succès"
  Quand le bloc termine son exécution avec succès
  Alors il émet sur chacun de ses ports de sortie le message "{ blockType: 'run', value: 'Build terminé avec succès', power: 1 }"
  Et le message émis ne contient aucun champ "key"

Scénario : Réception et constitution du sac d'entrées multi-ports
  Étant donné un bloc cible avec deux entrées câblées portant les clés "sourceA" et "sourceB"
  Quand un message "msgA" est reçu sur "sourceA" et un message "msgB" sur "sourceB"
  Alors le sac d'entrées du bloc est exactement "{ sourceA: msgA, sourceB: msgB }"
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Port d'entrée non câblé sur un bloc | La clé correspondante n'apparaît pas dans le sac d'entrées `BlockInputBag`. |
| 2 | Valeur de `power` différente de 0 ou 1 (ex. nombre négatif ou flottant) | Normalisation stricte ou rejet à l'émission : seuls les niveaux d'énergie 0 et 1 sont manipulés par le moteur. |
| 3 | Payload `value` contenant des caractères spéciaux ou des retours à la ligne | Préservation intégrale du contenu sans altération ni échappement parasite. |

### Ce qui n'est pas défini

- *2026-09-22* — Schémas de métadonnées additionnelles dans `BlockMessage` : seuls `blockType`, `value` et `power` font partie du contrat v1.

### Critères d'acceptation

- [ ] `AC-ENG-01-1` — Tout message émis par un port de sortie respecte la structure `BlockMessage` `{ blockType, value, power }` sans champ `key` (`CASE-ENG-01-1`).
- [ ] `AC-ENG-01-2` — Le sac d'entrées `BlockInputBag` d'un bloc indexe fidèlement chaque message reçu par sa clé d'entrée (`CASE-ENG-01-2`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Confirmer l'absence de clé sur les sorties de blocs | Acceptée | Conforme au CDC §8 R-10, R-44 et Annexe D.2. |

---

## SPEC-ENG-02 — Algorithme de Join, calcul de Power, Pause et règle N=0

**Exigences :** `REQ-017`, `REQ-037`, `R-42`, `R-42b`, `R-42c`, `R-42d`, `C-15`, `Annexe B.3`  
**Statut :** proposé  
**Version :** v1 (2026-09-22)  

### Règle

> Pour tout bloc d'un scénario ayant $N$ connexions d'entrées câblées :
> 1. **Règle $N = 0$ (hors Start) :** le bloc ne démarre jamais et n'émet aucun message ni power en sortie (`R-42d`).
> 2. **Règle $N \ge 1$ :** le moteur attend la réception d'un message sur chacune des $N$ entrées câblées (y compris les messages avec `power: 0`).
> 3. **Déclenchement du Join :** dès que les $N$ messages sont reçus, si $\sum power === N$, le bloc est immédiatement déclenché (`C-15`, `R-42`).
> 4. **Mise en Pause :** si $\sum power < N$, le bloc bascule en état **pause** dans l'attente d'une mise à jour ultérieure de l'une de ses entrées (`R-42b`).
> **Exception Start :** le bloc Start possède 0 entrée et se déclenche immédiatement au lancement du scénario (`R-42c`, `REQ-015`).

### Portée

- Couvre l'évaluation des conditions d'activation pour tous les blocs du graphe.
- Couvre le calcul de la somme des puissances reçues $\sum power$.
- Couvre la transition d'état vers la pause lorsque $\sum power < N$.
- Couvre la réévaluation du join en cas de mise à jour d'un message d'entrée pendant la pause.
- Couvre l'inactivation absolue des blocs orphelins ($N = 0$ hors Start).
- Ne couvre pas la manipulation graphique de la pause dans l'IHM → `SPEC-UI-02`.
- Ne couvre pas l'interruption par signal Stop → `SPEC-ADPT-03`.

### Scénarios nominaux

```gherkin
Scénario : Activation nominale d'un bloc avec join complet (N=2, sum=2)
  Étant donné un bloc ayant 2 entrées câblées
  Quand il reçoit un message avec power 1 sur l'entrée 0
  Et reçoit un message avec power 1 sur l'entrée 1
  Alors la condition sum(power) === 2 est vérifiée
  Et le bloc est immédiatement exécuté

Scénario : Mise en pause d'un bloc en cas de puissance insuffisante (N=2, sum=1)
  Étant donné un bloc ayant 2 entrées câblées
  Quand il reçoit un message avec power 1 sur l'entrée 0
  Et reçoit un message avec power 0 sur l'entrée 1
  Alors la somme des puissances est 1 (inférieure à 2)
  Et le bloc bascule en état "pause" sans exécuter son traitement

Scénario : Déblocage d'un état de pause suite à une mise à jour d'entrée
  Étant donné un bloc en état "pause" avec une entrée à power 0
  Quand l'entrée à power 0 reçoit un nouveau message avec power 1
  Alors la somme des puissances devient égale à N
  Et le bloc quitte l'état pause pour démarrer son exécution
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Bloc Run, If, ClearContext, CallScenario ou Command ayant 0 entrée câblée ($N = 0$) | Le bloc reste inactif en permanence ; aucune émission ni power n'est propagé sur ses sorties (`R-42d`). |
| 2 | Bloc en état de pause recevant un ordre de Stop manuel | Interruption immédiate du scénario, libération des ressources (`R-34`). |
| 3 | Bloc à 1 seule entrée ($N = 1$) recevant un message avec `power: 0` | $\sum power = 0 < 1$ $\rightarrow$ le bloc bascule en état de pause. |
| 4 | Bloc à 1 seule entrée ($N = 1$) recevant un message avec `power: 1` | $\sum power = 1 === 1$ $\rightarrow$ exécution immédiate. |

### Ce qui n'est pas défini

- *2026-09-22* — Timeout automatique de déblocage de pause : aucun timeout automatique n'est imposé en v1 ; un bloc peut rester en pause indéfiniment jusqu'à mise à jour ou Stop manuel.

### Critères d'acceptation

- [ ] `AC-ENG-02-1` — Un bloc à $N \ge 1$ entrées est exécuté si et seulement si les $N$ messages sont reçus et $\sum power === N$ (`CASE-ENG-02-1`).
- [ ] `AC-ENG-02-2` — Tout bloc dont la somme des puissances reçues est strictement inférieure à $N$ bascule en état de pause (`CASE-ENG-02-2`).
- [ ] `AC-ENG-02-3` — Tout bloc à $N = 0$ entrée (hors Start) ne s'exécute jamais et n'émet aucun message (`CASE-ENG-02-3`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier que les messages à power 0 participent au compte des N messages reçus | Acceptée | Conforme au CDC §8 R-42 et Annexe B.3. |
| Synchronisation asynchrone des tests du Join, de la Pause et des orphelins (`AC-ENG-02-1`, `AC-ENG-02-2`, `AC-ENG-02-3`) | Précisée | Purge déterministe des files de microtâches/promesses (`flushPromises`) pour éliminer toute condition de course sur les transitions d'état et triggers résiduels (ADR-006). |

---

## SPEC-ENG-03 — Comportement des 6 types de blocs spécialisés

**Exigences :** `REQ-015`, `REQ-016`, `REQ-018`, `REQ-019`, `REQ-020`, `REQ-038`, `REQ-039`, `REQ-040`, `REQ-041`, `REQ-042`, `REQ-043`, `R-08`, `R-09`, `R-10b`, `R-12`, `R-13`, `R-14`, `R-15`, `R-19`, `R-20`, `R-21`, `R-22`, `R-39`, `R-46`, `R-47`, `C-10`, `Annexe B.4`  
**Statut :** proposé  
**Version :** v1.3 (2026-11-20, CR-012 — fin naturelle du CLI sur Run et abrogation des matchers exit)  
**ADR :** [`ADR-004`](../docs/adr/ADR-004-moteur-blocs.md), [`ADR-018`](../docs/adr/ADR-018-call-scenario-sous-runner.md), [`ADR-019`](../docs/adr/ADR-019-bloc-command.md)

### Règle

> Le moteur implémente **6** types de blocs exclusifs configurés uniquement par des paramètres statiques (`R-08`, `R-09`) :
> - **Start :** 0 entrée, pas de paramètres, émet sur ses $0..N$ sorties `{ blockType: 'start', value: null, power: 1 }` au lancement du scénario (`R-19`, `R-20`, `REQ-015`).
> - **Run :** paramètres statiques (agent, prompt, `exitId` optionnel), ne lit pas le sac. Exécute le CLI via l'adapter jusqu'à sa **terminaison naturelle** (`code === 0` ou `null`, hors Stop manuel) sans jamais surveiller ni interrompre prématurément le flux `stdout`/`stderr` ; lorsque `exitId` référence une ressource `exit`, son texte (`content`) est additionné à la fin du prompt lors de l'assemblage préalable (`R-07`, `R-45`, `SPEC-ENG-04`). Émet sur ses $0..N$ sorties `{ blockType: 'run', value: <sortie CLI résolue>, power: 1 }`. Si 0 sortie, agit comme point de terminaison (*endpoint*) (`R-21`, `R-22`, `REQ-016`, `REQ-017`).
> - **If :** 1..N entrées, lit le sac, évalue `if(sac)` via le script JS. Possède 2 familles de sorties : branche vraie (émise avec `power: 1` si condition vraie, `power: 0` si faux), branche fausse (émise avec `power: 1` si condition fausse, `power: 0` si vrai) (`R-10b`, `R-14`, `R-15`, `R-22`, `REQ-018`, `REQ-019`).
> - **ClearContext :** paramètre statique (agent), ne lit pas le sac. Oublie la session de scénario de l'agent (le Run suivant de cet agent ouvre une nouvelle session, `SPEC-ADPT-03`), réarme la politique `une_fois_jusqu_a_clear`, puis émet sur ses $0..N$ sorties `{ blockType: 'clearContext', value: null, power: 1 }` (`R-39`, `REQ-020`, `REQ-038`). Aucune commande CLI n'est lancée.
> - **CallScenario :** paramètre statique `targetScenarioId`, ne lit pas le sac. Après join OK (`N ≥ 1` et `sum(power)===N`), charge le graphe cible et lance une **sous-exécution in-process** (ADR-018) ; **attend** la terminaison ; en succès, émet sur ses $0..N$ sorties `{ blockType: 'callScenario', value: null, power: 1 }` (`R-46`, `REQ-039`, `REQ-038`). Aucun paramètre métier n'est transmis à l'enfant ni renvoyé. L'identité du run HTTP / recovery reste le scénario **racine** (`REQ-040`). Auto-appel autorisé ; profondeur bornée seulement si `CALL_SCENARIO_MAX_DEPTH` ≥ 0 (`-1` / absente = illimité) ; cible absente/invalide ⇒ échec du bloc (`REQ-041`, `R-25`).
> - **Command :** paramètre statique `commandLine`, ne lit pas le sac. Après join OK, spawn une **commande shell OS** (hors adapters agents ; distinct de **Run**) avec **`cwd` = `workspacePath`** (`REQ-006`, `REQ-043`) ; **attend** la fin du process ; exit **0** ⇒ émet sur ses $0..N$ sorties `{ blockType: 'command', value: null, power: 1 }` (`R-47`, `REQ-042`, `REQ-038`) ; exit **≠ 0** ou `commandLine` vide / invalide ⇒ échec du bloc (`R-25`). stdout / stderr relayés vers le terminal du run racine (`REQ-043`). Le process est tracké pour Stop racine (`R-34`).
>
> Tout Run s'exécute dans la session de scénario de son agent : le runner fournit `ctx.sessionId`, en créant la session au premier Run de l'agent dans l'exécution (`SPEC-ADPT-03`). Un sous-runner CallScenario dispose d'une table de sessions **isolée**.

### Portée

- Couvre l'exécution unitaire et le comportement d'émission de chacun des **6** types de blocs.
- Couvre la règle d'indifférence du sac pour les blocs Run, ClearContext, CallScenario et Command.
- Couvre la distribution différentielle de puissance (1 / 0) sur les deux familles de sorties du bloc If.
- Couvre le rôle d'endpoint pour les blocs Run sans sortie.
- Couvre l'await et l'échec remonté du sous-scénario CallScenario (détail holder HTTP → `SPEC-SRV-02` / ADR-018).
- Couvre l'await process shell du bloc Command et le fail sur exit ≠ 0.
- Ne couvre pas la définition du script `if.js` sur disque → `SPEC-DATA-02`.
- Ne couvre pas la construction de la commande CLI agent → `SPEC-ADPT-01` et `SPEC-ADPT-02`.

### Scénarios nominaux

```gherkin
Scénario : Émission du bloc Start au lancement
  Étant donné un scénario initié par l'utilisateur
  Quand le bloc Start se déclenche
  Alors il émet simultanément sur ses N sorties le message "{ blockType: 'start', value: null, power: 1 }"

Scénario : Évaluation d'un bloc If et distribution des puissances
  Étant donné un bloc If dont le script retourne true pour le sac d'entrées courant
  Quand l'évaluation de la condition se termine
  Alors toutes les sorties de la branche vraie reçoivent un message avec power 1
  Et toutes les sorties de la branche fausse reçoivent un message avec power 0

Scénario : Exécution d'un bloc Run agissant comme endpoint
  Étant donné un bloc Run sans aucune connexion de sortie (0 sortie)
  Quand le bloc termine son exécution avec succès
  Alors sa branche de traitement se termine normalement sans émettre de message

Scénario : Exécution nominale d'un bloc CallScenario
  Étant donné un bloc CallScenario dont targetScenarioId référence un scénario valide
  Et le join d'entrée est satisfait (sum(power) === N)
  Quand le sous-scénario cible se termine avec succès
  Alors le bloc émet sur ses sorties câblées "{ blockType: 'callScenario', value: null, power: 1 }"
  Et activeScenarioId HTTP reste l'identifiant du scénario racine

Scénario : Exécution nominale d'un bloc Command
  Étant donné un bloc Command dont commandLine est non vide
  Et le join d'entrée est satisfait (sum(power) === N)
  Quand le process shell se termine avec exit code 0
  Alors le bloc émet sur ses sorties câblées "{ blockType: 'command', value: null, power: 1 }"
  Et le cwd du process était workspacePath
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Bloc If n'ayant aucune connexion sur la branche fausse (0 sortie fausse) | L'évaluation à faux n'émet rien sur cette branche et termine ce chemin sans erreur. |
| 2 | Bloc Run faisant référence à un agent ou prompt supprimé du disque | Détection à l'exécution, échec immédiat du bloc, déclenchement de l'arrêt global du scénario (`R-25`). |
| 3 | Bloc ClearContext sans sortie | Session de l'agent oubliée, terminaison normale de la branche. |
| 4 | Bloc ClearContext ciblant un agent n'ayant encore exécuté aucun Run | No-op sur la table de sessions, émission normale `power: 1`. |
| 5 | CallScenario avec `targetScenarioId` égal au scénario courant | Sous-exécution du même scénario autorisée (`REQ-041`) ; terminaison via condition métier (ex. If) ou Stop. |
| 6 | CallScenario dont le sous-scénario échoue ou est stoppé sans succès | Échec du bloc CallScenario → arrêt global du scénario racine (`R-25`, `REQ-026`). |
| 7 | Imbrication CallScenario au-delà de `CALL_SCENARIO_MAX_DEPTH` (si ≥ 0) | Échec du bloc (`REQ-041`) ; si env absente ou `-1`, aucune limite. |
| 8 | Command avec `commandLine` vide ou invalide | Échec immédiat du bloc (`REQ-043`, `R-25`). |
| 9 | Command se terminant avec exit ≠ 0 | Échec du bloc → arrêt global racine (`REQ-042`, `R-25`). |

### Ce qui n'est pas défini

- *2026-09-22* — Boucles natives, blocs de temporisation, End : différés hors v2.1.
- *2026-11-13* — Passage de paramètres / résultats métier parent ↔ enfant via CallScenario : hors scope V1 de la feature.
- *2026-11-13* — Env custom / timeout UI / capture stdout comme `value` / ignore exit ≠ 0 pour Command : hors scope V1 (`REQ-042`…`043`).

### Critères d'acceptation

- [ ] `AC-ENG-03-1` — Le bloc Start émet un message `power: 1` sur toutes ses sorties au démarrage (`CASE-ENG-03-1`).
- [ ] `AC-ENG-03-2` — Le bloc Run exécute la commande et émet `power: 1` avec le résultat texte ou agit comme endpoint (`CASE-ENG-03-2`).
- [ ] `AC-ENG-03-3` — Le bloc If émet `power: 1` sur la branche prise et `power: 0` sur la branche non prise (`CASE-ENG-03-3`).
- [ ] `AC-ENG-03-4` — Le bloc ClearContext fait ouvrir une nouvelle session au Run suivant de l'agent et propage `power: 1` (`CASE-ENG-03-4`).
- [ ] `AC-ENG-03-5` — Le bloc CallScenario attend la fin du sous-scénario puis émet `{ blockType: 'callScenario', value: null, power: 1 }` ; l'échec enfant (et le dépassement de `CALL_SCENARIO_MAX_DEPTH` si configuré ≥ 0) déclenche l'arrêt global racine ; l'auto-appel est autorisé (`CASE-ENG-03-7`, `R-46`, `REQ-039`, `REQ-041`).
- [ ] `AC-ENG-03-6` — Les chunks CLI d'un sous-runner CallScenario sont relayés sur `chunkReceived` du runner racine (terminal parent), sans exposer pastilles / status enfant (`CASE-ENG-03-8`, `REQ-024`, `REQ-040`).
- [ ] `AC-ENG-03-7` — Le bloc Command attend la fin du process (cwd = workspace) puis émet `{ blockType: 'command', value: null, power: 1 }` si exit 0 ; exit ≠ 0 ou `commandLine` invalide ⇒ arrêt global racine (`CASE-ENG-03-9`, `R-47`, `REQ-042`, `REQ-043`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Confirmer que Run et ClearContext ne lisent pas le sac d'entrées | Acceptée | Conforme au CDC §8 R-12, R-13, R-20, R-22. |
| CallScenario lit-il le sac ? | Non | Conforme CDC v2.1 R-09 / R-46 — power only. |
| Command lit-il le sac / produit une value ? | Non | Conforme CDC v2.1 R-47 / REQ-042 — power only, value null. |

---

## SPEC-ENG-04 — Assemblage du prompt, politiques de profil et arrêt global sur erreur

**Exigences :** `REQ-017`, `REQ-023`, `REQ-026`, `REQ-032`, `R-06`, `R-07`, `R-25`, `R-45`, `D.3`  
**Statut :** proposé  
**Version :** v1.6 (2026-11-20, CR-012 — assemblage additif de l'ordre de sortie `exit`)  

### Règle

> Le moteur de blocs est responsable de l'assemblage complet du prompt (`assembledPrompt`) **avant** de solliciter l'adapter CLI (`R-07`, `R-45`, `REQ-032`).
> L'assemblage combine séquentiellement le prompt système du profil de l'agent, le prompt utilisateur de mission (`prompt.content`) et, lorsqu'`exitId` est configuré sur le bloc Run, l'ordre de sortie (`exit.content`), séparés par `\n\n` sans saut de ligne parasite lorsqu'un segment est vide :
> - `chaque_prompt` (défaut) : injecte systématiquement le prompt système du profil à chaque exécution de l'agent (`R-06`).
> - `debut_scenario` : injecte le prompt système uniquement lors du premier bloc Run de cet agent dans le scénario.
> - `une_fois_jusqu_a_clear` : injecte le prompt système au premier appel, puis l'omet jusqu'à ce qu'un bloc ClearContext réinitialise le contexte de cet agent.
> - **Ordre de sortie (`exitId` optionnel) :** si le bloc Run référence une ressource `exit`, son `content` est concaténé **après** le prompt de mission (`R-07`) afin de dicter au modèle comment formuler sa fin de réponse (ex. `TERMINER` vs `CONTINUE`), sans interrompre le processus CLI avant sa fin naturelle.
> **Transmission du modèle d'IA :** Lors de la préparation de commande pour un bloc Run (`prepareRunContext`), le moteur transmet le modèle d'IA cible configuré sur l'agent (`model: agent.model`) dans le contexte d'exécution fourni à `adapter.buildCommand(ctx)`.
> **Arrêt global sur erreur :** si l'exécution d'un bloc quelconque échoue (code de sortie CLI non nul, exception script If, timeout, ressource introuvable, **échec ou arrêt non réussi d'une sous-exécution CallScenario**, **échec d'un bloc Command**), le moteur ordonne l'arrêt d'urgence immédiat de l'ensemble du scénario **racine**, interrompt les processus en cours **y compris ceux des sous-runners et des Command**, et positionne le statut global en erreur (`R-25`, `REQ-026`, ADR-018).

### Portée

- Couvre l'algorithme d'assemblage du texte de prompt (`systemPrompt` + `userPrompt` + `exitPrompt` optionnel).
- Couvre la mémorisation runtime de l'état d'injection du profil par agent selon la politique active.
- Couvre la transmission du champ optionnel `model` de l'agent vers le contexte d'exécution de la commande de spawn.
- Couvre la réinitialisation de l'état d'injection de profil lors de l'exécution d'un ClearContext pour la politique `une_fois_jusqu_a_clear`.
- Couvre la détection des échecs de blocs et la commande d'arrêt global immédiat de toutes les branches du scénario.
- Ne couvre pas la construction de la ligne de commande finale par l'adapter → `SPEC-ADPT-01` et `SPEC-ADPT-02`.

### Scénarios nominaux

```gherkin
Scénario : Assemblage systématique avec la politique par défaut chaque_prompt et ordre de sortie exit
  Étant donné un agent associé à un profil ayant systemPrompt "Expert Node" et policy "chaque_prompt"
  Et un bloc Run avec le prompt utilisateur "Rédige le rapport" et la ressource exit "Si complet renvoie TERMINER, sinon CONTINUE"
  Quand le moteur prépare l'exécution du bloc
  Alors le prompt assemblé contient "Expert Node", suivi de "Rédige le rapport", suivi de "Si complet renvoie TERMINER, sinon CONTINUE", séparés par des doubles sauts de ligne
  Et le processus CLI s'exécute jusqu'à sa fin naturelle sans être interrompu si "TERMINER" apparaît en cours de flux

Scénario : Injection unique en début de scénario (debut_scenario)
  Étant donné un agent avec policy "debut_scenario" et un scénario contenant 2 blocs Run successifs pour cet agent
  Quand le premier bloc Run est exécuté
  Alors son prompt assemblé inclut le prompt système du profil
  Quand le second bloc Run est exécuté dans le même scénario
  Alors son prompt assemblé contient uniquement le prompt utilisateur sans le prompt système

Scénario : Arrêt global d'urgence suite à l'échec d'un bloc Run
  Étant donné un scénario avec deux branches parallèles en cours d'exécution
  Quand un bloc Run sur la branche A échoue avec un code de sortie en erreur
  Alors le moteur interrompt immédiatement le sous-processus de la branche B
  Et le scénario complet bascule à l'état d'erreur global

Scénario : Arrêt global suite à l'échec d'un sous-scénario CallScenario
  Étant donné un scénario racine contenant un bloc CallScenario en cours
  Et une sous-exécution enfant avec des spawns CLI actifs
  Quand le sous-scénario échoue
  Alors le bloc CallScenario passe en erreur
  Et le moteur halt le scénario racine et interrompt les spawns parent et enfant
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Profil sans prompt système ou avec chaîne vide | Le prompt assemblé est constitué exclusivement du prompt utilisateur du bloc sans saut de ligne parasite. |
| 2 | Exécution d'un ClearContext pour un agent configuré en `une_fois_jusqu_a_clear` | L'indicateur d'injection est réinitialisé : le prochain bloc Run pour cet agent recevra à nouveau le prompt système. |
| 3 | Exception inattendue lors de l'évaluation du script `if.js` | Interception immédiate par le moteur, arrêt global du scénario sans crash du service ClientsBox (`R-25`). |
| 4 | Stop manuel pendant un CallScenario actif | Halt récursif du sous-runner + kill des spawns enfant (`R-34`, ADR-018). |
| 5 | Stop manuel pendant un Command actif | Kill du process Command tracké + halt scénario (`R-34`, `REQ-043`, `CASE-ENG-04-12`). |

### Ce qui n'est pas défini

- *2026-09-22* — Format de séparateur textuel entre systemPrompt et userPrompt : une concaténation propre avec double saut de ligne standard est appliquée.

### Critères d'acceptation

- [ ] `AC-ENG-04-1` — Le moteur assemble le prompt système, le prompt utilisateur et l'ordre de sortie `exit` optionnel avant tout appel à l'adapter, et attend la fin naturelle du CLI (`CASE-ENG-04-1`, `CASE-ENG-04-13`).
- [ ] `AC-ENG-04-2` — Les 3 politiques de profil (`chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear`) sont fidèlement appliquées (`CASE-ENG-04-2`).
- [ ] `AC-ENG-04-3` — Tout échec d'exécution d'un bloc déclenche l'arrêt global immédiat du scénario (`CASE-ENG-04-3`) ; pour CallScenario nested : halt récursif des spawns parent+enfant et Stop manuel (`CASE-ENG-04-11`, ADR-018) ; pour Command : Stop tue le process (`CASE-ENG-04-12`, `REQ-043`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la réinitialisation de `une_fois_jusqu_a_clear` suite à un bloc ClearContext | Acceptée | Conforme au CDC §8 R-06, R-45 et Annexe D.3. |
