# CASE-UI-01-9 — Validation E2E de la navigation, du routage hashchange et de la conformité 100% français

**Spécification :** `SPEC-UI-01`  
**Critère d'acceptation :** `AC-UI-01-1`, `AC-UI-01-2`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-011`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) que l'application propulsée par Preact et Tailwind CSS v4 (`ADR-013`) offre une navigation fluide, robuste et intégralement localisée en français (`REQ-007`, `C-06`, `UI-004 src/ui/i18n/fr.i18n.ts`) :
1. Parcours complet et sans erreur des 6 rubriques de la barre latérale (*Scénarios, Agents, Profils, Prompts, Conditions Exit, Scripts If*).
2. Vérification que l'historique du navigateur (`Page précédente` / `Page suivante`) et le rechargement de page (`F5`) conservent la vue active gérée par le routeur hash Preact (`UI-001 app.tsx`).
3. Absence totale de libellés ou termes techniques en anglais non traduits dans l'IHM.

---

## Cas

```gherkin
Scénario : Navigation complète à travers les 6 rubriques obligatoires
  Étant donné le serveur HTTP démarré et le navigateur ouvert sur "http://localhost:2974/"
  Quand l'utilisateur clique successivement sur les 6 liens de la barre de navigation :
    | Rubrique          | Hash attendu (Canonique / Alias) | Titre affiché attendu          |
    | Scénarios         | "#/scenarios"                    | "Gestion des Scénarios"        |
    | Agents            | "#/agents"                       | "Gestion des Agents"           |
    | Profils           | "#/profiles" ou "#/profils"      | "Profils d'Agents"             |
    | Prompts           | "#/resources" ou "#/prompts"     | "Ressources Prompts"           |
    | Conditions Exit   | "#/resources/exits" ou "#/exit"  | "Conditions de Sortie (Exit)"  |
    | Scripts If        | "#/resources/scripts" ou "#/if"  | "Scripts Conditionnels (If)"   |
  Alors chaque vue correspondante est rendue avec son titre et son tableau de données
  Et aucun message d'erreur ni texte en langue anglaise n'apparaît dans la page

Scénario : Résilience au rechargement de page F5 et historique de navigation
  Étant donné l'utilisateur naviguant sur "#/agents"
  Quand il recharge la page du navigateur (F5)
  Alors la vue des agents est réhydratée sans redirection involontaire
  Quand il utilise le bouton "Précédent" du navigateur
  Alors la vue précédente est réaffichée sans crash
```

---

## Données

| Élément | Valeur |
|---|---:|
| URL de départ | `http://localhost:2974/` |
| 6 rubriques obligatoires | `Scénarios`, `Agents`, `Profils`, `Prompts`, `Conditions Exit`, `Scripts If` |
| Conformité linguistique | Zéro mot anglais (aucun `Submit`, `Edit`, `Cancel`, `Loading`) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Rubriques fonctionnelles | `6/6` | Vérification de chaque lien et vue |
| Mots anglais détectés | `0` | Scan textuel de la page via Playwright |

---

## Ce que ce cas ne vérifie pas

- Les actions de modification dans les formulaires → `CASE-UI-01-10` ;
- Le canvas interactif → `CASE-UI-02-11`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_01_9_e2e_navigation_and_french_localization`  
**Fichier :** `tests/e2e/ui/CASE-UI-01-9.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test clique sur chaque rubrique de navigation.
- [ ] Le test vérifie l'URL hash et le titre H1/H2 affiché.
- [ ] Le test vérifie le rechargement F5 sur une vue spécifique.
- [ ] Le test vérifie l'absence de terme anglais visible dans le DOM.
- [ ] Le nom du test contient `CASE_UI_01_9`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
