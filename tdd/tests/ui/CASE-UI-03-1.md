# CASE-UI-03-1 — Affichage scrollable et temps réel des sorties streamées du CLI dans le terminal web sans persistance sous `data/`

**Spécification :** `SPEC-UI-03`
**Critère d'acceptation :** `AC-UI-03-1`
**Type :** acceptation
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-013`, `ADR-015`  

## Ce que ce cas protège

Pendant l'exécution d'un bloc Run, le terminal web intégré à l'IHM (composant Preact `<TerminalView />` `UI-025 components/terminal/terminal-view.tsx` alimenté par le hook `UI-010 hooks/use-execution-stream.hook.ts`, `ADR-013`, `ADR-015`) doit afficher en direct et de manière fluide les flux textuels `stdout` et `stderr` émis par le CLI (`REQ-024`, `R-26`, `REQ-110`). Stylisé via Tailwind CSS v4 et les tokens du Design System (thème sombre `surface-base` / `surface-panel`, police monospace *JetBrains Mono* lisible, erreurs en rouge `status-error` per `ADR-015`), ce terminal est strictement volatil : ses données résident exclusivement dans un tampon circulaire en mémoire vive (taille fixe, ex: 5 000 lignes) et ne génèrent aucun fichier journal sous `.agents/data/` (`R-37`, `REQ-111`). Si le terminal ne restituait pas les chunks en direct ou si des fichiers de traces étaient écrits indûment sous `data/`, l'expérience interactive serait rompue et l'architecture de persistance serait polluée.

## Cas

```gherkin
Étant donné un scénario en cours d'exécution avec un bloc Run actif
Et le composant terminal web connecté au flux SSE "GET /api/scenarios/:id/stream" dans le panneau inférieur
Quand le sous-processus CLI émet des flux successifs de lignes "stdout" et "stderr"
Alors les lignes s'affichent en temps réel dans la fenêtre du terminal avec défilement automatique
Et les messages d'erreur stderr sont visuellement distincts (couleur dédiée ou préfixe)
Et les événements d'état runtime au format JSON sont normalisés en messages textuels en français
Et aucun fichier de trace, de log ou d'historique n'est écrit par l'UI sous ".agents/data/"

Étant donné un scénario en cours d'exécution et un rechargement complet de la page web (F5 / actualisation)
Quand l'IHM se reconnecte au flux SSE "GET /api/scenarios/:id/stream" pendant que le bloc Run est toujours actif
Alors le terminal web reprend la réception des flux "stdout" et "stderr" en cours sans planter ni dupliquer l'affichage
Et aucun fichier de trace n'est persisté sous ".agents/data/"

Étant donné la navigation dans l'interface ClientsBox
Quand l'utilisateur consulte la page d'un scénario sur l'URL "#/scenarios/:id"
Alors le terminal global du gabarit principal est masqué pour laisser place au terminal dédié du scénario sans duplication visuelle

Étant donné un flux volumineux ou rapide émis par le binaire CLI
Quand le terminal reçoit les événements
Alors l'affichage reste fluide grâce à la gestion d'un tampon mémoire borné
Et l'interface web ne subit aucun gel de rendu
```

## Données

| Élément | Valeur |
|---|---:|
| Composant inspecté | Fenêtre de terminal web dans l'interface |
| Flux consommés | Événements `AgentStreamEvent` (`stdout`, `stderr`) via `GET /api/scenarios/:id/stream` |
| Nature de la mémoire | Mémoire volatile navigateur (tampon circulaire borné) |
| Rechargement de page | Déconnexion / Reconnexion dynamique au flux SSE en cours |
| Persistance disque sous `.agents/data/` | `0 octet` / `AUCUNE` (`R-37`, `REQ-111`) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Affichage temps réel des sorties streamées | `OUI` | Rendu instantané au fil de l'eau (REQ-024, R-26) |
| Reprise du flux après rechargement page (F5) | `OUI` | Reconnexion au stream actif sans crash ni duplication |
| Persistance sur disque des logs du terminal | `0 octet` | Principe de terminal non persisté (R-37, REQ-111) |
| Défilement automatique (auto-scroll) | `OUI` | Défilement fluide vers la dernière ligne émise |

## Ce que ce cas ne vérifie pas

- La normalisation bas niveau du flux stream par l'adapter → `CASE-ADPT-01-3` ;
- L'assemblage additif `exit.content` et la fin naturelle du CLI → `CASE-ENG-04-13` ;
- L'action d'arrêt d'urgence Stop → `CASE-UI-03-2` ;
- La réhydratation des statuts de blocs / `isRunning` au retour sur le Studio (sans replay terminal) → `CASE-UI-03-9`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_03_1_web_terminal_realtime_streaming_without_data_persistence`
**Fichier :** `tests/tests-unitaires/ui/case-ui-03-1.test.ts`

## Revue du test automatisé

- [ ] Le test simule la réception d'une suite de chunks `AgentStreamEvent` et vérifie leur insertion dans le terminal.
- [ ] Le test vérifie la distinction visuelle des chunks stdout vs stderr.
- [ ] Le test vérifie la reconnexion et la reprise d'affichage du stream après réinitialisation de la vue (rechargement).
- [ ] Le test vérifie qu'aucun appel de persistance disque n'est déclenché par le composant terminal.
- [ ] Le test vérifie le comportement du tampon lors de l'injection d'un grand nombre de lignes.
- [ ] Le test échoue si les flux ne sont pas affichés ou si des logs sont écrits sous `data/`.
- [ ] Le nom du test contient `CASE_UI_03_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

