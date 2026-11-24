# Analyse d'impact — CR-002 (Composant Générique d'Autocomplétion & Saisie Assistée)

**Demande du client :** Créer un composant générique d'autocomplétion (`<AutocompleteInput />`) pour la sélection assistée de profils, prompts, agents, conditions exit et scripts. Le composant doit disposer d'une fonction de recherche modulable (compatible données locales en mémoire et distantes en ligne) et d'un comportement de pré-remplissage à la sélection tout en conservant une saisie libre non bloquante (l'utilisateur peut forcer n'importe quelle valeur en dehors des suggestions).  
**Reçue le :** 06/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Branche Git dédiée :** `feat/autocomplete-input`  

---

> **Interdiction de modifier le code avant que cette analyse soit complète.**
>
> La modification descend la chaîne dans cet ordre : cahier des charges → specs →
> signatures / architecture → cas de test → tests automatisés → code. Commencer par le code,
> c'est perdre la trace de pourquoi il a changé — et c'est exactement ce que ce
> module cherche à vous faire éviter.

---

## 1. Ce que le client demande, reformulé

Le client demande d'éliminer la friction et le risque d'erreur de saisie manuelle des identifiants déclaratifs (`agentId`, `promptId`, `exitId`, `ifScriptId`, `profilId`) dans l'ensemble de l'IHM web ClientsBox (Studio de scénarios et modales de gestion).

Pour ce faire, le besoin s'articule autour de 4 exigences clés :
1. **Généricité et réutilisabilité :** Développer un composant d'entrée générique dans les primitives partagées (`src/ui/components/common/`) capable de se substituer de manière transparente à un `<input type="text" />`.
2. **Recherche modulaire et agnosticisme des données :** La logique de recherche de suggestions doit être injectée sous forme de fonction modulaire (`searchFn: (query: string) => Promise<Suggestion[]> | Suggestion[]`), permettant d'interroger aussi bien des collections statiques locales en mémoire vive que des endpoints REST distants.
3. **Pré-remplissage ergonomique :** La sélection d'une suggestion parmi la liste déroulante injecte immédiatement la valeur dans le champ.
4. **Saisie libre stricte (Open/Freeform input) :** Aucune validation restrictive ne doit forcer l'utilisateur à choisir obligatoirement une suggestion de la liste. L'utilisateur conserve la pleine liberté de saisir et conserver une valeur personnalisée inédite.

---

## 2. Questions posées au client & Décisions actées

| # | Question | Réponse / Décision |
|---|---|---|
| 1 | Le composant doit-il bloquer la saisie si la valeur n'existe pas dans les suggestions ? | **Non.** Saisie libre intégrale : la sélection pré-remplit le champ, mais l'utilisateur peut forcer n'importe quelle chaîne sans rejet. |
| 2 | La recherche doit-elle être synchrone ou asynchrone ? | **Les deux.** La fonction de recherche accepte un retour direct `readonly Suggestion[]` ou une `Promise<readonly Suggestion[]>`, avec debounce configurable pour les appels distants. |
| 3 | Comment gérer la fermeture de la liste déroulante ? | Fermeture sur sélection d'un item, appui sur la touche <kbd>Échap</kbd>, ou clic à l'extérieur du composant (*click outside*). |
| 4 | Quel comportement à la navigation clavier ? | Les flèches <kbd>↓</kbd> / <kbd>↑</kbd> parcourent les suggestions en surbrillance, la touche <kbd>Entrée</kbd> sélectionne la suggestion active. |
| 5 | Quel emplacement architectural retenir ? | `src/ui/components/common/autocomplete-input.tsx` (Composant de présentation VDOM Niveau 2). |

---

## 3. Impact — Cahier des charges (CDC v2)

| Exigence | Impact | Action |
|---|---|---|
| `REQ-007` (IHM ergonomique en français) | **Renforcée** | Intégration d'un composant de saisie prédictive réduisant les fautes de frappe sur les identifiants de flux. |
| `REQ-011` (CRUD ressources déclaratives) | **Complétée** | Facilite la sélection des liaisons sans altérer les formats déclaratifs stockés sous `.agents/data/`. |
| `REQ-014` (Canvas de blocs & inspecteur) | **Complétée** | Permet l'autocomplétion des champs d'inspection de blocs (`agentId`, `promptId`, `exitId`, `ifScriptId`) dans le Studio. |
| Reste du CDC (`REQ-001` à `REQ-038`, NFR) | Inchangées | Aucun impact sur le moteur de flux, le CLI adapter ou la persistance disque. |

---

## 4. Impact — Spécifications fonctionnelles

