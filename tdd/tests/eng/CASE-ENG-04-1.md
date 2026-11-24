# CASE-ENG-04-1 — Assemblage complet du prompt par le moteur avant tout appel de commande à l'adapter

**Spécification :** `SPEC-ENG-04`
**Critère d'acceptation :** `AC-ENG-04-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le moteur de blocs est responsable de l'assemblage complet du prompt (`assembledPrompt`) préalablement à toute invocation de l'adapter (`R-07`, `R-45`, `REQ-032`, CR-012). Il combine le prompt système du profil, le prompt utilisateur de mission et, le cas échéant, l'ordre de sortie `exit.content`. Si cette concaténation était oubliée ou déléguée à l'adapter, l'agent exécuterait des commandes sans directives système ni consigne de fin de tâche.

## Cas

```gherkin
Étant donné un agent "agent-coder" rattaché à un profil ayant pour prompt système :
  """
  Tu es un assistant expert en TypeScript. Réponds de façon concise.
  """
Et un bloc Run "run-task" configuré avec le prompt utilisateur :
  """
  Écris une fonction générique de validation de schéma.
  """
Quand le moteur prépare l'exécution du bloc Run
Alors le prompt assemblé transmis à l'adapter contient exactement le prompt système suivi d'un double saut de ligne puis du prompt utilisateur
Et l'adapter reçoit la chaîne complète assemblée en paramètre

Étant donné un agent dont le profil possède un prompt système vide ""
Et un bloc Run configuré avec le prompt utilisateur "Bonjour"
Quand le moteur assemble le prompt
Alors le prompt assemblé est exactement "Bonjour" sans saut de ligne initial parasite

Étant donné un prompt système "Expert", un prompt utilisateur "Rédige" et un exit.content "Conclus par TERMINER"
Quand le moteur assemble le prompt avec les trois segments
Alors le prompt assemblé est exactement "Expert\n\nRédige\n\nConclus par TERMINER"
```

## Données

| Élément | Valeur |
|---|---:|
| Profil `systemPrompt` (nominal) | `"Tu es un assistant expert en TypeScript. Réponds de façon concise."` |
| Bloc Run `userPrompt` (nominal) | `"Écris une fonction générique de validation de schéma."` |
| Profil `systemPrompt` (vide) | `""` |
| Bloc Run `userPrompt` (vide case) | `"Bonjour"` |
| Exit content (3 segments) | `"Conclus par TERMINER"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Prompt assemblé nominal | `"Tu es un assistant expert en TypeScript. Réponds de façon concise.\n\nÉcris une fonction générique de validation de schéma."` | `systemPrompt + "\n\n" + userPrompt` (R-45) |
| Prompt assemblé (système vide) | `"Bonjour"` | Cas limite : pas de préfixe parasite |
| Prompt assemblé (3 segments) | `"Expert\n\nRédige\n\nConclus par TERMINER"` | `system + "\n\n" + user + "\n\n" + exit` (R-07) |
| Couche effectuant l'assemblage | Moteur de blocs (`ENG` / `DOM-004`) | Règle R-45, REQ-032 (avant appel adapter) |

## Ce que ce cas ne vérifie pas

- La gestion des 3 politiques d'envoi du profil (`debut_scenario`, etc.) → `CASE-ENG-04-2` ;
- L'absence d'appel `stop()` sur mot-clé intermédiaire → `CASE-ENG-04-13` ;
- La construction de la ligne de commande CLI par l'adapter → `SPEC-ADPT-01` ;
- La persistance des profils et agents → `CASE-DATA-01-1` et `CASE-DATA-01-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_04_1_engine_prompt_assembly_before_adapter_call`
**Fichier :** `tests/units/eng/CASE-ENG-04-1.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie que le moteur assemble le texte du prompt avant d'appeler l'adapter.
- [ ] Le test valide le format de concaténation `systemPrompt + "\n\n" + userPrompt`.
- [ ] Le test valide la concaténation à 3 segments avec `exitPrompt`.
- [ ] Le test vérifie le comportement avec un prompt système vide `""`.
- [ ] Le test échoue si l'adapter est appelé avec le prompt utilisateur brut non assemblé.
- [ ] Le nom du test contient `CASE_ENG_04_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** CR-012 — extension à `exit.content`.
