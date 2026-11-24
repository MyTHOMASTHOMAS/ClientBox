# Référentiel documentaire `tdd/` — Mode d'emploi

Ce répertoire **`tdd/`** (racine réelle du kit dans ClientsBox) contient à la fois :

1. **Des gabarits** (suffixe `.template.md`, `.gitmessage.template`, ou `ADR-000-template.md`) — **17** artefacts gabarit-like.
2. **Le référentiel projet ClientsBox déjà rempli** : CDC v1 verrouillé, ADR-001…006, signatures, specs, UML, CASE — inventaire courant ≈ **111** fichiers sous `tdd/`.

> Il n'existe **pas** de sous-dossier `templates/` : ne pas chercher à « copier `templates/` ».

---

## Comment démarrer un nouveau projet (à partir des gabarits seuls)

1. **Copier** depuis `tdd/` les gabarits utiles (ou cloner la structure `projet/`, `docs/`, `specs/`, `tests/cases/`) dans le nouveau dépôt.
2. **Renommer** les fichiers `.template.md` en `.md` et adapter les noms (`<DOMAINE>`, `<NOM-EQUIPE>`, etc.).
3. **Remplir** chaque placeholder `<…>` avec les informations du projet.
4. **Adapter** ce `README.md` à votre propre mode d'emploi.

Pour **ClientsBox**, ne pas écraser les artefacts déjà versionnés (CDC v1, ADR, specs, tests) : ils constituent la source de vérité du projet.

---

## Structure (extrait — gabarits)

```text
tdd/
├── README.md                                 ← ce fichier
├── projet/
│   ├── README.template.md
│   └── .gitmessage.template
├── docs/
│   ├── cdc/
│   │   ├── cahier-des-charges.template.md
│   │   └── cahier-des-charges-v1.md          ← instance ClientsBox (verrouillée)
│   ├── signature/
│   │   ├── signature.template.md
│   │   ├── signature-domain.template.md
│   │   └── signature*.md                     ← instances remplies
│   ├── adr/
│   │   ├── ADR-000-template.md
│   │   ├── README.md
│   │   └── ADR-001…006-*.md                  ← décisions v1
│   ├── cr/compte-rendu-entretien.template.md
│   ├── delegation/delegation.template.md
│   ├── impact/impact-CR.template.md
│   ├── prompt/… (PROMPT_CONTEXTE_INITIAL, code/, test/)
│   ├── uml/… (README.template.md + diagrammes .puml)
│   └── traceability.template.md
├── specs/… (domaine.template.md + domaines SRV/DATA/…)
└── tests/cases/… (CASE.template.md, sommaire.template.md + CASE remplis)
```

---

## Convention des placeholders

Tous les éléments à remplir sont marqués par des chevrons : `<…>`.

| Placeholder | Signification |
|---|---|
| `<NOM-PROJET>` | Nom du projet |
| `<NOM-EQUIPE>` | Nom de l'équipe |
| `<DOMAINE>` | Domaine fonctionnel (ex : BOOKING, ADMIN, PAYMENT) |
| `<nn>` | Numéro séquentiel (sur 2 ou 3 chiffres selon le contexte) |
| `<date>` | Date au format JJ/MM/AAAA |
| `<…>` | Contenu libre à rédiger |

---

## Chaîne de traçabilité

Les templates sont conçus pour maintenir la chaîne complète :

```text
CR-nn/Qnn → REQ-nnn → SPEC-<DOM>-nn → CASE-<DOM>-nn → test automatisé → code → commit
```

Chaque maillon cite sa source. Une rupture dans la chaîne est un trou dans la
couverture.

---

## Cycle de vie et ordre de remplissage

### 1. Cycle initial (démarrage du projet / v1)

1. `projet/README.template.md` & `.gitmessage.template` — Poser le cadre et les conventions du dépôt.
2. `docs/cr/compte-rendu-entretien.template.md` (`CR-01`) — Consigner le premier entretien client (verbatim, questions `Qnn`).
3. `docs/cdc/cahier-des-charges.template.md` (`CDC v1`) — Formaliser le problème, les règles métier `R-nn` et exigences `REQ-nnn`.
4. `docs/adr/ADR-000-template.md` (`ADR-001`, `ADR-002`…) — Trancher les choix d'architecture, stack et persistance.
5. `docs/uml/README.template.md` (`domain.puml`, séquences) — Modéliser le domaine et la conception.
6. `specs/domaine.template.md` (`SPEC-<DOM>-nn`) — Spécifier les comportements attendus (Gherkin, cas limites).
7. `tests/cases/CASE.template.md` & `sommaire.template.md` — Rédiger les cas de test détaillés et les indexer.
8. `docs/signature.template.md` — Valider et signer l'architecture technique du socle `src/`.
9. `docs/traceability.template.md` — Initialiser la matrice de traçabilité de bout en bout.
10. `docs/prompt/PROMPT_CONTEXTE_INITIAL.template.md` — Injecter le contexte système dans l'agent IA.
11. `docs/prompt/test/prompt-test.template.md` — Générer les tests automatisés (`CASE` → test).
12. `docs/delegation/delegation.template.md` — Planifier la délégation des tâches (tableau Avant).
13. `docs/prompt/code/prompt-code.template.md` — Produire le code de production (test rouge → vert).

---

### 2. Cycle de changement de besoin (nouveau CR en cours de projet)

> **Règle d'or :** Ne jamais modifier le code directement lorsqu'un client change d'avis. La modification descend rigoureusement la chaîne :
>
> $$\text{CR-nn} \longrightarrow \mathbf{\text{Analyse d'impact (impact-CR-nnn)}} \longrightarrow \text{CDC v(n+1)} \longrightarrow \text{specs} \longrightarrow \text{UML} \longrightarrow \text{cas de test} \longrightarrow \text{tests} \longrightarrow \text{code}$$

1. `docs/cr/compte-rendu-entretien-<nn>.md` — Consigner les nouvelles demandes et réponses du client.
2. **`docs/impact/impact-CR-<nnn>.md`** — **Analyser immédiatement les impacts** sur les 10 sections avant toute modification.
3. `docs/cdc/cahier-des-charges-v<n+1>.md` — Publier la nouvelle version du cahier des charges intégrant les impacts.
4. `specs/<domaine>.md` — Réviser ou créer les spécifications impactées.
5. `docs/uml/` — Adapter le modèle de domaine (`domain.puml`) ou le schéma BDD si des entités/états changent.
6. `tests/cases/` — Mettre à jour les cas existants ou en créer de nouveaux.
7. `tests/` & `src/` — Produire les tests automatisés puis le code correctif via les prompts.
8. `docs/traceability.md` — Réaligner la matrice de traçabilité.

