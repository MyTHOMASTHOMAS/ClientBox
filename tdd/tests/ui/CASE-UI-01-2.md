# CASE-UI-01-2 — Disponibilité et intégrité des formulaires CRUD complets pour les ressources déclaratives

**Spécification :** `SPEC-UI-01`
**Critère d'acceptation :** `AC-UI-01-2`
**Type :** acceptation
**Niveau de risque :** critique
**ADR liés :** `ADR-001`, `ADR-005`, `ADR-013`, ADR-015

## Ce que ce cas protège

L'IHM doit fournir des formulaires de gestion CRUD (Création, Lecture, Modification, Suppression) complets et ergonomiques pour l'ensemble des 5 types de ressources déclaratives : Agents, Profils, Prompts, Conditions Exit et Scénarios (`REQ-009`, `REQ-010`, `REQ-011`, `REQ-012`, `R-07`, `R-36`). Orchestrés par le hook centralisé `use-resources.hook.ts` (`UI-007`), construits à l'aide des composants communs (`UI-012` `button.tsx`, `UI-013` `input.tsx`, `UI-014` `select.tsx`) et intégrés dans les pages fonctionnelles (`UI-027` `agents-page.tsx`, `UI-028` `profiles-page.tsx`, `UI-029` `resources-page.tsx`, `UI-030` `scenarios-page.tsx`), ces formulaires déclaratifs Preact stylisés en Tailwind CSS v4 doivent valider les contraintes obligatoires en direct (assignation d'un profil valide à tout agent, sélection de la politique de profil parmi les 3 modes, saisie du contenu texte d'ordre de sortie `exit`, validation de l'identifiant). Si un formulaire était manquant, incomplet ou ne validait pas les champs requis, les ressources déclaratives ne pourraient pas être configurées de manière intègre depuis l'interface web.

## Cas

```gherkin
Étant donné l'utilisateur accédant aux rubriques de gestion de ClientsBox
Quand il ouvre les formulaires de création ou d'édition pour :
  | ressource      | champs requis                                              |
  | Agent          | identifiant, nom, profilId, cliId                          |
  | Profil         | identifiant, nom, systemPrompt, politique                  |
  | Prompt         | identifiant, nom, contenu                                  |
  | Condition Exit | identifiant, nom, contenu                                  |
  | Scénario       | identifiant, nom, description, payload JSON                |
Alors chaque formulaire affiche l'ensemble des champs requis avec validation en temps réel
Et la politique de profil propose exactement les 3 choix ("chaque_prompt", "debut_scenario", "une_fois_jusqu_a_clear")
Et la soumission d'une ressource valide déclenche son enregistrement via l'API

Étant donné un formulaire soumis avec un champ obligatoire manquant (ex. profilId non sélectionné)
Quand l'utilisateur tente de valider le formulaire
Alors la soumission est bloquée avec mise en surbrillance du champ en erreur
Et un message explicatif en français indique le champ requis manquant
```

## Données

| Élément | Valeur |
|---|---:|
| Ressources couvertes | Agents, Profils, Prompts, Conditions Exit, Scénarios |
| Politiques de profil valides | `"chaque_prompt"`, `"debut_scenario"`, `"une_fois_jusqu_a_clear"` |
| Champ obligatoire agent | `profilId` (assignation obligatoire à exactement un profil existant, R-07) |
| Champs Exit (`EXIT_FORM_FIELDS`) | `['id', 'name', 'contenu']` → payload `{ id, name, content }` (CR-012) |
| Validation formulaire | Blocage immédiat sur champ manquant ou identifiant en collision |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Présence des formulaires CRUD | `5 / 5` types | Agents, Profils, Prompts, Conditions Exit, Scénarios (REQ-009..012) |
| Politiques de profil proposées | `3 choix exacts` | `chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear` (R-06) |
| Blocage sur champ obligatoire omis | `OUI` | Validation côté client empêchant l'envoi de payloads invalides |
| Message de rejet sur collision id | `OUI` en français | Cas limite 1 de SPEC-UI-01 |

## Ce que ce cas ne vérifie pas

- L'exhaustivité de la traduction française des libellés → `CASE-UI-01-1` ;
- Le filtrage du sélecteur CLI sur `cursor-cli` → `CASE-UI-01-3` ;
- La persistance physique des fichiers YAML/JSON sur disque → `SPEC-DATA-01` et `SPEC-DATA-04`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_01_2_crud_forms_availability_and_validation_integrity`
**Fichier :** `tests/tests-unitaires/ui/case-ui-01-2.test.ts`

## Revue du test automatisé

- [ ] Le test valide la présence des champs requis pour les formulaires Agents, Profils, Prompts, Exit et Scénarios.
- [ ] Le test aligne `EXIT_FORM_FIELDS` sur `['id', 'name', 'contenu']` et `buildMutationPayload('exits')` sur `{ id, name, content }` (sans matchers).
- [ ] Le test vérifie que la liste des politiques de profil contient exactement les 3 options requises.
- [ ] Le test vérifie le blocage de la soumission d'un agent sans profil (`profilId` vide).
- [ ] Le test vérifie le comportement sur tentative de création avec identifiant en collision.
- [ ] Le test échoue si un champ obligatoire est omis dans un formulaire.
- [ ] Le nom du test contient `CASE_UI_01_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** CR-012 — Exit = formulaire texte `{ id, name, content }`, isomorphe au Prompt.
