import { useState } from 'react';

interface FieldTypesEditorProps {
  fieldTypes: Record<string, string>;
  onChange: (fieldTypes: Record<string, string>) => void;
}

interface FieldTypeRow {
  id: number;
  name: string;
  type: string;
}

const TYPE_OPTIONS = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
];

let nextId = 0;

export default function FieldTypesEditor({ fieldTypes, onChange }: FieldTypesEditorProps) {
  const [rows, setRows] = useState<FieldTypeRow[]>(() =>
    Object.entries(fieldTypes).map(([name, type]) => ({ id: nextId++, name, type }))
  );

  const updateAndEmit = (updated: FieldTypeRow[]) => {
    setRows(updated);
    const record: Record<string, string> = {};
    for (const row of updated) {
      if (row.name.trim()) record[row.name.trim()] = row.type;
    }
    onChange(record);
  };

  const addRow = () => {
    updateAndEmit([...rows, { id: nextId++, name: '', type: 'string' }]);
  };

  const updateRow = (id: number, field: 'name' | 'type', value: string) => {
    updateAndEmit(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeRow = (id: number) => {
    updateAndEmit(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">Field Types</label>
      <p className="text-xs text-gray-400">Validate column values match a specific type</p>
      {rows.map((row) => (
        <div key={row.id} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={row.name}
            onChange={(e) => updateRow(row.id, 'name', e.target.value)}
            placeholder="Column name"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
            aria-label="Field name"
          />
          <select
            value={row.type}
            onChange={(e) => updateRow(row.id, 'type', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
            aria-label={`Type for ${row.name || 'field'}`}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label={`Remove type rule for ${row.name || 'field'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
      >
        + Add Field Type
      </button>
    </div>
  );
}
