# CASE-UI-01-13 — Composant générique d'autocomplétion libre à recherche modulaire locale/distante

**Spécification :** `SPEC-UI-01`  
**Critère d'acceptation :** `AC-UI-01-5`  
**Type :** acceptation / composant  
**Niveau de risque :** modéré  
**ADR liés :** `ADR-013`, `ADR-015`  
**Modules cibles :** `UI-049` (`autocomplete-input.tsx`)

---

## Ce que ce cas protège

Dans les formulaires et l'inspecteur de blocs du Studio, la saisie d'identifiants de ressources (`agentId`, `promptId`, `exitId`, `ifScriptId`, `profilId`) est source d'erreurs de frappe lorsqu'elle repose uniquement sur des champs texte bruts.

Ce cas garantit, dans l'environnement Preact / Tailwind CSS v4 (`UI-049 autocomplete-input.tsx`) :

1. **Recherche modulaire synchrone & asynchrone :** L'appel à la fonction de recherche injectée `search(query)` produit une liste de suggestions `{ value, label?, description?, badge? }` affichée dans un menu flottant (`data-section="autocomplete-dropdown"`).
2. **Déploiement immédiat dès le focus ou le clic :** Dès la prise de focus (`onFocus`) ou lors d'un clic (`onClick`), une recherche initiale sans filtre est déclenchée pour afficher la liste intégrale des suggestions existantes, sans imposer une première frappe clavier.
3. **Pré-remplissage à la sélection :** Le clic sur un élément de suggestion (`[data-suggestion-value="..."]`) ou sa sélection au clavier avec la touche <kbd>Entrée</kbd> pré-remplit la valeur du champ et déclenche `onChange(suggestion.value)`.
4. **Saisie libre stricte (Freeform non bloquant) :** Si l'utilisateur saisit manuellement une valeur non présente dans la liste de suggestions, celle-ci est conservée et émise en temps réel via `onChange` sans avertissement ni blocage.
5. **Maintien d'une valeur contrôlée vide :** Lorsque la prop `value` est transmise vide (`value=""`) ou après un effacement complet du champ, la valeur affichée est strictement vide sans aucune résurgence ou restauration de l'état interne préalable.
6. **Navigation clavier :** L'appui sur les touches <kbd>ArrowDown</kbd> et <kbd>ArrowUp</kbd> modifie l'index de surbrillance active (`aria-selected="true"`), et la touche <kbd>Enter</kbd> sélectionne la suggestion active. L'appui sur <kbd>ArrowDown</kbd> sur un menu fermé le déploie immédiatement.
7. **Fermeture contrôlée :** La touche <kbd>Escape</kbd> ou la perte de focus (`onBlur`) referme le menu déroulant sans modifier la valeur du champ (`e.stopPropagation()` appliqué sur Échap).
8. **Résilience aux courses d'asynchronisme :** Les requêtes lentes obsolètes ne peuvent écraser les résultats d'une frappe plus récente.
9. **Lecture seule et désactivation :** Lorsque `disabled={true}` ou `readOnly={true}`, aucun menu déroulant n'est déployé et aucune recherche n'est initiée.

---

## Cas

