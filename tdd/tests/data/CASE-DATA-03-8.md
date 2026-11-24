# CASE-DATA-03-8 — Nœud `command` : persistance et validation de `commandLine`

**Spécification :** `SPEC-DATA-03`  
**Critère d'acceptation :** `AC-DATA-03-8`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-005`, `ADR-019`  
**Modules cibles :** schémas / validateur graphe scénario, store `scenarios/`  

---

## Ce que ce cas protège

Un nœud de type **`command`** doit persister le paramètre statique **`commandLine`** dans le JSON sous `.agents/data/scenarios/`. La validation refuse une commande manquante, vide ou constituée uniquement d'espaces (`REQ-042`, `REQ-043`, `R-47`). Aucun champ agent, prompt ou exit n'est requis ni persisté pour ce type.

Sans cette validation, un graphe contenant une commande vide ou indéfinie serait sauvegardé et provoquerait des échecs imprévisibles au moment de l'exécution shell.

---

## Cas

```gherkin
Scénario : Persistance de commandLine
  Étant donné un scénario "mon-scenario" contenant un nœud
    { id: "cmd1", type: "command", commandLine: "npm test", position: { x: 10, y: 20 } }
  Quand le scénario est sérialisé puis relu depuis ".agents/data/scenarios/mon-scenario.json"
  Alors le nœud "cmd1" a type "command"
  Et commandLine vaut "npm test"

Scénario : Rejet commandLine vide ou whitespace
  Étant donné un nœud command avec commandLine "" ou "   "
  Quand on valide le document
  Alors la validation échoue avec un message en français (REQ-043)

Scénario : Rejet commandLine manquant
  Étant donné un nœud command sans propriété commandLine (undefined)
  Quand on valide le document
  Alors la validation échoue (REQ-043)

Scénario : Validation nominale sans champs agent/prompt/exit
  Étant donné un nœud command avec commandLine "echo 'hello'"
  Quand on valide le document
  Alors la validation réussit sans requérir agentId, promptId ou exitId (REQ-042)
```

---

## Données

| Élément | Valeur |
|---|---|
| Type nœud | `command` |
| Champ | `commandLine` |
| Commande valide | `"npm test"` / `"echo 'hello'"` |
| Commande invalide | `""`, `"   "`, `undefined` |
| Champs agent/prompt/exit | Absents / non requis |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Round-trip `commandLine` | conservé tel quel | AC-DATA-03-8 |
| Commande vide ou whitespace | rejet validation | AC-DATA-03-8 / REQ-043 |
| Commande absente | rejet validation | AC-DATA-03-8 / REQ-043 |
| Champs agent/prompt | non requis | REQ-042 |

---

## Ce que ce cas ne vérifie pas

- L'exécution shell OS et le retour power 1 → `CASE-ENG-03-9` ;
- Le stop du process shell en cours → `CASE-ENG-04-12` ;
- L'interface d'édition du champ dans le studio → `CASE-UI-02-19` ;
- Strip des clés no-save → `CASE-DATA-03-6`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_DATA_03_8_command_node_persist_and_validate_command_line`  
**Fichier :** `tests/units/data/CASE-DATA-03-8.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie la persistance et la relecture fidèle de `commandLine`.
- [ ] Le test rejette `commandLine` vide, whitespace seul ou absent.
- [ ] Le test confirme qu'aucun champ `agentId` ou `promptId` n'est exigé.
- [ ] Le nom du test contient `CASE_DATA_03_8`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 / CDC v2.1.
