/**
 * Formulaire de configuration du bloc Command dans l'InspectorPanel (ADR-019 / SPEC-UI-02).
 */

import { h } from 'preact';
import type { ScenarioNode } from '../../../types/models/node.model.js';

/**
 * Rend les champs de formulaire d'inspection pour un bloc Command.
 *
 * @param node Nœud inspecté
 * @param onChange Callback de mutation de champ
 * @param isReadOnly Indique si le panneau est verrouillé en lecture seule
 */
export function renderCommandFields(
  node: ScenarioNode,
  onChange: (field: string, val: string) => void,
  isReadOnly?: boolean,
) {
  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="field-command-line"
          className="block text-body-sm font-medium text-on-surface mb-1"
        >
          Ligne de commande (commandLine)
        </label>
        <textarea
          id="field-command-line"
          data-field="commandLine"
          disabled={isReadOnly}
          rows={4}
          value={node.commandLine ?? ''}
          placeholder="ex: npm test ou sh run.sh"
          onInput={(e) => onChange('commandLine', (e.target as HTMLTextAreaElement).value)}
          className="w-full font-mono text-body-sm px-2.5 py-1.5 rounded bg-surface-container border border-border-default text-on-surface focus:outline-none focus:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed resize-y"
        />
        <p className="mt-1 text-[11px] text-outline">
          Commande shell exécutée avec cwd = workspacePath. Émet power 1 sur exit 0.
        </p>
      </div>
    </div>
  );
}
