# CASE-UI-03-3 — Absence de tout bouton de réinitialisation manuelle du contexte d'un agent

**Spécification :** `SPEC-UI-03`, `SPEC-ADPT-03`
**Critère d'acceptation :** `AC-UI-03-3`
**Type :** acceptation (non-régression)
**Niveau de risque :** moyen  
**ADR liés :** `ADR-013`, ADR-015  

## Ce que ce cas protège

Depuis le 2026-11-03, la mémoire d'un agent est **spécifique à une exécution de scénario** : elle naît au premier Run de l'agent et ne s'efface que par un bloc ClearContext (`SPEC-ADPT-03`). Un bouton « Effacer le contexte » hors scénario n'a plus de sens (aucune session n'existe hors exécution) et a été retiré de la vue Agents (`agents-page.tsx`), de la barre d'outils du canvas (`canvas-toolbar.tsx`, prop `onClearContext`) et des contrôles du terminal (`terminal-controls.tsx`). Ce cas empêche sa réapparition.

Le bouton d'**ajout** d'un bloc ClearContext sur le canvas (`[data-action="add-clear-context"]`) n'est pas concerné et doit rester présent.

## Cas

```gherkin
Étant donné la page Agents rendue avec au moins un agent
Quand le DOM est inspecté
Alors aucun élément "[data-action=\"clear-context\"]" n'est présent
Et aucun libellé "Effacer le contexte" n'est affiché

Étant donné la barre d'outils du canvas rendue avec tous ses callbacks
Quand le DOM est inspecté
Alors aucun élément "[data-action=\"clear-context\"]" n'est présent
Et l'élément "[data-action=\"add-clear-context\"]" est présent

Étant donné les contrôles du terminal rendus
Quand le DOM est inspecté
Alors aucun élément "[data-action=\"clear-context\"]" n'est présent
```

## Données

| Élément | Valeur |
|---|---:|
| Sélecteur interdit | `[data-action="clear-context"]` |
| Libellé interdit | `"Effacer le contexte"` |
| Sélecteur conservé | `[data-action="add-clear-context"]` (canvas) |
| Composants inspectés | `AgentsPage`, `CanvasToolbar`, `TerminalControls` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Boutons `clear-context` rendus | `0` | Retrait du reset manuel (SPEC-UI-03 v1.4) |
| Bouton `add-clear-context` | `1` | Bloc ClearContext toujours ajoutable |

## Ce que ce cas ne vérifie pas

- Le comportement du bloc ClearContext → `CASE-ENG-03-4` ;
- L'arrêt d'urgence (Stop) → `CASE-UI-03-2` ;
- L'absence de la route HTTP `POST /api/agents/:id/clear` → `CASE-SRV-02-11`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_03_3_no_manual_clear_context_button`
**Fichier :** `tests/units/ui/CASE-UI-03-3.test.ts`

## Revue du test automatisé

- [ ] Le test rend `AgentsPage`, `CanvasToolbar` et `TerminalControls`.
- [ ] Le test vérifie l'absence de `[data-action="clear-context"]` et du libellé « Effacer le contexte ».
- [ ] Le test vérifie la présence de `[data-action="add-clear-context"]` dans la barre du canvas.
- [ ] Le nom du test contient `CASE_UI_03_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** v2 (2026-11-03) — inversion : le bouton manuel est retiré (R-30 retirée).
