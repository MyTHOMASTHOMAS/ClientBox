# CASE-ADPT-01-3 — Normalisation des flux sortants en événements typés `AgentStreamEvent`

**Spécification :** `SPEC-ADPT-01`
**Critère d'acceptation :** `AC-ADPT-01-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

La méthode `parseStreamLine(line: string)` décode les lignes émises par le sous-processus CLI et les convertit en événements normalisés `AgentStreamEvent` (`stdout`, `stderr`, `exit`, `error`) pour alimenter le bus d'événements et l'IHM (`R-29`, `C-01`, `REQ-103`). En cas de ligne brute imprévue ou de JSON corrompu, un fallback gracieux doit convertir la ligne en `{ type: 'stdout', chunk: line }` sans jamais lever d'exception. Si le parseur plantait sur une ligne corrompue, le suivi en direct de l'exécution serait rompu.

## Cas

```gherkin
Étant donné une ligne standard émise sur stdout par le CLI : "Compilation réussie"
Quand la méthode "adapter.parseStreamLine(line)" est exécutée
Alors elle retourne un événement AgentStreamEvent de type "stdout" avec chunk "Compilation réussie"

Étant donné une ligne d'erreur émise par le CLI : "Warning: deprecated flag"
Quand "parseStreamLine" est exécuté
Alors elle retourne un événement de type "stderr" ou "stdout" selon le canal d'origine

Étant donné une ligne malformée ou corrompue : "{ malformed json :: %%%"
Quand "parseStreamLine" est exécuté
Alors aucune exception n'est levée
Et la ligne est convertie en événement brut de fallback de type "stdout"
```

## Données

| Élément | Valeur |
|---|---:|
| Ligne nominale stdout | `"Compilation réussie"` |
| Ligne nominale stderr | `"Warning: deprecated flag"` |
| Ligne corrompue/inattendue | `"{ malformed json :: %%%"` |
| Interface de sortie | `AgentStreamEvent` (`type: "stdout" \| "stderr" \| "exit" \| "error"`, `chunk: string`) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Événement ligne stdout | `{ type: "stdout", chunk: "Compilation réussie" }` | Décodage nominal stdout |
| Événement ligne corrompue | `{ type: "stdout", chunk: "{ malformed json :: %%%" }` | Fallback gracieux sans crash (cas limite 1) |
| Exception levée sur ligne corrompue | `AUCUNE` | Gestion robuste des erreurs de parsing |

## Ce que ce cas ne vérifie pas

- Le décodage spécifique du format protocolaire Cursor → `CASE-ADPT-02-3` ;
- Le rendu dans le terminal web de l'IHM → `SPEC-UI-03` ;
- L'interruption des processus par signal Stop → `CASE-ADPT-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_01_3_stream_normalization_and_graceful_fallback`
**Fichier :** `tests/tests-unitaires/adpt/case-adpt-01-3.test.ts`

## Revue du test automatisé

- [ ] Le test soumet une ligne textuelle propre et vérifie la structure de `AgentStreamEvent`.
- [ ] Le test soumet des chaînes arbitraires et corrompues (caractères spéciaux, JSON cassé).
- [ ] Le test vérifie qu'aucune exception n'est levée par `parseStreamLine`.
- [ ] Le test vérifie le mécanisme de fallback sur `type: "stdout"`.
- [ ] Le nom du test contient `CASE_ADPT_01_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
