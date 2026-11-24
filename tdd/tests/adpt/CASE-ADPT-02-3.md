# CASE-ADPT-02-3 — Décodage et parsing des sorties stream produites par `cursor-cli` vers `AgentStreamEvent`

**Spécification :** `SPEC-ADPT-02`
**Critère d'acceptation :** `AC-ADPT-02-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Le binaire `cursor-cli` émet des sorties mixtes (flux texte, messages JSON ou blocs de statut). La méthode `parseStreamLine` de l'adapter Cursor extrait le contenu informatif pour construire les événements `AgentStreamEvent` (`REQ-013`, `REQ-103`, `R-40`). Si ce décodage est défaillant, les payloads affichés dans l'IHM et transmis aux blocs en aval seront pollués par du formatage protocolaire interne.

## Cas

```gherkin
Étant donné une ligne de réponse formatée émise par le binaire Cursor sur stdout :
  """
  {"type":"text","content":"Fichier index.ts modifié avec succès."}
  """
Quand "cursorAdapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est de type "stdout"
Et son chunk contient le texte extrait "Fichier index.ts modifié avec succès."

Étant donné une ligne de texte brut émise sans enveloppe JSON :
  """
  Building project packages...
  """
Quand "cursorAdapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est de type "stdout"
Et son chunk contient exactement "Building project packages..."

Étant donné une sortie accumulée JSON émise par le binaire Cursor :
  """
  {"type":"text","content":"Fichier index.ts modifié avec succès."}
  """
Quand "cursorAdapter.parseOutput(rawOutput)" est exécuté
Alors la méthode retourne strictement "Fichier index.ts modifié avec succès." sans structure JSON

Étant donné une sortie accumulée multi-lignes JSON émises par le binaire Cursor :
  """
  {"type":"text","content":"Étape 1 validée.\n"}
  {"type":"text","content":"Étape 2 terminée."}
  """
Quand "cursorAdapter.parseOutput(rawOutput)" est exécuté
Alors la méthode retourne strictement "Étape 1 validée.\nÉtape 2 terminée."

Étant donné une sortie brute en texte pur non-JSON : "Texte brut Cursor"
Quand "cursorAdapter.parseOutput(rawOutput)" est exécuté
Alors la méthode retourne fidèlement "Texte brut Cursor"
```

## Données

| Élément | Valeur |
|---|---:|
| Ligne stream JSON | `{"type":"text","content":"Fichier index.ts modifié avec succès."}` |
| Ligne stream texte brut | `"Building project packages..."` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Chunk extrait (JSON) | `"Fichier index.ts modifié avec succès."` | Désérialisation et extraction du champ `content` (R-40) |
| Chunk extrait (brut) | `"Building project packages..."` | Fallback sur texte brut intégral |
| Type d'événement | `"stdout"` | Canal normal d'exécution |

## Ce que ce cas ne vérifie pas

- Le rendu dans le composant terminal web UI → `SPEC-UI-03` ;
- L'assemblage additif `exit.content` et la fin naturelle du CLI → `CASE-ENG-04-13` ;
- L'émission du signal Stop → `CASE-ADPT-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_02_3_cursor_cli_stream_parsing_to_agent_stream_event`
**Fichier :** `tests/tests-unitaires/adpt/case-adpt-02-3.test.ts`

## Revue du test automatisé

- [ ] Le test soumet des lignes JSON caractéristiques du CLI Cursor et vérifie l'extraction du texte.
- [ ] Le test soumet des lignes de logs brutes et vérifie la préservation du message.
- [ ] Le test vérifie que le type retourné est un `AgentStreamEvent` valide.
- [ ] Le test échoue si les balises ou enveloppes JSON internes ne sont pas nettoyées.
- [ ] Le nom du test contient `CASE_ADPT_02_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
