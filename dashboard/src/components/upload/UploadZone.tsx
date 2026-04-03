import { useCallback, useRef, useState } from 'react';
import { useUpload } from '../../hooks/useUpload';
import ProgressBar from '../jobs/ProgressBar';
import ValidationRulesForm from './ValidationRulesForm';
import type { ValidationRules, ConcurrentUploadEntry } from '../../types/upload.types';

const MAX_FILE_SIZE = 500 * 1024 * 1024;

function UploadEntryRow({
  entry,
  onDismiss,
}: {
  entry: ConcurrentUploadEntry;
  onDismiss: (id: string) => void;
}) {
  const isDismissable = entry.status === 'done' || entry.status === 'error';

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-700">{entry.fileName}</p>
        <div className="mt-1">
          <ProgressBar progress={entry.progress} />
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {entry.status === 'uploading' && (
          <span className="text-xs text-blue-600">{entry.progress}%</span>
        )}
        {entry.status === 'confirming' && (
          <span className="text-xs text-blue-600">Confirming...</span>
        )}
        {entry.status === 'done' && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <span aria-hidden="true">&#x2713;</span> Job: <code className="font-mono">{entry.jobId}</code>
          </span>
        )}
        {entry.status === 'error' && (
          <span className="flex items-center gap-1 text-xs text-red-600" title={entry.error ?? undefined}>
            <span aria-hidden="true">&#x2717;</span> Failed
          </span>
        )}
        {isDismissable && (
          <button
            onClick={() => onDismiss(entry.id)}
            className="ml-1 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            aria-label={`Dismiss ${entry.fileName}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function UploadZone() {
  const { uploads, upload, dismiss, dismissAll } = useUpload();
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [priority, setPriority] = useState<number>(5);
  const validationRulesRef = useRef<ValidationRules>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      setValidationError(null);
      if (!fileList || fileList.length === 0) return;

      const file = fileList[0];

      if (!file.name.toLowerCase().endsWith('.csv')) {
        setValidationError(`"${file.name}" is not a CSV file. Only .csv files are supported.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setValidationError(`"${file.name}" exceeds 500MB limit.`);
        return;
      }

      const rules = validationRulesRef.current;
      const hasRules =
        (rules.requiredFields?.length ?? 0) > 0 ||
        Object.keys(rules.fieldTypes ?? {}).length > 0 ||
        Object.keys(rules.customPatterns ?? {}).length > 0;

      upload(file, { priority, ...(hasRules ? { validationRules: rules } : {}) });

      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [upload, priority]
  );

  const entries = Object.values(uploads);
  const hasDismissable = entries.some((e) => e.status === 'done' || e.status === 'error');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 animate-fade-in">
      <h3 className="mb-3 text-sm font-medium text-gray-700">Upload CSV Files</h3>

      {/* Always-visible upload form */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors duration-200 ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Drop zone for CSV file upload"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-gray-600">Drag & drop a CSV file here, or</p>
        <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          Browse Files
          <input
            ref={fileInputRef}
            id="csv-file-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="Select a CSV file to upload"
          />
        </label>
        <p className="mt-2 text-xs text-gray-400">CSV files up to 500MB each</p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <label htmlFor="priority-select" className="text-sm font-medium text-gray-700">Priority</label>
        <select
          id="priority-select"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}{n === 1 ? ' (Highest)' : n === 5 ? ' (Default)' : n === 10 ? ' (Lowest)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <ValidationRulesForm onChange={(rules) => { validationRulesRef.current = rules; }} />
        <p className="mt-1 text-xs text-gray-400">Validation rules apply to all uploaded files</p>
      </div>

      {validationError && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
          <span aria-hidden="true">&#x2717;</span>
          {validationError}
        </div>
      )}

      {/* Active & recent uploads list */}
      {entries.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Uploads</h4>
            {hasDismissable && (
              <button
                onClick={dismissAll}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear completed
              </button>
            )}
          </div>
          {entries.map((entry) => (
            <UploadEntryRow key={entry.id} entry={entry} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  );
}
