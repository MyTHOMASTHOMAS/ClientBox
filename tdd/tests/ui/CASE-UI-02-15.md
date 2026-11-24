# CASE-UI-02-15 — Enregistrer / load canvas : strip des champs `SCENARIO_NODE_NO_SAVE_KEYS`

**Spécification :** `SPEC-UI-02`, `SPEC-DATA-03`  
**Critère d'acceptation :** `AC-UI-02-8`, `AC-DATA-03-6`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-005`, `ADR-013`  
**Modules cibles :** `DOM-018`, payload Studio (`buildScenarioPayload` / load `createCanvasDocument`)

---

## Ce que ce cas protège

`CASE-DATA-03-6` fige la constante et le strip pur. Ce cas garantit que le **Studio** l'applique réellement :

1. Au clic **Enregistrer**, le payload PUT/POST n'embarque aucune clé de `SCENARIO_NODE_NO_SAVE_KEYS` (ex. `status` encore présent en mémoire UI pendant/après un run).
2. Au **chargement** d'un scénario dont le JSON disque est pollué (`status` résiduel), le modèle canvas hydraté n'affiche pas un faux état d'exécution du seul fait du fichier.

Sans cela, Scene 1 (et tout scénario sauvé mid-run) réaffiche un pulse « running » au redémarrage Node.

---

## Cas

```gherkin
Scénario : Payload Enregistrer sans clés no-save
  Étant donné un canvas hydraté avec un nœud Run dont status mémoire vaut "running"
  Quand l'utilisateur déclenche "Enregistrer" (data-action="save-scenario")
  Alors le corps JSON envoyé au PUT/POST /api/scenarios ne contient "status" sur aucun nœud
  Et les champs de design du nœud (id, type, position, agentId, …) sont présents

Scénario : Load ignore status disque
  Étant donné un GET scénario renvoyant un nœud avec "status": "completed"
  Quand le Studio hydrate le canvas
  Alors le nœud du document canvas ne porte pas de status issu du disque
  Et aucun indicateur d'exécution n'est actif tant qu'aucun snapshot/SSE run ne le justifie
```

---

## Données

| Élément | Valeur |
|---|---|
| Liste | `SCENARIO_NODE_NO_SAVE_KEYS` (`DOM-018`) |
| Clé minimale | `status` |
| Action save | `data-action="save-scenario"` |

---

## Nom de test suggéré

`test_CASE_UI_02_15_studio_save_and_load_strip_scenario_node_no_save_keys`

---

## Checklist d'implémentation

- [ ] Le payload d'Enregistrer passe par le strip `DOM-018`.
- [ ] Le load / `createCanvasDocument` strip les clés no-save.
- [ ] Aucune redéfinition locale de la liste hors `SCENARIO_NODE_NO_SAVE_KEYS`.
- [ ] Hors scope : lock édition pendant run → `CASE-UI-02-16` / `AC-UI-02-9`.
