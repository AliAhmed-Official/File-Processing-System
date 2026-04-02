import { useState } from 'react';

interface RequiredFieldsEditorProps {
  fields: string[];
  onChange: (fields: string[]) => void;
}

export default function RequiredFieldsEditor({ fields, onChange }: RequiredFieldsEditorProps) {
  const [input, setInput] = useState('');

  const addField = () => {
    const name = input.trim();
    if (!name || fields.includes(name)) return;
    onChange([...fields, name]);
    setInput('');
  };

  const removeField = (field: string) => {
    onChange(fields.filter((f) => f !== field));
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">Required Fields</label>
      <p className="text-xs text-gray-400">CSV columns that must not be empty</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addField(); } }}
          placeholder="e.g. email"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
          aria-label="Required field name"
        />
        <button
          type="button"
          onClick={addField}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Add
        </button>
      </div>
      {fields.length > 0 && (
        <ul className="flex flex-wrap gap-2" role="list" aria-label="Required fields list">
          {fields.map((field) => (
            <li key={field} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
              {field}
              <button
                type="button"
                onClick={() => removeField(field)}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-blue-200"
                aria-label={`Remove ${field}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
