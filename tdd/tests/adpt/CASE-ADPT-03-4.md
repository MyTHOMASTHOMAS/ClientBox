# CASE-ADPT-03-4 — ClearContext n'interrompt pas un Run en cours du même agent

**Spécification :** `SPEC-ADPT-03`, `SPEC-ENG-03`  
**Critère d'acceptation :** `AC-ADPT-03-2`, `AC-ENG-03-4`  
**Type :** acceptation / intégration runner  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-003`  

---

## Ce que ce cas protège

ClearContext agit uniquement sur la **table de sessions** (cas limite 5 SPEC-ADPT-03). S'il est exécuté pendant qu'un Run du même agent tourne sur une branche parallèle, ce Run n'est ni tué ni modifié : il termine sur l'ancienne session. Seul un Run démarré **après** le ClearContext obtient une nouvelle session. Ce cas protège la séparation stricte Clear ≠ Stop (`R-24`).

---

## Cas

```gherkin
Étant donné un adapter simulé dont "createSession" retourne "chat-1" puis "chat-2"
Et un scénario :
  Start --> Run-long(agent-a)
  Start --> Run-init(agent-a) --> Clear(agent-a) --> Run-after(agent-a)
Et "Run-long" reste en cours jusqu'à libération manuelle par le test
Quand le scénario est exécuté et que "Clear" s'exécute pendant "Run-long"
Alors aucun handle de processus actif ne reçoit stop()
Et "Run-long" termine normalement avec le statut "completed"
Et "Run-long" et "Run-init" ont reçu "chat-1"
Et "Run-after" a reçu "chat-2"
```

---

## Données

| Élément | Valeur |
|---|---:|
| Branche longue | `Start → Run-long(a)` (bloquée par une barrière) |
| Branche clear | `Start → Run-init(a) → Clear(a) → Run-after(a)` |
| Retours `createSession` | `"chat-1"`, `"chat-2"` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Appels `stop()` sur handles actifs | `0` | Clear ≠ Stop |
| Statut final `Run-long` | `completed` | Continuité de la tâche |
| Session `Run-long` / `Run-init` / `Run-after` | `chat-1` / `chat-1` / `chat-2` | Création partagée, puis renouvellement après Clear |
| Statut du scénario | `completed` | Aucune erreur |

---

## Ce que ce cas ne vérifie pas

- L'arrêt forcé sur action Stop → `CASE-ADPT-03-1` ;
- L'absence de bouton de reset manuel → `CASE-UI-03-3`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ADPT_03_4_clear_context_decoupled_from_process_termination`  
**Fichier :** `tests/units/adpt/CASE-ADPT-03-4.test.ts`  

## Revue du test automatisé

- [ ] Le test bloque `Run-long` via une barrière et laisse `Clear` s'exécuter pendant ce temps.
- [ ] Le test vérifie qu'aucun `stop()` n'est appelé sur un handle actif.
- [ ] Le test vérifie les sessions reçues par les trois Runs.
- [ ] Le nom du test contient `CASE_ADPT_03_4`.
- [ ] Le test échoue si ClearContext tue un processus ou ne renouvelle pas la session.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** v2 (2026-11-03) — porté du niveau adapter au niveau runner (ClearContext sans commande CLI).
