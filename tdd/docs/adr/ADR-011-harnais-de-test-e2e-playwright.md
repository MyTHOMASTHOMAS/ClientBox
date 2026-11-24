# ADR-011 — Harnais de test E2E avec Playwright et validation du Canvas

**Statut :** accepté  
**Date :** 09/10/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- une **ADR** enregistre une décision prise.

---

## Ancrage CDC & ADR

| Référence | Rôle |
|---|---|
| REQ-003, REQ-004, REQ-108 | Livrable standalone servant l'UI web sur la racine HTTP |
| REQ-014, REQ-035, SPEC-UI-02 | Canvas interactif d'orchestration nodale (style N8N) |
| REQ-024, SPEC-UI-03 | Terminal live en streaming SSE (`/api/stream`) |
| ADR-001 | Socle applicatif Node standalone servant l'IHM web |
| ADR-007 | Vitest pour les tests unitaires et d'architecture en TypeScript |
| ADR-012 | Front in-memory exclusif compilé depuis `src/ui/` et retrait de `PUBLIC_DIR` (remplaçant ADR-010) |

Cet ADR **complète** l'ADR-006, l'ADR-007 et l'ADR-012 en introduisant le harnais de test E2E (End-to-End) en boîte noire dans un véritable navigateur.

---

## Contexte

ClientsBox adopte une stratégie de distribution web autonome 100% in-memory (ADR-012), où l'interface web est compilée depuis `src/ui/` et servie directement en mémoire.

De plus, l'interface intègre un composant **Canvas interactif** (nœuds, câbles, drag & drop) et un **terminal SSE en temps réel**. Les tests unitaires sous Node.js (via Vitest) simulent le DOM mais ne disposent pas d'un véritable moteur graphique 2D ni de navigation HTTP/SSE réelle en conditions réelles de navigateur.

Il faut trancher :
1. L'outil officiel pour les tests E2E navigateur.
2. La stratégie de test des interactions sur le Canvas, de la navigation et des flux temps réel.

---

## Options envisagées

### Option A — JSDOM / Happy-DOM uniquement dans Vitest
| | |
|---|---|
| Ce qu'elle apporte | Aucun nouvel outil à installer. |
| Ce qu'elle coûte | Pas de vrai rendu Canvas (2D context mocké), pas de requêtes socket/réseau réelles en boîte noire. |
| Ce qu'elle rend difficile | Valider le comportement du Canvas, du drag & drop et de la bascule réelle du serveur HTTP. |

### Option B — Playwright en navigateur Chromium Headless (retenue)
| | |
|---|---|
| Ce qu'elle apporte | Vrai moteur de rendu graphique (Chromium), interaction précise sur le Canvas `(x, y)`, support natif des flux SSE `/api/stream`, test en boîte noire du serveur HTTP compilé. |
| Ce qu'elle coûte | Ajout de `@playwright/test` en devDependencies. |
| Ce qu'elle rend difficile plus tard | Aucun blocage. |

---

## Décision

ClientsBox adopte **Playwright** comme harnais officiel pour les tests de bout en bout (E2E) :

1. **Isolation des suites de tests :**
   - `npm test` : Vitest pour les tests unitaires, de domaine, de contrôleurs et d'architecture.
   - `npm run test:e2e` : Playwright pour les tests E2E navigateur.

2. **Scénario IHM, Vues & Navigation :**
   - Playwright valide le chargement autonome de l'application in-memory, l'affichage du menu et la navigation entre les vues principales.

3. **Scénario Canvas & Terminal SSE :**
   - Playwright valide le chargement du Canvas et la réception des flux SSE en direct dans le terminal.

---

## Conséquences acceptées

- Playwright nécessite l'installation de ses binaires de navigateur (`npx playwright install chromium`) dans l'environnement de dev/CI.

---

## Liens

- Socle applicatif : **ADR-001**.
- Framework de test TypeScript : **ADR-007**.
- UI Assets embarqués : **ADR-010**.
- Distribution statique et Canvas : **SPEC-SRV-02**, **SPEC-UI-02**.
