# CASE-UI-01-7 — Modale d'inspection de scripts en lecture seule et passivité réseau per REQ-011

**Spécification :** `SPEC-UI-01`, `SPEC-DATA-02`  
**Critère d'acceptation :** `AC-UI-01-1`, `AC-DATA-02-1`  
**Type :** acceptation / composant  
**Niveau de risque :** modéré  
**ADR liés :** `ADR-001`, `ADR-013`, `ADR-015`  

---

## Ce que ce cas protège

La modale d'inspection de scripts et de ressources déclaratives (composant Preact déclaratif `<Modal />` `UI-015 components/common/modal.tsx` intégré dans `UI-029 pages/resources-page.tsx`) permet d'afficher en lecture seule le code source des scripts conditionnels If ou des prompts (`REQ-011`, `ADR-013`, `ADR-015`). Ce cas garantit :
1. Que le composant est strictement passif (il ne réalise aucun appel réseau `fetch` en interne et reçoit directement ses propriétés `title`, `sourceCode`, `isOpen`, `onClose`).
2. Que le code source est rendu dans un élément préformaté `<pre><code>` non éditable, stylisé via Tailwind CSS v4 et les tokens du Design System (fond sombre `surface-panel` / `--color-surface-panel`, police monospace *JetBrains Mono* lisible per `ADR-015`).
3. Que la modale offre les mécanismes standards de fermeture : bouton « Fermer » en français (`REQ-007`), touche clavier `Echap` (`Escape`) avec nettoyage d'écouteur via le retour de `useEffect`, et clic sur le fond sombre semi-transparent (*backdrop*).

---

## Cas

```gherkin
Étant donné le composant Preact "<Modal />" rendu avec les propriétés :
  | prop       | valeur                                   |
  | title      | "Vérification Solde (solde-check.js)"   |
  | sourceCode | "return sac['0'] > 0;"                  |
  | isOpen     | true                                     |
Quand la modale est montée dans le DOM
Alors un overlay modal est injecté avec le titre et le code source dans une balise <pre>
Et le texte n'est pas modifiable (élément passif non éditable)
Et aucun appel réseau HTTP n'est déclenché par le composant
Et la feuille de style "app.css" déclare les animations de transition "@keyframes modalFadeIn" et "@keyframes modalSlideUp"
Et la boîte de dialogue modale possède les attributs d'accessibilité role="dialog" et aria-modal="true"

Étant donné la modale ouverte
Quand l'utilisateur appuie sur la touche clavier "Escape"
Alors le callback "onClose()" est déclenché
Et l'écouteur d'événement clavier attaché par "useEffect" est nettoyé au démontage
```

---

## Données

| Élément | Valeur |
|---|---:|
| Titre de test | `"Vérification Solde (solde-check.js)"` |
| Code source de test | `"return sac['0'] > 0;"` |
| Bouton de fermeture | Libellé `"Fermer"` en français (`REQ-007`) |
| Touche de fermeture | Touche `'Escape'` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Requêtes réseau internes | `0` | Composant d'affichage passif |
| Démontage DOM à la fermeture | Nœud retiré | Nettoyage complet des éléments et listeners |

---

## Ce que ce cas ne vérifie pas

- L'appel HTTP `GET /api/if/:id` et le flux E2E complet de consultation → `CASE-UI-01-12` ;
- Le canvas nodale sous-jacent → `CASE-UI-02-1`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_01_7_script_viewer_modal_passive_rendering`  
**Fichier :** `tests/units/ui/case-ui-01-7.test.ts`  

## Revue du test automatisé

- [ ] Le test monte la modale avec un titre et du code source.
- [ ] Le test vérifie l'absence d'appel réseau.
- [ ] Le test vérifie la fermeture par la touche Escape.
- [ ] Le test vérifie la fermeture par le bouton Fermer.
- [ ] Le nom du test contient `CASE_UI_01_7`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
