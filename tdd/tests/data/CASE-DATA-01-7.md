# CASE-DATA-01-7 — Intégrité et typage strict des modèles de données étendus d'Option B

**Spécification :** `SPEC-DATA-01`, `SPEC-DATA-03`  
**Critère d'acceptation :** `AC-DATA-01-1`, `AC-DATA-03-1`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-005`  

---

## Ce que ce cas protège

La formalisation d'Option B introduit des structures de données typées (`TYPES-002..008`) pour matérialiser fidèlement les nœuds du canvas (`Node`), les connexions orientées (`Connection`), le document complet de scénario (`Scenario`), les statuts d'exécution (`BlockStatus`, `RunnerStatus`), et la mémoire de prompt (`PolicyInjectionState`). Ce cas garantit la conformité de ces modèles à la sérialisation et désérialisation JSON, avec validation stricte des champs obligatoires et rejet des valeurs invalides.

---

## Cas

```gherkin
Étant donné les structures TypeScript déclarées dans "src/types/models/"
Quand une entité Scenario contenant des nœuds Start, Run, If, ClearContext et des connexions orientées est validée
Alors chaque bloc possède un identifiant unique, un type valide parmi les 4 types officiels, et des coordonnées (x, y)
Et chaque connexion possède un id, fromNodeId, fromOutputPort ("default" ou "true"/"false" pour If), toNodeId, et toInputKey
Et aucune propriété étrangère non déclarée n'altère le modèle

Étant donné une structure "BlockStatus" reçue pour un bloc per TYPES-012
Alors le statut appartient strictement à l'énumération : "idle", "running", "paused", "completed", "error"
Et les décisions de jointure Join appartiennent à l'énumération "JoinDecision" : "waiting", "pause", "trigger"
Et le champ optionnel message est typé en chaîne de caractères
```

---

## Données

| Élément | Valeur |
|---|---:|
| Types de blocs autorisés | `'start'`, `'run'`, `'if'`, `'clearContext'` |
| Statuts de nœud valides (`BlockStatus`) | `'idle'`, `'running'`, `'paused'`, `'completed'`, `'error'` |
| Décisions de jointure (`JoinDecision`) | `'waiting'`, `'pause'`, `'trigger'` |
| Ports de sortie If | `'true'`, `'false'` |
| Ports de sortie autres blocs | `'default'` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Validation de schéma complet | Conforme | Sérialisation et désérialisation sans perte d'information |
| Types stricts de statut | 5 états valides | Enumération exhaustive TYPES-012 (`idle`, `running`, `paused`, `completed`, `error`) |

---

## Ce que ce cas ne vérifie pas

- La persistance atomique sur disque → `CASE-DATA-04-1` ;
- Le calcul topologique des cycles → `CASE-DATA-03-5`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_DATA_01_7_extended_models_type_integrity`  
**Fichier :** `tests/units/data/case-data-01-7.test.ts`  

## Revue du test automatisé

- [ ] Le test valide le modèle de scénario avec les 4 types de blocs.
- [ ] Le test valide le typage strict des connexions et des ports de sortie If.
- [ ] Le test valide les 5 valeurs possibles de `BlockStatus` per TYPES-012 et `JoinDecision`.
- [ ] Le nom du test contient `CASE_DATA_01_7`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
