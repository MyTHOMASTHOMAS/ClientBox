# CASE-UI-02-14 — Suppression interactive d'un câble en deux clics (sélection puis option Supprimer)

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-7`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

La composition nodale permet de créer des liaisons, mais sans geste de retrait explicite l'utilisateur ne peut corriger un câblage erroné qu'en manipulant le JSON ou en supprimant des blocs (`REQ-014`, `REQ-035`, `R-43`). Ce cas garantit, dans l'environnement Preact / SVG (`UI-020 canvas-board.tsx`, `UI-022 canvas-cable.tsx`, `UI-008 use-canvas-state.hook.ts` / `removeConnection`) :

1. Un premier clic sur un câble affiche une petite option « Supprimer » près de la liaison (`data-action="delete-connection"`).
2. Un second clic sur cette option retire la connexion du modèle via `removeConnection` et fait disparaître le câble du canvas.
3. Un clic ailleurs (hors option et hors même câble) referme l'option sans supprimer.
4. Un seul câble peut afficher l'option à la fois : cliquer un autre câble transfère la sélection.

Si ce geste disparaît, les scénarios Gherkin de suppression (DATA / E2E renumérotation) n'ont plus de point d'entrée UI cohérent.

---

## Cas

```gherkin
Scénario : Affichage de l'option Supprimer au premier clic sur un câble
  Étant donné un canvas contenant une liaison orientée entre deux blocs
  Quand l'utilisateur clique une première fois sur le chemin SVG du câble
  Alors une option "Supprimer" avec data-action="delete-connection" est visible près de la liaison
  Et la connexion demeure présente dans le document canvas

Scénario : Suppression effective au second clic sur l'option
  Étant donné un câble sélectionné affichant l'option "Supprimer"
  Quand l'utilisateur clique sur l'élément data-action="delete-connection"
  Alors la connexion correspondante est absente du document canvas
  Et le câble n'est plus rendu sur le canvas
  Et l'option "Supprimer" n'est plus affichée

Scénario : Annulation par clic hors câble
  Étant donné un câble sélectionné affichant l'option "Supprimer"
  Quand l'utilisateur clique ailleurs sur le canvas (hors option et hors même câble)
  Alors l'option "Supprimer" disparaît
  Et la connexion demeure intacte dans le document canvas

Scénario : Un seul câble sélectionné à la fois
  Étant donné deux câbles A et B sur le canvas
  Et le câble A affichant déjà l'option "Supprimer"
  Quand l'utilisateur clique sur le câble B
  Alors l'option "Supprimer" n'est plus associée au câble A
  Et l'option "Supprimer" est visible pour le câble B
  Et aucune connexion n'a été retirée
```

---

## Données

| Élément | Valeur |
|---|---:|
| Geste | 1er clic = sélection / option ; 2e clic sur option = suppression |
| Sélecteur option | `data-action="delete-connection"` |
| Libellé option | `Supprimer` (français) |
| Fonction modèle | `removeConnection(doc, connectionIndex)` (`UI-008`) |
| Composants | `canvas-cable.tsx`, `canvas-board.tsx` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Connexions après 1er clic seul | inchangé | Sélection sans mutation |
| Connexions après 2e clic sur option | `N - 1` | `removeConnection` retire l'index |
| Connexions après clic hors option | inchangé | Annulation |
| Options « Supprimer » visibles simultanément | `0` ou `1` | Exclusion mutuelle |

---

## Ce que ce cas ne vérifie pas

- La renumérotation des clés numériques après suppression → `CASE-DATA-03-2` / E2E `CASE-UI-02-13` ;
- La préservation des clés personnalisées → `CASE-DATA-03-3` ;
- Le tirage / création de câble → `CASE-UI-02-8` ;
- La distinction visuelle des branches If → `CASE-UI-02-3`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_14_cable_two_click_delete`  
**Fichier :** `tests/units/ui/CASE-UI-02-14.test.ts`

## Revue du test automatisé

- [ ] Le test simule un premier clic sur un câble et vérifie la présence de `data-action="delete-connection"`.
- [ ] Le test simule un second clic sur l'option et vérifie l'absence de la connexion dans le document.
- [ ] Le test vérifie qu'un clic hors câble ferme l'option sans supprimer.
- [ ] Le test vérifie qu'un seul câble peut afficher l'option à la fois.
- [ ] Le nom du test contient `CASE_UI_02_14`.
- [ ] Le test échoue si le geste ou `removeConnection` est retiré du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