| Spécification | Impact | Ce qui change exactement |
|---|---|---|
| [`SPEC-UI-01`](../specs/UI.md#spec-ui-01--ihm-en-français-navigation-et-formulaires-de-gestion-crud) | **Modifiée** | Ajout dans la règle et la portée du composant générique d'autocomplétion `<AutocompleteInput />` dans les primitives communes. Ajout de scénarios Gherkin pour la recherche, le pré-remplissage et la saisie libre. Ajout du critère d'acceptation **`AC-UI-01-5`**. Passage en version v1.2. |
| [`SPEC-UI-02`](../specs/UI.md#spec-ui-02--canvas-dorchestration-visuel-style-n8n) | **Inchangée au fond** | Bénéficie de l'autocomplétion dans l'inspecteur tout en respectant strictement `AC-UI-02-1` et `AC-UI-02-10`. |
| [`tdd/specs/sommaire.md`](../specs/sommaire.md) | **Modifiée** | Indexation de la spécification du composant d'autocomplétion et du critère `AC-UI-01-5`. |

---

## 5. Impact — Conception & Architecture technique

| Artefact | Impact | Ce qui change |
|---|---|---|
| [`tdd/docs/signature/signature-ui.md`](../signature/signature-ui.md) | **Modifié** | §4.3 Primitives VDOM : ajout du composant `<AutocompleteInput />` (`UI-049`) et des contrats de types `AutocompleteSuggestion` et `AutocompleteInputProps`. |
| Couplage & DAG (`SPEC-ARCH-01`) | **Inchangé** | Composant pur UI Niveau 2 : zéro dépendance vers les contrôleurs ou les services applicatifs. |
| Volumétrie (`SPEC-ARCH-05`) | **Conforme** | Taille cible `<AutocompleteInput />` $\le 200$ lignes TSX (sous le plafond de 250 lignes TSX). |
| Complexité cyclomatique (`SPEC-ARCH-07`) | **Conforme** | Décomposition des gestionnaires clavier/recherche : $CC \le 10$ et niveau d'imbrication $\le 3$. |
| Conventions de nommage (`SPEC-ARCH-07`) | **Conforme** | Nom de fichier : `src/ui/components/common/autocomplete-input.tsx` (kebab-case strict per `CASE-ARCH-07-2`). |
| Documentation TSDoc (`SPEC-ARCH-07`) | **Conforme** | TSDoc complet sur chaque type et composant exporté, zéro effet de bord à l'importation (`CASE-ARCH-07-3`). |

---

## 6. Impact — Tests

| Cas de test | Impact | Description |
|---|---|---|
| `CASE-UI-01-13.md` *(nouveau)* | **À créer** | Spécification TDD du cas de test `CASE-UI-01-13` couvrant l'ensemble du cycle de vie du composant `<AutocompleteInput />`. |
| `tests/units/ui/CASE-UI-01-13.test.ts` *(nouveau)* | **À écrire** | Test unitaire automatisé Vitest (recherche synchrone, asynchrone avec debounce, clic de sélection, navigation clavier, saisie libre et verrouillage lecture seule). |
| `tdd/tests/ui/sommaire.md` | **Modifié** | Indexation du nouveau cas `01-13`. |
| Tests existants (139 fichiers, 151 tests) | Inchangés | Aucune régression admise sur le socle existant. |

---

## 7. Impact — Code source

| Fichier / Module | Impact | Description |
|---|---|---|
| `src/ui/components/common/autocomplete-input.tsx` | **Création** | Composant Preact déclaratif avec menu flottant Tailwind CSS v4, gestion des événements clavier et support de recherche modulaire. |
| `src/ui/components/canvas/inspector-panel.tsx` | **Évolution** | Intégration progressive de l'autocomplétion sur les champs d'ID (`agentId`, `promptId`, `exitId`, `ifScriptId`) avec fonction de recherche locale ou distante. |

---

## 8. Effets de bord identifiés & Solutions

1. **Conflit entre blur de l'input et clic sur une suggestion :**
   * *Risque :* Si le menu se ferme immédiatement sur l'événement `onBlur` de l'input texte, l'événement `onClick` / `onMouseDown` sur l'item de suggestion risque de ne jamais se déclencher.
   * *Solution :* Utiliser `onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}` sur les suggestions pour capturer la sélection avant la perte de focus de l'input.
2. **Ordre des réponses asynchrones (Race Conditions) :**
   * *Risque :* Une requête lente pour la lettre "a" peut résoudre après une requête rapide pour "agent", écrasant les suggestions les plus récentes.
   * *Solution :* Maintien d'un identifiant de séquence ou d'un drapeau d'annulation à chaque nouvelle frappe pour ne prendre en compte que la dernière requête émise.
3. **Collision avec la touche Échap et Suppr :**
   * *Risque :* Confondre la fermeture du menu avec la suppression de bloc dans le canvas.
   * *Solution :* `e.stopPropagation()` sur la touche <kbd>Échap</kbd> lorsque le menu d'autocomplétion est ouvert pour refermer uniquement les suggestions sans impacter le reste du Studio.

---

## 9. Ce que nous ne ferons pas dans cette passe

* Pas de pagination infinie complexe dans le dropdown : un affichage limité aux 8 à 10 meilleures correspondances est ergonomiquement optimal.
* Pas de validation restrictive obligatoire : la valeur saisie reste 100% libre per directive utilisateur.

---

## 10. Ordre d'exécution retenu (Chaîne TDD)

| # | Étape | Livrable |
|---|---|---|
| 1 | **Spécifications** | Mise à jour de `tdd/specs/UI.md` (`SPEC-UI-01` v1.2, `AC-UI-01-5`) et `tdd/specs/sommaire.md`. |
| 2 | **Signatures techniques** | Mise à jour de `tdd/docs/signature/signature-ui.md` avec `AutocompleteSuggestion` et `AutocompleteInputProps`. |
| 3 | **Fiche de Cas de Test** | Rédaction de `tdd/tests/ui/CASE-UI-01-13.md` et mise à jour de `tdd/tests/ui/sommaire.md`. |
| 4 | **Test automatisé (Rouge)** | Rédaction de `tests/units/ui/CASE-UI-01-13.test.ts` et validation de son échec initial. |
| 5 | **Code de production (Vert)** | Implémentation de `src/ui/components/common/autocomplete-input.tsx`. |
| 6 | **Intégration & Qualité** | Intégration dans `InspectorPanel`, recompilation des assets embarqués, vérification complète des tests et de la qualité (`npm run test:unit`, `npm run quality`). |

