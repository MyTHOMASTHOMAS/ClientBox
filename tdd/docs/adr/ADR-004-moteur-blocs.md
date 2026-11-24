# ADR-004 — Moteur de blocs (join, power, pause, typologie)

**Statut :** accepté  
**Date :** 21/09/2026  
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
| R-08…R-15, R-19…R-22, R-39 | Modèle de blocs, messages, If, Run, Start, ClearContext |
| R-42, R-42b, R-42c, R-42d, R-43, R-44, R-45 | Join / power / pause / N=0 / keys / assemblage prompt |
| R-25, REQ-026 | Erreur ⇒ arrêt global du scénario |
| REQ-014…REQ-020, REQ-033…REQ-038 | Canvas, Start unique, Run/If/ClearContext, keys, moteur |
| R-46, REQ-039…041 (CDC v2.1) | CallScenario — détail runtime nested → **ADR-018** |
| R-47, REQ-042…043 (CDC v2.1) | Command — exécution shell OS → **ADR-019** |
| Contrainte 10, 15 | Forme messages ; exécution ssi N≥1 et sum===N |
| Annexe B | Contrat de base + B.3/B.4 |

Cet ADR **complète** le CDC en figeant l'**architecture runtime** du moteur (ordonnancement), sans redéfinir le métier déjà écrit dans les R/REQ — il les rend implantables de façon unique.

---

## Contexte

Le CDC décrit un canvas type N8N avec blocs Start / Run / If / ClearContext (étendus en **CDC v2.1** par **CallScenario** — **ADR-018** et **Command** — **ADR-019**), messages `{ blockType, value, power }`, sac d'entrées à keys, join, pause, et la règle **N ≥ 1** + `sum(power)===N`. Il faut décider comment le runtime matérialise ces règles (boucle d'événements, ownership du sac, moment d'appel adapter).

## Options envisagées

### Option A — Moteur événementiel orienté graphe : une instance d'exécution de scénario, états par nœud (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Mapping direct B.3 ; pause = état nœud ; fan-out Start naturel |
| Ce qu'elle coûte | Implémentation d'un petit runtime custom |
| Ce qu'elle rend difficile plus tard | Remplacement par un moteur externe type Temporal |

### Option B — Orchestrateur externe (Temporal / queues)

| | |
|---|---|
| Ce qu'elle apporte | Robustesse distribuée |
| Ce qu'elle coûte | Contredit standalone local mono-user ; complexité hors CDC |
| Ce qu'elle rend difficile plus tard | Livrable JS unique léger |

### Option C — Chaîne Promise linéaire sans vrai join multi-entrées

| | |
|---|---|
| Ce qu'elle apporte | Simplicité code |
| Ce qu'elle coûte | Incapable d'honorer R-42 / If power 0 / pause |
| Ce qu'elle rend difficile plus tard | Contredit le CDC |

## Décision

1. **Une exécution de scénario** = un graphe chargé depuis `data/scenarios/` (R-16) + état runtime en mémoire (pas d'historisation fichier — R-37).
2. **Nœud** : ports d'entrée/sortie selon B.4 ; paramètres **statiques** uniquement (R-08, R-09).
3. **Messages :**  
   - sortie = `BlockMessage` **sans key** (R-10, R-44, D.2) ;  
   - entrée = sac `Record<key, BlockMessage>` (R-11).
4. **Join (N ≥ 1)** : attendre un message sur **chaque** entrée câblée (y compris power 0) ; exécuter ssi **`N ≥ 1` et `sum(power)===N`** ; sinon **pause** + attente maj (R-42, R-42b, contrainte 15).  
   **N = 0** hors Start : **pas d'exécution**, pas d'émission (R-42d).  
   **Start** : exception R-42c / REQ-015.
5. **If** : 1..N entrées ; `if(sac)` depuis `data/if/*.js` ; deux familles de sorties 0..N (power 1 / power 0) (R-14, R-15, REQ-019).
6. **Run** : ne lit pas le sac ; après join OK → assemblage prompt (R-45) → `CLIAdapter.buildCommand` (**ADR-002/003**) → stream vers terminal UI ; puis émission sorties power 1 ou endpoint.
7. **ClearContext** : join puis clear via adapter ; sorties `clearContext` / value null / power 1 (R-39).
8. **CallScenario** (CDC v2.1) : join puis sous-exécution in-process du scénario cible ; détail → **ADR-018** (R-46, REQ-039…041).
9. **Erreur** d'exécution ⇒ arrêt **global** du scénario (R-25, REQ-026) — y compris échec d'une sous-exécution CallScenario.
10. **Stop** disponible aussi en pause (R-34) — y compris halt récursif des sous-runners (ADR-018).

## Raisons

- Option A est le seul mapping fidèle à Annexe B + R-42*.
- B sort du périmètre standalone ; C casse le contrat power/join.

## Conséquences acceptées

- Le détail des schémas `value` par `blockType` reste en **specs** (R-41).
- La pause peut bloquer indéfiniment (assumé CDC) ; mitigation = Stop + inspection UI.
- Pas de file d'attente multi-Run même agent (R-33).

## Ce qui nous ferait revenir dessus

- Introduction d'un bloc End / boucles natives (amendement CDC ultérieur).
- Exigence de reprise d'exécution après crash processus (historisation — aujourd'hui R-37 l'exclut).
- Changement du modèle nested CallScenario → voir **ADR-018**.

## Liens

- Appels CLI : **ADR-002**, **ADR-003**.  
- Chargement graphe / ressources : **ADR-005**.  
- Sous-exécution CallScenario : **ADR-018**.
