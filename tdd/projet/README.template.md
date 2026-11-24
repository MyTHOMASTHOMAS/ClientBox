# Projet <NOM-PROJET> — équipe `<NOM-EQUIPE>`

Repository de mission. Il contient l'analyse, la conception, les tests et le code.
Il est aussi le support du dossier de projet.

> Ce dépôt raconte l'histoire de la conception du logiciel. Un lecteur doit
> pouvoir partir de n'importe quelle ligne de code et remonter jusqu'au besoin du
> client, et inversement.

---

## 1. Les trois règles

Elles ne se négocient pas.

1. **Aucun code généré sans spécification.**
2. **Aucune fonctionnalité acceptée sans preuve.**
3. **Aucun code livré sans compréhension humaine.**

---

## 2. Qui fait quoi

| Étape | Responsable | Rôle de l'IA |
|---|---|---|
| Comprendre le besoin | **Vous** | aucun |
| Cahier des charges | **Vous** | aucun |
| Spécifier | **Vous** | revue critique |
| Concevoir (UML, BDD, archi) | **Vous** | revue critique |
| Définir les cas de test | **Vous** | revue critique |
| Automatiser les tests | IA | production |
| Reviewer les tests générés | **Vous** | aucun |
| Découper en tâches, piloter | **Vous** | aucun |
| Produire le code | IA | production |
| Reviewer le code | **Vous** | second regard possible |
| Corriger | IA | production |
| Accepter | **Vous** | aucun |

Deux boucles, dans cet ordre : **avant** le développement, l'IA critique votre
travail ; **après** la génération, vous critiquez le travail de l'IA.

---

## 3. Arborescence

```text
.
├── README.md
├── docs/
│   ├── cdc/
│   │   └── cahier-des-charges-v<n>.md     à versionner : v1, v2…
│   ├── cr/
│   │   └── compte-rendu-entretien-<nn>.md un fichier par entretien
│   ├── delegation/
│   │   └── delegation-<DOMAINE>.md        un fichier par domaine délégué
│   ├── impact/
│   │   └── impact-CR-<nnn>.md             un fichier par changement client
│   ├── traceability.md                    maintenu à la main
│   ├── signature.md                       rapport d'architecture
│   ├── prompt/
│   │   ├── PROMPT_CONTEXTE_INITIAL.md     instructions système agent
│   │   ├── code/
│   │   │   └── <DOMAINE>/                 un prompt par cas de test
│   │   └── test/
│   │       └── <DOMAINE>/                 un prompt par cas de test
│   ├── uml/
│   │   ├── use-cases.puml
│   │   ├── domain.puml
│   │   └── sequences/
│   └── adr/
│       ├── ADR-000-template.md
│       └── ADR-001-<sujet>.md
├── specs/
│   └── <domaine>.md                       contient les SPEC-<DOM>-nn
├── tests/
│   ├── cases/
│   │   ├── <domaine>/
│   │   │   ├── CASE-<DOM>-<nn>.md         un fichier par cas
│   │   │   └── sommaire.md
│   │   └── …
│   └── …                                 tests automatisés
├── src/
└── reports/
```

Ce qui n'est **pas** dans ce dépôt n'existe pas. Une décision prise oralement et
non écrite est une décision perdue.

---

## 4. Identifiants et traçabilité

La chaîne complète :

```text
CR-<nn>/Q<nn> → REQ-<nnn> → SPEC-<DOM>-<nn> → CASE-<DOM>-<nn> → test → code → commit
```

Elle commence à un **échange consigné** avec le client, pas à une exigence. Une
règle métier qui ne vient d'aucun échange consigné ne vient de nulle part.

| Niveau | Format | Où il est défini | Ce qu'il doit citer |
|---|---|---|---|
| Échange | `CR-<nn>/Q<nn>` | `docs/cr/compte-rendu-entretien-<nn>.md`, questions numérotées `Qnn` | — |
| Exigence | `REQ-<nnn>` | `docs/cdc/cahier-des-charges.md` | un `CR-nn/Qnn`, ou `déduit` + justification |
| Spécification | `SPEC-<DOM>-<nn>` | `specs/<domaine>.md`, en titre de section | au moins un `REQ` |
| Cas de test | `CASE-<DOM>-<nn>` | `tests/cases/<domaine>/CASE-<DOM>-<nn>.md` | au moins un `SPEC` |
| Test automatisé | l'ID `CASE` **dans le nom du test** | `tests/` | — |
| Commit | l'ID `SPEC` dans le message | git | — |

Le domaine `<DOM>` est en majuscules, court, stable. Les numéros sont sur deux
chiffres, les `REQ` sur trois.

Exemple de nom de test :

```text
test_CASE_<DOM>_<nn>_<description_courte>
```

---

## 5. Commits

```text
<type>(<domaine>): <SPEC-ID> <description courte>

<pourquoi, si ce n'est pas évident>

Generated-by: <outil>          ← uniquement si le contenu a été produit par l'agent
```

Types : `spec`, `design`, `test`, `feat`, `fix`, `docs`, `chore`.

Activer le gabarit de message :

```bash
git config commit.template .gitmessage
```

---

## 6. Rythme

Ce qui est fixé :

- les **rendez-vous client**, annoncés à l'avance ;
- le **push quotidien** ;
- les **jalons intermédiaires** ;
- la **présentation finale**.

Vous commitez souvent dans la journée pour ne rien perdre ; vous poussez le soir
pour ne pas dépendre d'un poste.
