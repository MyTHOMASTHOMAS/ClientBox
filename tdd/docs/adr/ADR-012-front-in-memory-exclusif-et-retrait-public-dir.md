# ADR-012 — Front in-memory exclusif compilé depuis `src/ui/` et retrait de `PUBLIC_DIR`

**Statut :** accepté  
**Date :** 16/10/2026  
**Décidé par :** Autrement (`U`)  
**Remplace :** [`ADR-010`](./ADR-010-ui-assets-embarques-et-public-dir.md)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

---

## Ancrage CDC & ADR

| Référence | Rôle |
|---|---|
| REQ-003, REQ-108, Annexe A | Livrable standalone : un fichier JS unique (`clientsbox.js`) copié sans dépendance de dossier public externe |
| REQ-004, SPEC-SRV-02 | Distribution de l'interface utilisateur web sur la racine HTTP (`/`) |
| ADR-001 | Application Node standalone précompilée unique servant elle-même son interface HTTP |
| ADR-008 | Anticipation du packaging des assets statiques dans le livrable via le pipeline Vite |
| ADR-010 | Ancien mécanisme prévoyant un répertoire disque externe (`PUBLIC_DIR`) et un fallback in-memory (remplacé) |
| ADR-011 | Harnais de test E2E Playwright |

---

## Contexte

L'ADR-010 avait introduit un double mécanisme de distribution statique :
1. Lecture sur disque d'un dossier externe pointé par `PUBLIC_DIR` (par défaut `public/`).
2. Fallback in-memory vers des assets compilés.

Ce double mode présentait plusieurs inconvénients :
- Duplication inutile de fichiers entre le code TypeScript sous `src/ui/` et des fichiers statiques non maintenus dans `public/`.
- Complexité superflue dans `in-memory-static.handler.ts` (vérifications `fs.existsSync`, gestion des chemins absolus/relatifs, risque résiduel de path traversal sur disque).
- Fragilité des tests E2E et unitaires nécessitant des fixtures de simulation disque (`tests/fixtures/ui-public`, `tests/fixtures/empty-public`).

L'utilisateur a acté le retrait de la fonctionnalité de front externe sur disque et la suppression du dossier `public/`.

---

## Décision

1. **Retrait de `PUBLIC_DIR` et suppression de `public/` :**
   - La variable `PUBLIC_DIR` est supprimée de l'environnement (`.env.example`, `.env`) et du résolveur d'environnement (`src/lib/process/env-layout.resolver.ts`, LIB-005).
   - Le dossier `public/` à la racine est définitivement supprimé.

2. **Source unique de vérité sous `src/ui/` :**
   - L'interface utilisateur est entièrement développée sous forme de modules TypeScript et de styles CSS sous `src/ui/`.

3. **Compilation hermétique in-memory au build :**
   - Le script `scripts/build-embedded-assets.ts`, orchestré via un plugin Vite au démarrage du build (`buildStart`), compile `src/ui/app.ts` et `src/ui/styles/app.css` programmatiquement en mémoire (`write: false`).
   - Il génère la table d'assets sérialisée dans `src/lib/http/embedded-assets.generated.ts`.
   - Tout fichier portant l'extension `*.generated.ts` est un artefact de compilation volatile exclu de l'inventaire des 163 signatures canoniques et exempté des audits de code statique. Il n'est pas versionné dans le dépôt Git (`.gitignore`, `.prettierignore`, `eslint.config.js`).

4. **Distribution HTTP 100% in-memory :**
   - `src/lib/http/in-memory-static.handler.ts` (LIB-008) distribue directement depuis la table d'assets en mémoire via `getEmbeddedAsset` importé depuis `./embedded-assets.generated.js`.
   - Plus aucun accès au système de fichiers n'est réalisé pour l'UI, garantissant une sécurité et une étanchéité absolues.
   - Les options de `createLocalHttpServer` (LIB-010) ne requièrent plus de `publicDir`.

5. **Retrait des critères et cas associés :**
   - Le critère d'acceptation `AC-SRV-02-8` et le cas de test `CASE-SRV-02-9` (scénario de bascule externe/interne) sont retirés des spécifications et des suites de tests E2E.
   - Les fixtures associées `tests/fixtures/ui-public` et `tests/fixtures/empty-public` sont supprimées.

---

## Conséquences acceptées

- Livrable 100% autonome et hermétique dans `dist/clientsbox.js`.
- Zéro risque de vulnérabilité de type path traversal pour la couche de distribution statique web.
- Pour tester ou exécuter l'IHM en mode développement, un build préalable ou un serveur local servant les assets compilés est utilisé.

---

## Liens

- Socle applicatif : **ADR-001**.
- Pipeline de build Vite : **ADR-008**.
- Ancien ADR remplacé : **ADR-010**.
- Harnais E2E Playwright : **ADR-011**.
- Serveur HTTP local : **SPEC-SRV-02** / `CASE-SRV-02-1`.
