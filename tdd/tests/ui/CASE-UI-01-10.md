# CASE-UI-01-10 — Validation E2E du cycle de vie CRUD complet d'un Agent avec persistance locale

**Spécification :** `SPEC-UI-01`, `SPEC-DATA-01`, `SPEC-DATA-04`  
**Critère d'acceptation :** `AC-UI-01-2`, `AC-DATA-01-1`, `AC-DATA-04-1`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-005`, `ADR-011`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) l'intégralité du cycle de vie de gestion d'un Agent au sein des composants réactifs Preact (`UI-027 pages/agents-page.tsx`, hook `UI-007 hooks/use-resources.hook.ts` et `UI-016 components/common/data-table.tsx`) stylisés avec Tailwind CSS v4 (`ADR-013`) :
1. L'accès au formulaire de création d'agent, le remplissage des champs (nom, description, profilId, cliId restreint aux adapters opérationnels).
2. La mise à jour réactive immédiate de l'agent dans le tableau de la liste sans rafraîchir manuellement la page.
3. La création physique et atomique du fichier `.agents/data/agents/<id>.json` sur le disque hôte.
4. La modification d'un champ depuis l'IHM et la synchronisation sur disque.
5. La suppression finale de l'agent avec confirmation et disparition du fichier sur le disque.

---

## Cas

```gherkin
Scénario : Création, modification et suppression d'un agent depuis l'IHM
  Étant donné le navigateur ouvert sur la vue "#/agents"
  Quand l'utilisateur clique sur le bouton "Créer un agent"
  Alors un formulaire s'affiche avec les champs "Nom", "Description", "Profil", "Adapter CLI"
  
  Quand l'utilisateur renseigne :
    | Champ        | Valeur                   |
    | Nom          | "Agent Test E2E"         |
    | Description  | "Agent créé par test E2E"|
    | Profil       | Sélectionne un profil    |
    | Adapter CLI  | "Cursor CLI"             |
  Et clique sur "Enregistrer"
  Alors l'agent apparaît dans le tableau de la liste avec son nom "Agent Test E2E"
  Et le fichier JSON correspondant existe sous ".agents/data/agents/"
  
  Quand l'utilisateur clique sur "Modifier" pour cet agent
  Et remplace le nom par "Agent Test E2E Modifié"
  Et valide la modification
  Alors la liste affiche "Agent Test E2E Modifié"
  Et le fichier JSON sur le disque contient le nom mis à jour
  
  Quand l'utilisateur clique sur "Supprimer" et confirme l'action
  Alors l'agent disparaît immédiatement du tableau
  Et le fichier JSON sur disque est définitivement supprimé
```

---

## Données

| Élément | Valeur |
|---|---:|
| Nom initial | `"Agent Test E2E"` |
| Nom modifié | `"Agent Test E2E Modifié"` |
| CLI sélectionné | `"Cursor CLI"` (`cursor-cli`) |
| Répertoire disque surveillé | `<workspacePath>/.agents/data/agents/` |

---

## Résultat attendu, calculé à la main

| Action | État attendu IHM | État attendu disque |
|:---|:---|:---|
| Création | Ligne présente dans la table | Fichier `<id>.json` créé |
| Modification | Nom mis à jour affiché | `name: "Agent Test E2E Modifié"` |
| Suppression | Ligne absente de la table | Fichier `<id>.json` absent |

---

## Ce que ce cas ne vérifie pas

- Le filtrage du sélecteur d'adapters en TU → `CASE-UI-01-3` ;
- L'intégrité de suppression de profil lié → `CASE-UI-01-11`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_01_10_e2e_agent_crud_lifecycle_and_disk_sync`  
**Fichier :** `tests/e2e/ui/CASE-UI-01-10.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test crée un agent via le formulaire Playwright.
- [ ] Le test vérifie l'existence du fichier JSON sur le filesystem local.
- [ ] Le test modifie puis supprime l'agent en vérifiant le filesystem.
- [ ] Le nom du test contient `CASE_UI_01_10`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
