# CASE-UI-01-1 — Exhaustivité de la langue française sur tous les composants, menus, libellés et messages de l'interface utilisateur

**Spécification :** `SPEC-UI-01`
**Critère d'acceptation :** `AC-UI-01-1`
**Type :** acceptation
**Niveau de risque :** critique
**ADR liés :** `ADR-001`, `ADR-013`, ADR-015

## Ce que ce cas protège

L'ensemble de l'interface utilisateur web de ClientsBox est contractuellement exigé en langue française (`C-06`, `REQ-007`). Cela s'applique à la navigation, aux titres de rubriques, aux menus, aux formulaires, aux boutons d'actions, aux infobulles ainsi qu'à tous les messages d'erreur et de confirmation. Ce cas garantit que l'arbre de composants déclaratifs Preact et le design system Tailwind CSS v4 reposent exclusivement sur le catalogue linguistique centralisé (`UI-004` `src/ui/i18n/fr.i18n.ts`), sans aucun libellé en anglais dans le chrome UI (ex. "Submit", "Cancel", "Save scenario", messages d'exception bruts non traduits).

## Cas

```gherkin
Étant donné un utilisateur ouvrant l'application ClientsBox sur son navigateur
Quand chaque vue principale est chargée (Scénarios, Agents, Profils, Prompts, Conditions Exit)
Alors 100% des menus, onglets, en-têtes et boutons de navigation (chrome UI) sont affichés en français
Et aucun libellé de la liste noire anglaise ("Submit", "Cancel", "Save", "Delete", "Settings", "Loading", "Error") n'est présent dans le DOM
Et seuls les termes techniques autorisés de la liste blanche ("Start", "Run", "If", "cursor-cli", "claude-code", "gemini", "copilot", "qwen-coder", "JSON", "CLI", "DOM", "URL") peuvent apparaître

Étant donné une action utilisateur provoquant une validation en échec ou une erreur système
Quand le message d'alerte ou de diagnostic s'affiche
Alors le texte du message est intégralement rédigé en français
Et aucune exception technique brute en anglais n'est exposée à l'utilisateur sans traduction
```

## Données

| Élément | Valeur |
|---|---:|
| Langue imposée | `Français (fr-FR)` |
| Vues inspectées | Accueil, Scénarios, Agents, Profils, Prompts, Exit, Paramètres |
| Composants contrôlés | Boutons, modales, infobulles, labels formulaires, toasts d'erreur |
| Liste noire UI chrome anglais interdite | `["Submit", "Cancel", "Save", "Delete", "Settings", "Loading", "Error"]` (0 occurrence) |
| Liste blanche jargon technique tolérée | `["Start", "Run", "If", "cursor-cli", "claude-code", "gemini", "copilot", "qwen-coder", "JSON", "CLI", "DOM", "URL"]` |
| Présence de chaînes anglaises chrome UI | `0 occurrence` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Taux de couverture de la langue française | `100 %` | Tous les éléments textuels de l'UI sont traduits (C-06, REQ-007) |
| Détection de termes de la deny-list | `0` | Aucun terme de la deny-list présent dans le chrome UI |
| Tolérance termes techniques allow-list | `OUI` | Les noms de CLI et types de blocs Start/Run/If ne déclenchent pas de faux positif |
| Messages d'erreur et confirmations en français | `OUI` | Validation des messages et diagnostics traduits |
| Présence de textes hardcodés en anglais | `0` | Exclusion stricte de tout libellé étranger |

## Ce que ce cas ne vérifie pas

- Le comportement fonctionnel des formulaires CRUD → `CASE-UI-01-2` ;
- Le filtrage du sélecteur de CLI → `CASE-UI-01-3` ;
- Le rendu du terminal live → `CASE-UI-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_01_1_full_french_language_coverage_on_ui`
**Fichier :** `tests/tests-unitaires/ui/case-ui-01-1.test.ts`

## Revue du test automatisé

- [ ] Le test inspecte l'ensemble des dictionnaires / constantes textuelles de l'IHM et vérifie leur langue française.
- [ ] Le test vérifie l'absence de chaînes de la deny-list ("Submit", "Cancel", "Save", etc.) sur les boutons, menus et onglets.
- [ ] Le test autorise explicitement les termes de l'allow-list technique ("Start", "Run", "If", "cursor-cli", etc.).
- [ ] Le test vérifie que les messages d'erreur et de confirmation sont formulés en français.
- [ ] Le test échoue si un libellé non traduit en français est détecté.
- [ ] Le nom du test contient `CASE_UI_01_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

