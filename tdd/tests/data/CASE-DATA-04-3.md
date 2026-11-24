# CASE-DATA-04-3 — Garantie d'absence totale de journaux d'exécution, traces ou historiques de session sous `.agents/data/`

**Spécification :** `SPEC-DATA-04`
**Critère d'acceptation :** `AC-DATA-04-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

L'arborescence `.agents/data/` est exclusivement réservée aux ressources déclaratives versionnables. Aucun journal d'exécution, fichier de trace, chunk de stream ou historique de conversation ne doit jamais y être écrit (`REQ-111`, `R-37`). Si cette règle disparaît, `.agents/data/` se remplit silencieusement de données d'exécution, brisant la promesse de versionabilité Git et la propreté de l'arborescence.

## Cas

```gherkin
Étant donné qu'aucune exécution de scénario n'a encore eu lieu
Quand on inspecte l'arborescence ".agents/data/"
Alors aucun dossier "logs/", "history/", "sessions/", "stream/" ni "cache/" n'est présent
Et seuls les dossiers déclaratifs attendus sont présents :
  "agents/", "profils/", "prompts/", "exit/", "if/", "scenarios/"

Étant donné que 3 scénarios ont été exécutés avec succès
Quand on inspecte l'arborescence ".agents/data/"
Alors aucun fichier de trace d'exécution n'est créé sous ".agents/data/"
Et aucun historique de conversation n'est stocké sous ".agents/data/"

Étant donné qu'un scénario s'est terminé en erreur
Quand on inspecte l'arborescence ".agents/data/"
Alors aucun fichier de log d'erreur d'exécution n'est créé sous ".agents/data/"

Étant donné que des chunks de streaming LLM ont été reçus et traités
Quand on inspecte l'arborescence ".agents/data/"
Alors aucun fichier de chunk ou buffer temporaire n'est présent sous ".agents/data/"
```

## Données

| Élément | Valeur |
|---|---:|
| Arborescence inspectée | `.agents/data/` |
| Dossiers autorisés | `agents/`, `profils/`, `prompts/`, `exit/`, `if/`, `scenarios/` |
| Dossiers interdits | `logs/`, `history/`, `sessions/`, `stream/`, `cache/` |
| Nombre d'exécutions simulées | `3 succès + 1 erreur` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Présence de `logs/` sous `data/` | `NON` | R-37 interdit tout log |
| Présence de `history/` sous `data/` | `NON` | REQ-111 interdit tout historique |
| Présence de fichiers de trace après exécution | `NON` | Zéro fichier d'exécution |
| Présence de fichiers de chunk/stream | `NON` | Streaming géré en mémoire navigateur uniquement |
| Dossiers déclaratifs présents | `OUI` | Seuls les dossiers légitimes |

## Ce que ce cas ne vérifie pas

- L'écriture synchrone lors d'une modification via l'UI → `CASE-DATA-04-1` ;
- La relecture du disque comme source de vérité → `CASE-DATA-04-2` ;
- La gestion du streaming temporaire en mémoire navigateur → hors périmètre DATA (SPEC-UI-03).

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_04_3_no_logs_or_history_under_data_dir`
**Fichier :** `tests/tests-unitaires/data/case-data-04-3.test.ts`

## Revue du test automatisé

- [ ] Le test simule 3 exécutions de scénarios complètes (succès et erreur).
- [ ] Le test scanne récursivement `.agents/data/` après exécution.
- [ ] Le test vérifie l'absence de tout dossier `logs/`, `history/`, `sessions/`, `stream/`, `cache/`.
- [ ] Le test vérifie l'absence de tout fichier correspondant aux patterns `*.log`, `*.trace`, `*-history.json`.
- [ ] Le test échoue si un module d'exécution écrit un fichier sous `.agents/data/`.
- [ ] Le nom du test contient `CASE_DATA_04_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