```gherkin
Scénario : Déploiement des suggestions dès la prise de focus ou le clic
  Étant donné un composant AutocompleteInput initialisé avec des suggestions
  Quand l'utilisateur donne le focus au champ ou clique dessus
  Alors la recherche est déclenchée sans filtre
  Et le menu déroulant data-section="autocomplete-dropdown" est immédiatement déployé

Scénario : Déploiement des suggestions lors d'une recherche locale synchrone
  Étant donné un composant AutocompleteInput initialisé avec une fonction de recherche locale
  Quand l'utilisateur saisit la requête "code"
  Alors le menu déroulant data-section="autocomplete-dropdown" est visible
  Et il contient les suggestions correspondant au filtre (ex: "agent-codeur")

Scénario : Pré-remplissage lors du clic sur une suggestion
  Étant donné un menu d'autocomplétion ouvert affichant une suggestion "prompt-generation"
  Quand l'utilisateur clique sur l'élément de suggestion
  Alors la valeur de l'input devient "prompt-generation"
  Et le callback onChange est notifié avec "prompt-generation"
  Et le menu déroulant est fermé

Scénario : Maintien intégral de la saisie libre sans rejet
  Étant donné un composant AutocompleteInput
  Quand l'utilisateur saisit "valeur-custom-totalement-inconnue"
  Alors la valeur du champ est "valeur-custom-totalement-inconnue"
  Et onChange est appelé avec "valeur-custom-totalement-inconnue"
  Et aucune erreur de validation bloquante n'est émise

Scénario : Maintien strict de la valeur contrôlée vide après effacement
  Étant donné un composant AutocompleteInput contrôlé recevant la valeur ""
  Quand le composant est rendu ou que le champ est vidé
  Alors la valeur affichée du champ est strictement ""
  Et aucune ancienne valeur interne n'est réinjectée

Scénario : Navigation au clavier et sélection par Entrée
  Étant donné un menu d'autocomplétion ouvert avec 3 suggestions
  Quand l'utilisateur appuie deux fois sur ArrowDown puis sur Enter
  Alors la deuxième suggestion est sélectionnée et pré-remplie dans le champ
  Et le menu est fermé

Scénario : Fermeture du menu sur Échap sans altération de la saisie
  Étant donné un menu d'autocomplétion ouvert et le champ contenant "agent-"
  Quand l'utilisateur appuie sur Escape
  Alors le menu est masqué
  Et le champ conserve la valeur "agent-"
```

---

## Données

| Élément | Valeur |
|---|---|
| Sélecteur conteneur | `[data-component="autocomplete-input"]` |
| Sélecteur dropdown | `[data-section="autocomplete-dropdown"]` |
| Sélecteur suggestion | `[data-suggestion-value]` |
| Type suggestion | `{ value: string; label?: string; description?: string; badge?: string }` |
| Composant cible | `src/ui/components/common/autocomplete-input.tsx` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Déploiement dropdown sur focus / clic | Ouvert (`showDropdown = true`) | Recherche sans filtre exécutée |
| Suggestions rendues pour "code" | Filtrées selon `query` | Résultat de `searchFn("code")` |
| Valeur champ après sélection suggestion | `suggestion.value` | Pré-remplissage direct |
| Valeur champ contrôlé vide | `""` strict | `props.value = ""` prioritaire |
| Valeur champ après saisie libre quelconque | Texte brut saisi | Absence de filtre d'exclusion |
| État dropdown après Escape ou Blur | Non rendu (`null`) | Fermeture isolée |
| État dropdown si `disabled` ou `readOnly` | Non rendu (`null`) | Pas d'activation en lecture seule |

---

## Ce que ce cas ne vérifie pas

- L'enregistrement persistant sur le disque des ressources sélectionnées → `SPEC-DATA-01` ;
- L'algorithme d'exécution du graphe de scénario → `SPEC-ENG-01` ;
- La suppression des blocs sur le canvas → `CASE-UI-02-17`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_01_13_autocomplete_generic_input_modular_search_and_freeform`  
**Fichier :** `tests/units/ui/CASE-UI-01-13.test.ts`

## Revue du test automatisé

- [x] Le test vérifie le rendu de base du composant avec `label`, `placeholder` et `value`.
- [x] Le test vérifie le déploiement immédiat des suggestions dès la prise de focus ou le clic.
- [x] Le test vérifie le maintien strict d'une valeur contrôlée vide (`value=""`) sans résurgence.
- [x] Le test vérifie l'affichage des suggestions synchrones locales.
- [x] Le test vérifie l'exécution d'une recherche asynchrone (retour `Promise`).
- [x] Le test vérifie le pré-remplissage et la notification `onChange` lors du clic sur une suggestion.
- [x] Le test vérifie que la saisie libre est acceptée et transmise en temps réel.
- [x] Le test vérifie la navigation au clavier (<kbd>ArrowDown</kbd>, <kbd>ArrowUp</kbd>, <kbd>Enter</kbd>, <kbd>Escape</kbd>).
- [x] Le test vérifie la fermeture à la perte de focus (`onBlur`).
- [x] Le test vérifie l'inactivité du menu déroulant en mode `readOnly` ou `disabled`.
