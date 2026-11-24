# CASE-ENG-04-8 — Fan-out multi-connexions sortantes et bifurcation If (deux flux distincts)

**Spécification :** `SPEC-ENG-01`, `SPEC-ENG-03`, `SPEC-ENG-04`  
**Critère d'acceptation :** `AC-ENG-03-1`, `AC-ENG-03-3`, `AC-ENG-04-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`  
**Service cible :** `SVC-001` (`ScenarioRunnerService`)  

---

## Ce que ce cas protège

Sur le canvas ClientsBox, un bloc peut avoir **plusieurs connexions sortantes**. Deux situations métier doivent être garanties par le runner :

1. **Fan-out parallèle (power 1 partout)** — ex. Start (ou Run) relié à plusieurs cibles : chaque cible reçoit `power: 1` et peut s'exécuter (join satisfait).
2. **Bifurcation If (flux exclusifs)** — If a deux familles de sorties (port 0 = vrai, port 1 = faux). Selon le booléen du script, **un seul** des deux flux aval s'exécute ; l'autre reçoit `power: 0` et reste inactif (pause / idle).

Ce cas protège exactement le schéma d'orchestration recherché pour les scénarios manuels (plusieurs câbles + chemins oui/non).

---

## Cas

```gherkin
# --- Fan-out multi-sorties ---
Étant donné un scénario câblé :
  Start --[key: "0"]--> RunA
  Start --[key: "0"]--> RunB
Quand "ScenarioRunnerService.run()" est exécuté
Alors Start émet vers les deux connexions sortantes avec power 1
Et RunA est exécuté (spawn CLI)
Et RunB est exécuté (spawn CLI)
Et les deux Runs atteignent le statut "completed"

# --- Bifurcation If = true ---
Étant donné un scénario câblé :
  Start --> RunFeed --> If(script)
                         |-- port0 (vrai) --> RunOui
                         |-- port1 (faux) --> RunNon
Et le script If retourne true
Quand run() est exécuté
Alors RunOui est exécuté
Et RunNon n'est PAS exécuté (pas de spawn)
Et RunNon reste "paused" ou "idle"

# --- Bifurcation If = false ---
Étant donné le même câblage avec un script If qui retourne false
Quand run() est exécuté
Alors RunNon est exécuté
Et RunOui n'est PAS exécuté
Et RunOui reste "paused" ou "idle"
```

---

## Données

| Élément | Valeur |
|---|---:|
| Fan-out | 2 connexions sortantes depuis Start, clés `"0"` sur chaque cible |
| Ports If | `0` = branche vraie, `1` = branche fausse |
| Scripts | `cond-true.js` → `true` ; `cond-false.js` → `false` |
| Observation | liste des `nodeId` passés à `executeSpawn` / statut blocs |

---

## Résultat attendu, calculé à la main

| Scénario | Spawn attendus | Non spawn |
|---|---|---|
| Fan-out Start→A,B | `run-a`, `run-b` | — |
| If true | `run-feed`, `run-oui` | `run-non` |
| If false | `run-feed`, `run-non` | `run-oui` |

---

## Ce que ce cas ne vérifie pas

- La distribution pure `distributeIfPower` hors runner → `CASE-ENG-03-3` ;
- Join waiting/pause multi-entrées → `CASE-ENG-02-4` ;
- Ordre vs `nodes[]` → `CASE-ENG-04-7` ;
- ClearContext → `CASE-ENG-03-4`.

---

## Interdiction explicite (anti-faux-vert)

- Un helper local `fanOut(...)` **sans** `ScenarioRunnerService.run()` ne suffit pas.
- Tester seulement `If === true` sans le scénario `If === false` ne suffit pas.
- Exécuter les deux branches RunOui **et** RunNon quel que soit le booléen = échec du test.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_04_8_fanout_and_if_branch_exclusive_flows`  
**Fichier :** `tests/units/eng/CASE-ENG-04-8.test.ts`  

## Revue du test automatisé

- [ ] Le test exécute un fan-out Start → 2 Runs et affirme les deux spawns.
- [ ] Le test exécute If true → seul RunOui spawn.
- [ ] Le test exécute If false → seul RunNon spawn.
- [ ] Le test échoue si le runner ignore les If ou lance les deux branches.
- [ ] Le nom du test contient `CASE_ENG_04_8`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** Autrement (`U`)  
**Remarques :** Case dédiée au schéma multi-câbles + bifurcation oui/non recherché pour les scénarios manuels.
