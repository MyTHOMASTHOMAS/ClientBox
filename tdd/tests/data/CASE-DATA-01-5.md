# CASE-DATA-01-5 — Refus de suppression d'un profil référencé par un ou plusieurs agents (intégrité 409)

**Spécification :** `SPEC-DATA-01`
**Critère d'acceptation :** `AC-DATA-01-5`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Un profil peut être partagé par plusieurs agents (`R-05`, `REQ-010`). La suppression d'un profil encore référencé par au moins un agent doit être refusée par `AgentService.deleteProfile` avec une erreur métier explicite en français, exposée en HTTP **409 Conflict** (`ADR-005`, `signature-services.md` SVC-004). Sans cette garde, des agents orphelins de profil corrompraient le référentiel `.agents/data/`.

## Cas

```gherkin
Étant donné un profil "profil-shared" existant sur disque
Et un agent "agent-1" dont le champ "profilId" vaut "profil-shared"
Quand le service tente de supprimer le profil "profil-shared"
Alors la suppression est refusée
Et une erreur métier explicite en français indique que le profil est encore référencé par des agents
Et le mapping HTTP correspondant est 409 Conflict
Et le fichier ".agents/data/profils/profil-shared.json" est toujours présent sur le disque

Étant donné un profil "profil-orphan" existant sur disque
Et aucun agent ne référence "profil-orphan"
Quand le service tente de supprimer le profil "profil-orphan"
Alors la suppression réussit
Et le fichier ".agents/data/profils/profil-orphan.json" est retiré du disque
```

## Données

| Élément | Valeur |
|---|---:|
| Profil référencé | `"profil-shared"` |
| Agent lié | `"agent-1"` avec `profilId: "profil-shared"` |
| Profil non référencé | `"profil-orphan"` |
| Code HTTP attendu (refus) | `409` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Delete profil avec agents liés | `REFUS` + 409 | Intégrité R-05 / ADR-005 |
| Fichier profil après refus | `PRÉSENT` | Pas de `file-remover` |
| Delete profil sans agent | `SUCCÈS` | Aucune référence |

## Ce que ce cas ne vérifie pas

- Les formulaires UI de suppression → éventuel complément UI hors PTS-06 ;
- La validation schéma `profilId` à la création d'agent → `CASE-DATA-01-1` ;
- La suppression d'un agent → hors périmètre.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_01_5_refuse_delete_profile_with_linked_agents`
**Fichier :** `tests/tests-unitaires/data/case-data-01-5.test.ts`

## Revue du test automatisé

- [ ] Le test crée un profil + un agent lié puis tente `deleteProfile` → refus / 409.
- [ ] Le test vérifie la persistance du fichier profil après refus.
- [ ] Le test supprime un profil non référencé avec succès.
- [ ] Le nom du test contient `CASE_DATA_01_5`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
