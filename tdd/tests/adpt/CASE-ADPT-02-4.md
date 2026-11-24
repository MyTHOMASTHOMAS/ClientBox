# CASE-ADPT-02-4 — Création d'une session native cursor-cli via `create-chat`

**Spécification :** `SPEC-ADPT-02`
**Critère d'acceptation :** `AC-ADPT-02-4`
**Type :** acceptation
**Niveau de risque :** critique
**ADR liés :** `ADR-003`, `ADR-006`

## Ce que ce cas protège

`createSession(ctx)` est le seul moyen pour ClientsBox d'obtenir l'identifiant d'une nouvelle conversation Cursor Agent, réutilisé ensuite via `--resume` par tous les Runs de l'agent dans l'exécution (`SPEC-ADPT-03`). L'adapter lance `<CURSOR_CLI_BIN> create-chat` dans `ctx.workspacePath` et résout avec l'identifiant imprimé sur stdout. Un identifiant vide ou un échec silencieux ferait tourner les Runs sur une session invalide.

## Cas

```gherkin
Étant donné CURSOR_CLI_BIN pointant vers un binaire simulé
Et le binaire imprime "chat-123\n" sur stdout puis sort en code 0 pour l'argument "create-chat"
Quand "cursorAdapter.createSession(ctx)" est appelé avec workspacePath "/var/projects/my-app"
Alors le binaire est spawné avec les arguments exactement ["create-chat"] et cwd "/var/projects/my-app"
Et la promesse résout "chat-123"

Étant donné le binaire imprimant "  \n chat-456 \n"
Quand "createSession(ctx)" est appelé
Alors la promesse résout "chat-456" (première ligne non vide, espaces retirés)

Étant donné le binaire sortant en code 1
Quand "createSession(ctx)" est appelé
Alors la promesse est rejetée avec une erreur explicite en français

Étant donné le binaire sortant en code 0 sans rien imprimer
Quand "createSession(ctx)" est appelé
Alors la promesse est rejetée avec une erreur explicite en français
```

## Données

| Élément | Valeur |
|---|---:|
| Arguments attendus | `["create-chat"]` |
| stdout nominal | `"chat-123\n"` |
| stdout avec espaces | `"  \n chat-456 \n"` |
| Échec 1 | code de sortie `1` |
| Échec 2 | code `0`, stdout vide |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Résolution nominale | `"chat-123"` | Première ligne non vide, `trim()` |
| Résolution avec espaces | `"chat-456"` | Lignes vides ignorées, `trim()` |
| Code de sortie ≠ 0 | rejet | Cas limite 5 SPEC-ADPT-02 |
| stdout vide | rejet | Cas limite 5 SPEC-ADPT-02 |

## Ce que ce cas ne vérifie pas

- La réutilisation de la session par le runner → `CASE-ADPT-03-2` ;
- La génération de la commande d'exécution → `CASE-ADPT-02-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_02_4_cursor_cli_create_session_via_create_chat`
**Fichier :** `tests/units/adpt/CASE-ADPT-02-4.test.ts`

## Revue du test automatisé

- [ ] Le test mocke `child_process.spawn` (aucun binaire réel, ADR-006) et vérifie les arguments `["create-chat"]` et le `cwd`.
- [ ] Le test vérifie la résolution `"chat-123"` puis `"chat-456"`.
- [ ] Le test vérifie le rejet sur code non nul et sur sortie vide.
- [ ] Le nom du test contient `CASE_ADPT_02_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** Créé le 2026-11-03 (sessions de scénario).
