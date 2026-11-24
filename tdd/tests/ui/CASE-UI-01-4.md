# CASE-UI-01-4 — Structure de navigation globale en français, montage racine et vues de liste

**Spécification :** `SPEC-UI-01`
**Critère d'acceptation :** `AC-UI-01-1`, `AC-UI-01-2`
**Type :** acceptation
**Niveau de risque :** élevé
**ADR liés :** `ADR-001`, `ADR-013`, ADR-015

## Ce que ce cas protège

L'interface utilisateur web hébergée de ClientsBox doit proposer une navigation cohérente en langue française via un composant de mise en page réactif (`UI-018 app-layout.tsx` et `UI-019 sidebar.tsx`), un point d'entrée racine Preact TSX (`UI-001 app.tsx`), le composant tabulaire réutilisable (`UI-016 data-table.tsx`) et des pages fonctionnelles dédiées (`UI-027 agents-page.tsx`, `UI-028 profiles-page.tsx`, `UI-029 resources-page.tsx`, `UI-030 scenarios-page.tsx`). Ce cas garantit que les 6 rubriques fondamentales du CDC sont accessibles en français et que le montage initial monte l'arbre de composants Preact `<App />` sur l'élément racine en appliquant le design system Tailwind CSS v4 et en initialisant le routage client.

## Cas

```gherkin
Étant donné le composant Preact de layout principal "<AppLayout />"
Quand il est instancié et rendu
Alors il retourne une structure contenant les 6 rubriques de navigation obligatoires en français :
  "Scénarios", "Agents", "Profils", "Prompts", "Conditions Exit", "Scripts If"
Et aucun texte en langue anglaise n'apparaît dans les libellés de navigation (REQ-007, C-06)

Étant donné la page des agents "AgentsPage"
Quand elle reçoit une collection d'agents existants
Alors elle affiche un tableau avec les colonnes "Nom", "Profil", "CLI"
Et elle fournit les boutons d'action "Créer", "Modifier", "Supprimer" en français

Étant donné la page des profils "ProfilesPage"
Quand elle reçoit une collection de profils
Alors elle affiche la liste des profils avec leur politique d'envoi ("chaque_prompt", "debut_scenario", "une_fois_jusqu_a_clear")
Et elle propose les contrôles CRUD en français

Étant donné un élément DOM racine fourni à "mountApp(rootEl)"
Quand la fonction de montage est exécutée
Alors l'arbre de composants Preact "<App />" est monté dans l'élément racine
Et le routeur de vues est initialisé
Et les attributs sémantiques [data-action] sont prêts à être manipulés
```

## Données

| Élément | Valeur |
|---|---:|
| 6 rubriques obligatoires | `Scénarios`, `Agents`, `Profils`, `Prompts`, `Conditions Exit`, `Scripts If` (`REQ-012`, `C-06`) |
| Actions CRUD IHM | `Créer`, `Modifier`, `Supprimer`, `Enregistrer`, `Annuler` |
| Politiques affichées | `Chaque prompt`, `Début de scénario`, `Une fois jusqu'à clear` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre de rubriques de navigation | `6 rubriques` | Alignement strict CDC §6 |
| Langue des libellés et boutons | `100 % français` | Respect de `REQ-007` et `C-06` |
| Montage applicatif `mountApp` | Initialisation effective | DOM monté et écouteurs attachés |

## Ce que ce cas ne vérifie pas

- L'éditeur interactif du canvas de graphe → `CASE-UI-02-1` ;
- Le streaming dans le composant terminal web → `CASE-UI-03-1` ;
- La validation des règles de suppression d'agents → `CASE-DATA-01-5`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_01_4_global_layout_navigation_and_list_views_compliance`
**Fichier :** `tests/ui/CASE-UI-01-4.test.ts` (ou `tests/ui/views-layout-and-lists.test.ts`)

## Revue du test automatisé

- [ ] Le test valide la présence des 6 sections de navigation en français dans `<AppLayout />`.
- [ ] Le test valide le rendu de `AgentsPage` avec ses colonnes et boutons d'action.
- [ ] Le test valide le rendu de `ProfilesPage` et l'affichage des politiques.
- [ ] Le test valide le montage initial de `<App />` via `mountApp`.
- [ ] Le nom du test contient `CASE_UI_01_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** Autrement (`U`)  
**Remarques :** Spécification formelle de `UI-001`, `UI-016`, `UI-018`, `UI-019`, `UI-027..030` (`signature-ui.md`).
