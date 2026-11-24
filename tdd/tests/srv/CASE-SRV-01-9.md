# CASE-SRV-01-9 — Résolution runtime de l'environnement, validation des obligatoires et gestion des erreurs

**Spécification :** `SPEC-SRV-01`  
**Critère d'acceptation :** `AC-SRV-01-9`  
**Type :** intégration / runtime  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-008`, `ADR-022`  
**Modules cibles :** `src/lib/process/env/` (`env.engine.ts`, `env.validators.ts`), `src/config/env.config.ts`, `src/services/config/config.service.ts`

---

## Ce que ce cas protège

L'initialisation de l'environnement de ClientsBox doit s'effectuer de manière 100 % dynamique au runtime (`REQ-046`, `R-50`, `ADR-022`) :

1. **Chargement par défaut depuis `env/.env` :**
   - Si `env/.env` existe, ses variables sont chargées et injectées.
   - Si `env/.env` est absent, **aucune erreur n'est levée** : l'application utilise l'environnement existant (`process.env`).
2. **Chargement strict via `-e <chemin>` :**
   - Si un fichier d'environnement explicite est fourni et qu'il **n'existe pas sur le disque**, une erreur fatale (`EnvLoadError`) est immédiatement levée avec un message explicite en français.
   - Si le fichier explicite existe, ses variables sont chargées.
3. **Contrôle des trois binaires CLI d'agents obligatoires :**
   - Si l'un quelconque des 3 binaires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`) est absent de la configuration et de `process.env`, ou s'il pointe vers un fichier inexistant / non exécutable, l'initialisation échoue immédiatement avec une erreur explicite renvoyant vers `env/.env.example`.
4. **Application des valeurs par défaut :**
   - Les variables optionnelles non renseignées reçoivent leur valeur nominale : `PORT=2974`, `HOST=127.0.0.1`, `AGENTS_DIR=.agents`, `LOGS_DISABLED=false`, `CALL_SCENARIO_MAX_DEPTH=-1`, timeouts à `15000`.
5. **Résolution prioritaire du port HTTP :**
   - L'ordre de priorité est strictement respecté : option CLI `-p` > variable `PORT` résolue > `2974`.
6. **Kill-switch des logs :**
   - Si `LOGS_DISABLED=true` est présent dans le fichier chargé, il est injecté dans `process.env` pour désactiver la journalisation avant tout appel au logger.

---

## Cas

```gherkin
Scénario : Chargement automatique de env/.env s'il est présent
  Étant donné un workspace contenant un fichier "env/.env" avec "PORT=3333" et les 3 binaires valides
  Quand la configuration est déployée sans option envFile
  Alors la variable PORT est résolue à 3333
  Et les 3 binaires sont résolus

Scénario : Résilience en l'absence de env/.env
  Étant donné un workspace sans dossier "env/"
  Et process.env contient les 3 binaires CLI valides
  Quand la configuration est déployée sans option envFile
  Alors aucune erreur n'est levée
  Et le port par défaut est résolu à 2974

Scénario : Échec fatal immédiat si le fichier spécifié par -e est introuvable
  Étant donné un chemin de fichier inexistant "introuvable.env"
  Quand la configuration est déployée avec envFile: "introuvable.env"
  Alors une exception EnvLoadError est levée
  Et le message indique clairement que le fichier spécifié n'existe pas

Scénario : Succès si le fichier spécifié par -e existe
  Étant donné un fichier existant "custom.env" avec "LOGS_DISABLED=true" et les 3 binaires valides
  Quand la configuration est déployée avec envFile: "custom.env"
  Alors LOGS_DISABLED est injecté à "true" dans process.env
  Et les 3 binaires sont configurés

Scénario : Échec fatal si l'un des 3 binaires CLI est manquant
  Étant donné un workspace ne définissant pas CURSOR_CLI_BIN (ou ANTIGRAVITY_CLI_BIN ou CODEX_CLI_BIN)
  Quand la configuration est déployée
  Alors une exception est levée avec un message en français mentionnant la variable manquante et env/.env.example

Scénario : Application des valeurs par défaut
  Étant donné un environnement ne définissant que les 3 binaires obligatoires
  Quand la configuration est déployée
  Alors PORT vaut 2974, HOST vaut "127.0.0.1", AGENTS_DIR vaut ".agents", LOGS_DISABLED vaut "false"
```

---

## Données

| Scénario d'entrée | `envFile` | Fichier sur disque | `process.env.CURSOR_CLI_BIN` | Résultat attendu |
|---|---|---|---|---|
| Défaut avec `env/.env` | `undefined` | `env/.env` présent | Non requis | Succès, variables de `env/.env` chargées |
| Défaut sans `env/.env` | `undefined` | Aucun fichier | `/bin/cursor` | Succès résilient, défauts appliqués |
| `-e` inexistant | `"missing.env"` | Aucun | Non requis | Échec fatal `EnvLoadError` |
| `-e` existant | `"custom.env"` | `custom.env` présent | Non requis | Succès, variables de `custom.env` chargées |
| Obligatoire manquante | `undefined` | Aucun | `undefined` | Échec fatal : variable obligatoire manquante |

---

## Résultat attendu, calculé à la main

| Propriété | Comportement attendu | Règle / CDC |
|---|---|---|
| Résilience par défaut | Tolérance si `env/.env` absent | R-50 / REQ-046 |
| Rigueur sur fichier explicite | `EnvLoadError` si absent | R-50 / REQ-046 |
| Monopole `process.env` | Injection et accès réservés à `src/lib/process/env/` | SPEC-ARCH-03 / CASE-ARCH-03-5 |
| Silence des logs | `LOGS_DISABLED=true` injecté avant tout log | ADR-022 / CR-003 |

---

## Test automatisé

Fichier cible : `tests/units/srv/CASE-SRV-01-9.test.ts`.
