/**
 * Page des paramètres système et statut de persistance locale de ClientsBox.
 */

import { h } from 'preact';
import type { HttpClient } from '../api/http.client.js';
import { Badge } from '../components/common/badge.js';

/** Propriétés du composant VDOM SettingsPage. */
export interface SettingsPageProps {
  readonly client?: HttpClient;
}

function renderServerCard() {
  return (
    <div className="bg-surface-panel/80 backdrop-blur rounded-xl border border-white/10 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="font-semibold text-on-surface text-body-md">Serveur HTTP Local</span>
        <Badge variant="success" hasDot={true}>
          En ligne :2974
        </Badge>
      </div>
      <div className="mt-3.5 space-y-2.5 text-xs font-mono text-on-surface-variant">
        <div className="flex justify-between">
          <span className="text-outline">Mode :</span>
          <span className="text-on-surface">Standalone Local-First</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">URL Racine :</span>
          <span className="text-primary">http://127.0.0.1:2974/</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Flux SSE :</span>
          <span className="text-emerald-400">Actif (/api/scenarios/:id/stream)</span>
        </div>
      </div>
    </div>
  );
}

function renderStorageCard() {
  return (
    <div className="bg-surface-panel/80 backdrop-blur rounded-xl border border-white/10 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="font-semibold text-on-surface text-body-md">Persistance des Données</span>
        <Badge variant="primary" hasDot={true}>
          Local-First
        </Badge>
      </div>
      <div className="mt-3.5 space-y-2.5 text-xs font-mono text-on-surface-variant">
        <div className="flex justify-between">
          <span className="text-outline">Répertoire :</span>
          <span className="text-on-surface">.agents/data/</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Format de stockage :</span>
          <span className="text-on-surface">JSON canonique &amp; scripts JS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Sécurisation :</span>
          <span className="text-status-success">Verrou d'écriture actif</span>
        </div>
      </div>
    </div>
  );
}

function renderCliCard() {
  return (
    <div className="bg-surface-panel/80 backdrop-blur rounded-xl border border-white/10 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="font-semibold text-on-surface text-body-md">
          Adaptateur CLI d'Exécution
        </span>
        <Badge variant="neutral" hasDot={true}>
          cursor-cli
        </Badge>
      </div>
      <div className="mt-3.5 space-y-2.5 text-xs font-mono text-on-surface-variant">
        <div className="flex justify-between">
          <span className="text-outline">Exécutable :</span>
          <span className="text-on-surface">cursor-cli</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Mode processus :</span>
          <span className="text-on-surface">Spawn isolé (Node.js child_process)</span>
        </div>
      </div>
    </div>
  );
}

function renderMetaCard() {
  return (
    <div className="bg-surface-panel/80 backdrop-blur rounded-xl border border-white/10 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="font-semibold text-on-surface text-body-md">ClientsBox IDE</span>
        <span className="text-outline font-mono text-xs">v0.1.0</span>
      </div>
      <div className="mt-3.5 space-y-2.5 text-xs font-mono text-on-surface-variant">
        <div className="flex justify-between">
          <span className="text-outline">Frontend :</span>
          <span className="text-on-surface">Preact VDOM &amp; Tailwind v4</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Assets :</span>
          <span className="text-on-surface">Embarqués en mémoire (ADR-012)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Page de consultation des paramètres système et statut de persistance locale.
 * @param props Propriétés de la page paramètres
 */
export function SettingsPage(props: SettingsPageProps) {
  void props;
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
          Paramètres Système
        </h1>
        <p className="text-on-surface-variant text-body-sm mt-1">
          Configuration de l'environnement, adaptateurs CLI et persistance locale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderServerCard()}
        {renderStorageCard()}
        {renderCliCard()}
        {renderMetaCard()}
      </div>
    </div>
  );
}
