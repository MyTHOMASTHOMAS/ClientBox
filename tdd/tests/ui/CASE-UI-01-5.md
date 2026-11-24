# CASE-UI-01-5 — Validation E2E de la restitution visuelle complète du jeu de données seed dans l'IHM

**Spécification :** `SPEC-UI-01`  
**Critère d'acceptation :** `AC-UI-01-4`  
**Type :** acceptation E2E navigateur (Playwright)  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-001`, `ADR-005`, `ADR-011`, `ADR-012`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) que l'intégralité du jeu de données de référence initial (modèles de seed `templates/data/` déployés dans `.agents/data/` ou résolus via `AGENTS_DIR`) est fidèlement chargée par l'API backend et restituée visuellement dans l'IHM web propulsée par Preact et Tailwind CSS v4 (`ADR-013`, `UI-001`, `UI-016`, `UI-018`, `UI-019`, `UI-027..UI-030`) sur chacune des 6 rubriques de l'application :
1. **Scénarios** (`#/scenarios`) : présence du scénario démo et des 4 scènes de test manuel.
2. **Agents** (`#/agents`) : 4 agents seed (démo + tests manuels) associés aux profils et adapters.
3. **Profils** (`#/profils`) : 3 profils avec politique d'injection et prompt système.
4. **Prompts** (`#/prompts`) : 10 prompts (démo + scènes 1–3).
5. **Conditions Exit** (`#/exit`) : 3 ordres de sortie seed (`exit-termine`, `exit-audit`, `exit-fait`).
6. **Scripts If** (`#/if`) : 3 scripts d'aiguillage (démo + scènes).

Aucune rubrique ne doit présenter d'écran blanc, de table vide, ni déclencher d'erreur HTTP 404/500 lors de la navigation. L'arborescence Preact `<App />` et `<AppLayout />` garantit un rendu déclaratif stable et préserve l'ensemble des sélecteurs sémantiques et attributs `[data-action]`.

---

## Cas

```gherkin
Scénario : Validation E2E de la restitution des scénarios de la seed
  Étant donné l'application ClientsBox ouverte dans le navigateur sur la rubrique "Scénarios" ("#/scenarios")
  Alors la table des scénarios contient le scénario "Scénario Démo Pipeline Dev" (id: "scenario-demo")
  Et sa description "Scénario exemple reliant Start -> Agent Codeur -> If Validation -> Agent Validateur" est visible
  Et un bouton d'action "Ouvrir Canvas" est présent sur la ligne
  Et les scénarios "Scène 1 — Dialogue dans un fichier", "Scène 2a — If branche vrai", "Scène 2b — If branche faux" et "Scène 3 — Clear context" sont visibles

Scénario : Validation E2E de la restitution des agents de la seed
  Étant donné l'utilisateur naviguant sur la rubrique "Agents" ("#/agents")
  Alors la table des agents affiche exactement 4 lignes :
    | Nom | Profil | CLI |
    | Agent Codeur | profil-developpeur | cursor-cli |
    | Agent Validateur | profil-reviewer | cursor-cli |
    | Agent Test A | profil-test-minimal | cursor-cli |
    | Agent Test B | profil-test-minimal | cursor-cli |

Scénario : Validation E2E de la restitution des profils de la seed
  Étant donné l'utilisateur naviguant sur la rubrique "Profils" ("#/profils")
  Alors la table des profils affiche exactement 3 profils :
    | Nom | Politique | Extrait Prompt Système |
    | Profil Développeur TypeScript | chaque_prompt | Tu es un expert développeur TypeScript |
    | Profil Reviewer de Code | debut_scenario | Tu es un relecteur de code expérimenté |
    | Profil Test Minimal | une_fois_jusqu_a_clear | Mode test |

Scénario : Validation E2E de la restitution des prompts de la seed
  Étant donné l'utilisateur naviguant sur la rubrique "Prompts" ("#/prompts")
  Alors la table des prompts affiche exactement 10 prompts
  Et les prompts "Génération de fonctionnalités", "Audit et validation", "Scène 1 — A écrit" et "Scène 3 — Retenir le code" sont visibles

Scénario : Validation E2E de la restitution des conditions exit de la seed
  Étant donné l'utilisateur naviguant sur la rubrique "Conditions Exit" ("#/exit")
  Alors la table affiche exactement 3 conditions exit :
    | Identifiant | Nom | Aperçu contenu |
    | exit-termine | Fin TERMINE | TERMINE |
    | exit-audit | Clôture audit | AUDIT |
    | exit-fait | Clôture FAIT | FAIT |
  Et aucun aperçu de matchers (substring/regex) n'est affiché

Scénario : Validation E2E de la restitution des scripts If de la seed
  Étant donné l'utilisateur naviguant sur la rubrique "Scripts If" ("#/if")
  Alors la table affiche exactement 3 scripts :
    | Identifiant | Fichier |
    | est-valide | est-valide.js |
    | fichier-scene1-ecrit | fichier-scene1-ecrit.js |
    | reponse-oui | reponse-oui.js |
```

---

## Données de référence de la Seed (`templates/data/`)

| Rubrique | Effectif | Identifiants seed |
|---|---:|---|
| **Scénarios** | 5 | `scenario-demo`, `scene1-dialogue-fichier`, `scene2-if-oui`, `scene2-if-non`, `scene3-clear-context` |
| **Agents** | 4 | `agent-codeur`, `agent-validateur`, `agent-test-a`, `agent-test-b` |
| **Profils** | 3 | `profil-developpeur`, `profil-reviewer`, `profil-test-minimal` |
| **Prompts** | 10 | `prompt-generation`, `prompt-validation`, `prompt-scene1-*`, `prompt-scene2-*`, `prompt-scene3-*` |
| **Conditions Exit** | 3 | `exit-termine`, `exit-audit`, `exit-fait` |
| **Scripts If** | 3 | `est-valide`, `fichier-scene1-ecrit`, `reponse-oui` |

Note : la rubrique Scénarios vérifie la **présence** des 5 scénarios seed ; un effectif strict n'est pas imposé afin de tolérer d'éventuels scénarios locaux hors templates.

---

## Sélecteurs DOM & Éléments de contrôle

| Élément | Sélecteur DOM |
|---|---|
| Liens de navigation | `.sidebar-nav a[data-section="<section>"]`, `[data-section="<section>"]` |
| Titre de la vue | `#view-title` |
| Tableau de données | `.data-table`, `table` |
| Lignes de données réelles | `.data-table tbody tr:not(.empty)`, `table tbody tr` |
| Cellules d'action | `.data-table tbody td.actions`, `table tbody td` |

---

## Test automatisé

**Nom attendu :** `test_CASE_UI_01_5_e2e_full_seed_resources_visual_rendering`  
**Fichier :** `tests/e2e/ui/CASE-UI-01-5.e2e.test.ts`  
**Outil :** Playwright (`@playwright/test`)

## Revue du test automatisé

- [ ] Le test navigue sur chacune des 6 rubriques de l'application via les sélecteurs de navigation.
- [ ] Le test vérifie la présence effective et le contenu des données seed restituées dans chaque table.
- [ ] Le test vérifie l'absence totale d'écran blanc, de table vide et d'erreur console navigateur.
- [ ] Le nom du test contient `CASE_UI_01_5`.
- [ ] Le test échoue si les données seed ne sont pas injectées au démarrage.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-012 — seed exit au format `{ id, name, content }` (3 ressources).
