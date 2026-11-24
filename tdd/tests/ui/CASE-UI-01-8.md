# CASE-UI-01-8 — Cycle de vie, démontage Preact (unmount) et nettoyage complet des abonnements et écouteurs

**Spécification :** `SPEC-UI-01`  
**Critère d'acceptation :** `AC-UI-01-1`, `AC-UI-01-2`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-001`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Pour éviter les fuites de mémoire dans les applications monopages (*SPA*) et les doublons d'écouteurs d'événements lors des transitions entre vues, le point d'entrée applicatif racine (`UI-001 app.tsx`), les hooks d'état (`UI-011 use-modal.hook.ts`) et les pages applicatives (`UI-027..UI-031`) doivent respecter un cycle de vie strict basé sur le VDOM Preact (`ADR-013`).
Ce cas garantit :
1. Que le montage applicatif `mountApp(rootEl)` monte l'arborescence Preact `<App />` et initialise l'écouteur `hashchange`.
2. Que la fonction de démontage `unmountApp(rootEl)` (invoquant `render(null, rootEl)`) détache l'écouteur `window` 'hashchange' via `removeEventListener`, démonte proprement l'arbre Preact et purge les gestionnaires d'actions `[data-action]`.
3. Que chaque composant de vue applicative nettoie rigoureusement ses abonnements asynchrones, requêtes en cours et écouteurs d'événements locaux lors de son démontage via la fonction de retour des hooks `useEffect`.

---

## Cas

```gherkin
Étant donné l'application Preact montée via "mountApp(rootEl)"
Quand "unmountApp(rootEl)" est invoqué
Alors l'arbre Preact est démonté via render(null, rootEl)
Et l'écouteur window 'hashchange' est retiré via removeEventListener
Et un clic ultérieur sur un bouton "[data-action]" ne déclenche plus aucun traitement

Étant donné une vue applicative de liste d'agents (composant Preact "AgentsPage") montée avec son client HTTP
Quand le composant est démonté par Preact
Alors les fonctions de nettoyage de "useEffect" sont exécutées
Et tous les abonnements et requêtes en attente sont annulés
Et le conteneur DOM est libéré sans fuite mémoire
```

---

## Données

| Élément | Valeur |
|---|---:|
| Point de montage racine | `mountApp(rootEl: HTMLElement): void` / `<App />` |
| Démontage racine | `unmountApp(rootEl: HTMLElement): void` via `render(null, rootEl)` |
| Écouteur de routage | `window.addEventListener('hashchange', ...)` / `removeEventListener` |
| Nettoyage des composants | Fonctions de retour de `useEffect` (annulation requêtes / libération) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Écouteurs window.hashchange post-unmount | `0 écouteur actif ClientsBox` | Suppression par `removeEventListener` |
| Nettoyage du conteneur racine | Conteneur vidé | Démontage virtuel via `render(null, rootEl)` |
| Nettoyage des effets de composants | `100 % des cleanups invoqués` | Vérification des retours de `useEffect` |

---

## Ce que ce cas ne vérifie pas

- L'affichage graphique des listes → `CASE-UI-01-4` ;
- Le canvas interactif SVG → `CASE-UI-02-7`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_01_8_ui_views_lifecycle_and_unmount_cleanup`  
**Fichier :** `tests/units/ui/case-ui-01-8.test.ts`  

## Revue du test automatisé

- [ ] Le test monte `app.tsx` via `mountApp(rootEl)` et simule un clic `[data-action]`.
- [ ] Le test appelle `unmountApp(rootEl)` et vérifie que `render(null, rootEl)` libère le conteneur et détache le routeur.
- [ ] Le test vérifie que chaque vue exécute ses fonctions de nettoyage `useEffect` lors du démontage.
- [ ] Le nom du test contient `CASE_UI_01_8`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*
  
