# CASE-UI-01-11 — Validation E2E de l'intégrité référentielle et du rejet 409 de suppression de profil

**Spécification :** `SPEC-UI-01`, `SPEC-DATA-01`  
**Critère d'acceptation :** `AC-UI-01-2`, `AC-DATA-01-5`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-005`, `ADR-011`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Conformément à la règle `R-05` et à `REQ-010`, un profil d'agent ne peut être supprimé s'il est référencé par un ou plusieurs agents existants. Ce cas valide dans un vrai navigateur que, dans l'application Preact (`UI-028 pages/profiles-page.tsx`, `ADR-013`) :
1. Une tentative de suppression d'un profil lié depuis l'interface utilisateur échoue avec une notification d'erreur bloquante en français (`409 Conflit`) normalisée via `UI-004 i18n/fr.i18n.ts` et affichée dans une bannière d'alerte réactive Tailwind CSS v4.
2. Le profil demeure présent dans la liste et son fichier n'est pas détruit sur disque.
3. Après suppression ou réassignation de l'agent qui le référençait, la suppression du profil redevient possible et réussit.

---

## Cas

```gherkin
Scénario : Blocage de suppression d'un profil lié et message 409 en français
  Étant donné un profil "Profil Protégé" lié à un agent existant
  Quand l'utilisateur ouvre la vue des profils "#/profils"
  Et clique sur l'action "Supprimer" en face de "Profil Protégé"
  Et confirme son intention de suppression
  Alors l'interface intercepte l'erreur HTTP 409
  Et un message d'alerte en français s'affiche : "Impossible de supprimer ce profil : il est utilisé par au moins un agent."
  Et le profil reste affiché dans le tableau
  Et le fichier ".agents/data/profils/<id>.json" existe toujours sur le disque

Scénario : Suppression réussie après libération de la liaison
  Étant donné l'agent lié préalablement supprimé ou réassigné à un autre profil
  Quand l'utilisateur tente à nouveau de supprimer "Profil Protégé"
  Alors la suppression réussit
  Et le profil disparaît du tableau
  Et le fichier sur le disque est supprimé
```

---

## Données

| Élément | Valeur |
|---|---:|
| Nom du profil | `"Profil Protégé E2E"` |
| Code HTTP attendu sur blocage | `409 Conflict` |
| Règle CDC protégée | `R-05` (intégrité référentielle stricte) |

---

## Résultat attendu, calculé à la main

| Situation | Résultat attendu IHM | Résultat attendu disque |
|:---|:---|:---|
| Profil lié à un agent | Alerte d'erreur 409 affichée | Fichier préservé |
| Profil libre d'agent | Disparition de la ligne | Fichier supprimé |

---

## Ce que ce cas ne vérifie pas

- La création unitaire de profil → `CASE-DATA-01-2` ;
- Le formulaire d'édition de profil → `CASE-UI-01-2`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_01_11_e2e_profile_referential_integrity_and_409_rejection`  
**Fichier :** `tests/e2e/ui/CASE-UI-01-11.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test crée un profil et un agent qui le consomme.
- [ ] Le test clique sur Supprimer le profil et vérifie l'alerte 409.
- [ ] Le test supprime l'agent puis supprime le profil avec succès.
- [ ] Le nom du test contient `CASE_UI_01_11`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
