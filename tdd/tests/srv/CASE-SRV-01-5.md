# CASE-SRV-01-5 — Parsing des arguments CLI de l'option d'exécution directe --exec-scene

**Spécification :** `SPEC-SRV-01`  
**Critère d'acceptation :** `AC-SRV-01-5`  
**Type :** acceptation / parsing  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-001`, `ADR-020`  
**Modules cibles :** `src/lib/process/args-parser/args-parser.engine.ts` (`LIB-012`), `src/config/cli-flags.config.ts` (`CONFIG-002`)  

---

## Ce que ce cas protège

Le moteur de parsing de flags CLI (`parseCliArgs` avec `CLIENTSBOX_CLI_SCHEMA` ou via `ConfigService.deploy`) doit identifier et extraire la cible du scénario demandée via l'option `--exec-scene` (`REQ-044`, `R-48`).

Il doit prendre en charge les deux syntaxes courantes de la ligne de commande :
1. Séparation par un espace : `--exec-scene <cible>`
2. Séparation par le signe égal : `--exec-scene=<cible>`

Le parser doit garantir :
- L'absence de collision avec les arguments de port (`-p <n>`, `--port <n>`, `--port=<n>`) ;
- La préservation du port résolu en parallèle (défaut ou surchargé) ;
- Le rejet immédiat (`ServerCliParseError`) si l'option `--exec-scene` est fournie sans valeur (fin d'arguments ou token vide) ;
- Le retour de `execScene: undefined` si l'option n'est pas spécifiée sur la ligne de commande.

---

## Cas

```gherkin
Scénario : Extraction de --exec-scene avec valeur séparée par espace
  Étant donné une liste d'arguments argv contenant ["--exec-scene", "test-step1-dialogue"]
  Quand la fonction parseServerCliArgs est appelée
  Alors l'objet retourné contient { port: 2974, execScene: "test-step1-dialogue" }

Scénario : Extraction de --exec-scene avec valeur séparée par égal
  Étant donné une liste d'arguments argv contenant ["--exec-scene=mon-scenario-demo"]
  Quand la fonction parseServerCliArgs est appelée
  Alors l'objet retourné contient { port: 2974, execScene: "mon-scenario-demo" }

Scénario : Combinaison de --exec-scene et de l'option de port
  Étant donné une liste d'arguments argv contenant ["-p", "8080", "--exec-scene=scenario-test"]
  Quand la fonction parseServerCliArgs est appelée
  Alors l'objet retourné contient { port: 8080, execScene: "scenario-test" }

Scénario : Absence de l'option --exec-scene
  Étant donné une liste d'arguments argv contenant uniquement ["--port", "3000"]
  Quand la fonction parseServerCliArgs est appelée
  Alors l'objet retourné contient { port: 3000, execScene: undefined }

Scénario : Erreur sur option --exec-scene sans valeur
  Étant donné une liste d'arguments argv se terminant par ["--exec-scene"] sans paramètre suivant
  Quand la fonction parseServerCliArgs est appelée
  Alors une exception ServerCliParseError est levée avec un message explicite en français
```

---

## Données

| Argument d'entrée (argv) | Port attendu | `execScene` attendu | Statut |
|---|---|---|---|
| `[]` | `2974` | `undefined` | Nominal défaut |
| `["--exec-scene", "test-dialogue"]` | `2974` | `"test-dialogue"` | Nominal espace |
| `["--exec-scene=test-if"]` | `2974` | `"test-if"` | Nominal égal |
| `["-p", "9000", "--exec-scene", "sc-1"]` | `9000` | `"sc-1"` | Combinaison port |
| `["--exec-scene"]` | — | — | Rejet `ServerCliParseError` |
| `["--exec-scene="]` | — | — | Rejet `ServerCliParseError` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Propriété `execScene` | Chaîne non vide extraite ou `undefined` | AC-SRV-01-5 / REQ-044 |
| Priorité de token | Détection indépendante de la position dans argv | Parsing robuste itératif |
| Erreur token manquant | Levée de `ServerCliParseError` | Message en français clair |

---

## Ce que ce cas ne vérifie pas

- L'existence du scénario sur disque → `CASE-SRV-01-6` / `CASE-SRV-01-7` ;
- Le non-démarrage du serveur HTTP → `CASE-SRV-01-6` ;
- L'exécution du runner et des blocs → `CASE-SRV-01-6`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_01_5_cli_args_parsing_exec_scene`  
**Fichier :** `tests/units/srv/CASE-SRV-01-5.test.ts`  

## Revue du test automatisé

- [ ] Le test valide l'extraction de `--exec-scene <id>`.
- [ ] Le test valide l'extraction de `--exec-scene=<id>`.
- [ ] Le test valide la cohabitation avec `-p` et `--port`.
- [ ] Le test valide l'absence de `execScene` par défaut.
- [ ] Le test vérifie le rejet avec exception sur argument sans valeur.
- [ ] Le nom du test contient `CASE_SRV_01_5`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-009 / CDC v2.2.
