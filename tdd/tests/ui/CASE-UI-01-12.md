# CASE-UI-01-12 — Validation E2E de la consultation de script If via la modale de lecture seule

**Spécification :** `SPEC-UI-01`, `SPEC-DATA-02`  
**Critère d'acceptation :** `AC-UI-01-1`, `AC-DATA-02-1`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-001`, `ADR-011`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Conformément à l'exigence `REQ-011` et à la décision issue de la Partie 75, les scripts conditionnels JavaScript (`if`) sont modifiés en dehors de l'interface graphique (via l'éditeur externe du développeur), mais l'IHM doit permettre d'en consulter le code source à tout moment. Ce cas valide dans un vrai navigateur que, dans l'application Preact stylisée avec Tailwind CSS v4 (`ADR-013`) :
1. Dans la liste des scripts If (`#/if`), un clic sur l'action « Consulter » déclenche l'appel réseau `GET /api/if/:id`.
2. Le composant modal Preact `<Modal />` (`UI-015 components/common/modal.tsx` intégré dans `UI-029 pages/resources-page.tsx`) s'affiche avec le titre du script et son contenu exact.
3. Le code est non modifiable (lecture seule pure dans un bloc `<pre><code>`).
4. La modale se ferme correctement au clic sur le bouton « Fermer », au clic extérieur sur le backdrop, ou par appui sur la touche `Echap`.

---

## Cas

```gherkin
Scénario : Consultation d'un script If depuis la liste des ressources
  Étant donné un script ".agents/data/if/check-status.js" présent sur disque
  Et le navigateur ouvert sur la page des scripts If "#/if"
  Quand l'utilisateur clique sur le bouton "Consulter" en face de "check-status"
  Alors une modale s'ouvre au centre de l'écran avec le titre "Script If : check-status.js"
  Et le code source affiché correspond exactement au contenu du fichier sur disque
  Et l'élément d'affichage est en lecture seule (pas de champ input éditable)
  
  Quand l'utilisateur appuie sur la touche clavier "Escape"
  Alors la modale se referme immédiatement
  Et l'utilisateur retrouve la vue de liste active
```

---

## Données

| Élément | Valeur |
|---|---:|
| Fichier de test | `.agents/data/if/check-status.js` |
| Contenu du script | `"return sac['0'] === 'OK';"` |
| Titre de la modale | Contient `"check-status"` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Code source affiché dans l'IHM | Identique au fichier disque | Comparaison textuelle stricte |
| Fermeture modale | Disparition de la modale du DOM | Validation Playwright `toBeHidden()` |

---

## Ce que ce cas ne vérifie pas

- Le composant unitaire sans appel réseau → `CASE-UI-01-7` ;
- Le rejet du path traversal par le serveur → `CASE-SRV-02-9`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_01_12_e2e_if_script_viewer_modal_consultation`  
**Fichier :** `tests/e2e/ui/CASE-UI-01-12.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test prépare un script If sur disque.
- [ ] Le test ouvre l'IHM et clique sur Consulter.
- [ ] Le test vérifie que le texte de la modale contient le code source.
- [ ] Le test ferme la modale avec la touche Echap.
- [ ] Le nom du test contient `CASE_UI_01_12`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
