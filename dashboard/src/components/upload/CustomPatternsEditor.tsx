import { useState } from 'react';

interface CustomPatternsEditorProps {
  patterns: Record<string, string>;
  onChange: (patterns: Record<string, string>) => void;
}

interface PatternRow {
  id: number;
  name: string;
  pattern: string;
  error: string | null;
}

let nextId = 0;

function validateRegex(pattern: string): string | null {
  if (!pattern.trim()) return null;
  try {
    new RegExp(pattern);
    return null;
  } catch {
    return 'Invalid regex pattern';
  }
}

export default function CustomPatternsEditor({ patterns, onChange }: CustomPatternsEditorProps) {
  const [rows, setRows] = useState<PatternRow[]>(() =>
    Object.entries(patterns).map(([name, pattern]) => ({
      id: nextId++,
      name,
      pattern,
      error: validateRegex(pattern),
    }))
  );

  const updateAndEmit = (updated: PatternRow[]) => {
    setRows(updated);
    const record: Record<string, string> = {};
    for (const row of updated) {
      if (row.name.trim() && row.pattern.trim() && !row.error) {
        record[row.name.trim()] = row.pattern.trim();
      }
    }
    onChange(record);
  };

  const addRow = () => {
    updateAndEmit([...rows, { id: nextId++, name: '', pattern: '', error: null }]);
  };

  const updateRow = (id: number, field: 'name' | 'pattern', value: string) => {
    updateAndEmit(
      rows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'pattern') updated.error = validateRegex(value);
        return updated;
      })
    );
  };

  const removeRow = (id: number) => {
    updateAndEmit(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">Custom Patterns</label>
      <p className="text-xs text-gray-400">Validate column values match a regex pattern</p>
      {rows.map((row) => (
        <div key={row.id} className="space-y-1">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={row.name}
              onChange={(e) => updateRow(row.id, 'name', e.target.value)}
              placeholder="Column name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
              aria-label="Field name for pattern"
            />
            <input
              type="text"
              value={row.pattern}
              onChange={(e) => updateRow(row.id, 'pattern', e.target.value)}
              placeholder="e.g. ^\d{3}-\d{4}$"
              className={`flex-1 rounded-lg border px-3 py-2 font-mono text-sm transition-colors focus:outline-none ${
                row.error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
              aria-label={`Regex pattern for ${row.name || 'field'}`}
              aria-invalid={!!row.error}
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label={`Remove pattern for ${row.name || 'field'}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {row.error && (
            <p className="text-xs text-red-600 sm:ml-[calc(50%+0.25rem)]" role="alert">{row.error}</p>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
      >
        + Add Pattern
      </button>
    </div>
  );
}
