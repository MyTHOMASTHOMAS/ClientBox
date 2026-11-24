import { h, type ComponentChildren } from 'preact';

/** Définition d'une colonne de données dans le tableau. */
export interface ColumnDef<T> {
  readonly key: string;
  readonly label: string;
  readonly render?: (item: T) => ComponentChildren;
  readonly className?: string;
}

/** Propriétés du tableau déclaratif générique. */
export interface DataTableProps<T> {
  readonly columns: readonly ColumnDef<T>[];
  readonly data: readonly T[];
  readonly actions?: (item: T) => ComponentChildren;
  readonly emptyMessage?: string;
  readonly className?: string;
}

/**
 * Composant de tableau de données stylisé avec colonnes dynamiques et actions.
 * @param props Propriétés du composant
 */
export function DataTable<T extends Record<string, unknown>>(props: DataTableProps<T>) {
  const {
    columns,
    data,
    actions,
    emptyMessage = 'Aucune donnée disponible.',
    className = '',
  } = props;

  if (data.length === 0) {
    return (
      <div className="p-10 text-center text-outline font-mono text-xs bg-surface-panel/80 rounded-xl border border-white/10 shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border border-white/10 bg-surface-panel/80 backdrop-blur shadow-sm ${className}`}
    >
      <table className="w-full text-left border-collapse text-body-sm">
        <thead>
          <tr className="border-b border-white/10 bg-surface-container-high/60 text-outline text-[11px] font-mono uppercase tracking-wider">
            {columns.map((col) => (
              <th key={col.key} className={`px-5 py-3 font-medium ${col.className ?? ''}`}>
                {col.label}
              </th>
            ))}
            {actions && <th className="px-5 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 font-body-sm text-body-sm text-on-surface">
          {data.map((item, rowIdx) => (
            <tr
              key={(item as { id?: string }).id ?? rowIdx}
              className="hover:bg-white/[0.03] transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-5 py-3.5 ${col.className ?? ''}`}>
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </td>
              ))}
              {actions && (
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">{actions(item)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
