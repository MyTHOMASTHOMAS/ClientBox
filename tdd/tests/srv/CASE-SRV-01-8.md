# CASE-SRV-01-8 — Parsing des arguments CLI des options de fichier d'environnement -e et --env

**Spécification :** `SPEC-SRV-01`  
**Critère d'acceptation :** `AC-SRV-01-8`  
**Type :** acceptation / parsing  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-001`, `ADR-022`  
**Modules cibles :** `src/lib/process/args-parser/args-parser.engine.ts` (`LIB-012`), `src/config/cli-flags.config.ts` (`CONFIG-002`), `src/services/config/config.service.ts` (`SVC-021`)  

---

## Ce que ce cas protège

Le moteur générique de parsing d'arguments en ligne de commande de ClientsBox (`parseCliArgs` avec `CLIENTSBOX_CLI_SCHEMA` ou via `ConfigService.deploy`) doit identifier et extraire le chemin vers un fichier d'environnement personnalisé demandé par l'opérateur (`REQ-046`, `R-50`).

Il doit prendre en charge les trois syntaxes courantes de la ligne de commande :
1. Option courte avec espace : `-e <chemin>`
2. Option longue avec espace : `--env <chemin>`
3. Option longue avec égal : `--env=<chemin>`

Le parser doit garantir :
- L'absence de collision avec les autres arguments (`-p`, `--port`, `--exec-scene`) ;
- La préservation du port et de `execScene` résolus en parallèle ;
- Le rejet immédiat (`ServerCliParseError`) si l'option `-e` ou `--env` est fournie sans valeur (fin d'arguments ou token vide) ;
- Le retour de `envFile: undefined` si aucune option d'environnement n'est spécifiée sur la ligne de commande.

---

## Cas

```gherkin
Scénario : Extraction de -e avec chemin séparé par espace
  Étant donné une liste d'arguments argv contenant ["-e", "config/custom.env"]
  Quand les arguments sont parsés avec le schéma CLIENTSBOX_CLI_SCHEMA
  Alors l'objet retourné contient { port: 2974, envFile: "config/custom.env" }

Scénario : Extraction de --env avec chemin séparé par espace
  Étant donné une liste d'arguments argv contenant ["--env", "prod.env"]
  Quand les arguments sont parsés avec le schéma CLIENTSBOX_CLI_SCHEMA
  Alors l'objet retourné contient { port: 2974, envFile: "prod.env" }

Scénario : Extraction de --env avec chemin séparé par égal
  Étant donné une liste d'arguments argv contenant ["--env=test.env"]
  Quand les arguments sont parsés avec le schéma CLIENTSBOX_CLI_SCHEMA
  Alors l'objet retourné contient { port: 2974, envFile: "test.env" }

Scénario : Combinaison complète avec port et exec-scene
  Étant donné une liste d'arguments argv contenant ["-p", "8080", "-e", "local.env", "--exec-scene=mon-sc"]
  Quand les arguments sont parsés avec le schéma CLIENTSBOX_CLI_SCHEMA
  Alors l'objet retourné contient { port: 8080, envFile: "local.env", execScene: "mon-sc" }

Scénario : Absence de l'option d'environnement
  Étant donné une liste d'arguments argv contenant uniquement ["--port", "3000"]
  Quand les arguments sont parsés avec le schéma CLIENTSBOX_CLI_SCHEMA
  Alors l'objet retourné contient { port: 3000, envFile: undefined }

Scénario : Erreur sur option -e sans valeur
  Étant donné une liste d'arguments argv se terminant par ["-e"] sans paramètre suivant
  Quand les arguments sont parsés avec le schéma CLIENTSBOX_CLI_SCHEMA
  Alors une exception ServerCliParseError est levée avec un message explicite en français

Scénario : Erreur sur option --env sans valeur
  Étant donné une liste d'arguments argv se terminant par ["--env"] sans paramètre suivant
  Quand les arguments sont parsés avec le schéma CLIENTSBOX_CLI_SCHEMA
  Alors une exception ServerCliParseError est levée avec un message explicite en français

Scénario : Erreur sur option --env= avec valeur vide
  Étant donné une liste d'arguments argv contenant ["--env="]
  Quand les arguments sont parsés avec le schéma CLIENTSBOX_CLI_SCHEMA
  Alors une exception ServerCliParseError est levée avec un message explicite en français
```

---

## Données

| Argument d'entrée (argv) | Port attendu | `envFile` attendu | `execScene` attendu | Statut |
|---|---|---|---|---|
| `[]` | `2974` | `undefined` | `undefined` | Nominal défaut |
| `["-e", "mon.env"]` | `2974` | `"mon.env"` | `undefined` | Nominal court espace |
| `["--env", "autre.env"]` | `2974` | `"autre.env"` | `undefined` | Nominal long espace |
| `["--env=custom.env"]` | `2974` | `"custom.env"` | `undefined` | Nominal long égal |
| `["-p", "9000", "-e", "app.env", "--exec-scene", "sc1"]` | `9000` | `"app.env"` | `"sc1"` | Combinaison complète |
| `["-e"]` | — | — | — | Rejet `ServerCliParseError` |
| `["--env"]` | — | — | — | Rejet `ServerCliParseError` |
| `["--env="]` | — | — | — | Rejet `ServerCliParseError` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Propriété `envFile` | Chaîne non vide extraite ou `undefined` | AC-SRV-01-8 / REQ-046 |
| Priorité de token | Détection indépendante de la position dans argv | Parsing robuste itératif |
| Erreur token manquant | Levée de `ServerCliParseError` | Message en français clair |

---

## Test automatisé

Fichier cible : `tests/units/srv/CASE-SRV-01-8.test.ts`.
