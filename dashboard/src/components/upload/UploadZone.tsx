import { useCallback, useRef, useState } from 'react';
import { useUpload } from '../../hooks/useUpload';
import { useBatchUpload } from '../../hooks/useBatchUpload';
import ProgressBar from '../jobs/ProgressBar';
import ValidationRulesForm from './ValidationRulesForm';
import type { ValidationRules, BatchFileState } from '../../types/upload.types';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 500 * 1024 * 1024;

function FileProgressRow({ file }: { file: BatchFileState }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-700">{file.file.name}</p>
        <div className="mt-1">
          <ProgressBar progress={file.progress} />
        </div>
      </div>
      <div className="flex-shrink-0">
        {file.status === 'pending' && <span className="text-xs text-gray-400">Waiting</span>}
        {file.status === 'uploading' && <span className="text-xs text-blue-600">{file.progress}%</span>}
        {file.status === 'uploaded' && <span className="text-xs text-blue-600">Confirming...</span>}
        {file.status === 'done' && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <span aria-hidden="true">&#x2713;</span> Done
          </span>
        )}
        {file.status === 'error' && (
          <span className="flex items-center gap-1 text-xs text-red-600" title={file.error ?? undefined}>
            <span aria-hidden="true">&#x2717;</span> Failed
          </span>
        )}
      </div>
    </div>
  );
}

export default function UploadZone() {
  const single = useUpload();
  const batch = useBatchUpload();
  const [mode, setMode] = useState<'idle' | 'single' | 'batch'>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const validationRulesRef = useRef<ValidationRules>({});

  const isIdle = mode === 'idle' || (mode === 'single' && single.status === 'idle') || (mode === 'batch' && batch.status === 'idle');
  const isActive = (mode === 'single' && single.status !== 'idle') || (mode === 'batch' && batch.status !== 'idle');

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      setValidationError(null);
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);

      // Validate all files
      const nonCsv = files.find((f) => !f.name.toLowerCase().endsWith('.csv'));
      if (nonCsv) {
        setValidationError(`"${nonCsv.name}" is not a CSV file. Only .csv files are supported.`);
        return;
      }
      const tooBig = files.find((f) => f.size > MAX_FILE_SIZE);
      if (tooBig) {
        setValidationError(`"${tooBig.name}" exceeds 500MB limit.`);
        return;
      }
      if (files.length > MAX_FILES) {
        setValidationError(`Maximum ${MAX_FILES} files per batch. You selected ${files.length}.`);
        return;
      }

      if (files.length === 1) {
        // Single file → use single upload (supports validation rules)
        setMode('single');
        const rules = validationRulesRef.current;
        const hasRules = (rules.requiredFields?.length ?? 0) > 0 ||
          Object.keys(rules.fieldTypes ?? {}).length > 0 ||
          Object.keys(rules.customPatterns ?? {}).length > 0;
        single.upload(files[0], hasRules ? { validationRules: rules } : undefined);
      } else {
        // Multiple files → batch upload
        setMode('batch');
        batch.upload(files);
      }
    },
    [single, batch]
  );

  const handleReset = () => {
    setValidationError(null);
    setMode('idle');
    single.reset();
    batch.reset();
  };

  // Determine combined status for display
  const showIdle = isIdle && !isActive;
  const showSingleProgress = mode === 'single' && (single.status === 'uploading' || single.status === 'confirming');
  const showSingleDone = mode === 'single' && single.status === 'done';
  const showSingleError = mode === 'single' && single.status === 'error';
  const showBatchProgress = mode === 'batch' && (batch.status === 'presigning' || batch.status === 'uploading' || batch.status === 'confirming');
  const showBatchDone = mode === 'batch' && batch.status === 'done';
  const showBatchError = mode === 'batch' && batch.status === 'error';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 animate-fade-in">
      <h3 className="mb-3 text-sm font-medium text-gray-700">Upload CSV Files</h3>

      {showIdle && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors duration-200 ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            role="button"
            tabIndex={0}
            aria-label="Drop zone for CSV file upload"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('csv-file-input')?.click();
              }
            }}
          >
            <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-gray-600">Drag & drop CSV files here, or</p>
            <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Browse Files
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                aria-label="Select CSV files to upload"
              />
            </label>
            <p className="mt-2 text-xs text-gray-400">CSV files up to 500MB each (max {MAX_FILES} files per batch)</p>
          </div>

          <div className="mt-5">
            <ValidationRulesForm onChange={(rules) => { validationRulesRef.current = rules; }} />
            <p className="mt-1 text-xs text-gray-400">Validation rules apply to single file uploads only</p>
          </div>

          {validationError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
              <span aria-hidden="true">&#x2717;</span>
              {validationError}
            </div>
          )}
        </>
      )}

      {/* Single file progress */}
      {showSingleProgress && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" aria-hidden="true" />
            <p className="text-sm text-gray-600">{single.status === 'uploading' ? 'Uploading to S3...' : 'Confirming upload...'}</p>
          </div>
          <ProgressBar progress={single.progress} />
          <p className="text-xs text-gray-400">{single.progress}%</p>
        </div>
      )}

      {showSingleDone && (
        <div className="space-y-3 animate-fade-in" role="status">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
            <span aria-hidden="true">&#x2713;</span>
            Upload complete! Job ID: <code className="font-mono text-xs">{single.jobId}</code>
          </div>
          <button onClick={handleReset} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-200">
            Upload More
          </button>
        </div>
      )}

      {showSingleError && (
        <div className="space-y-3 animate-fade-in" role="alert">
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <span aria-hidden="true">&#x2717;</span>
            {single.error || 'Upload failed.'}
          </div>
          <button onClick={handleReset} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-200">
            Try Again
          </button>
        </div>
      )}

      {/* Batch progress */}
      {showBatchProgress && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" aria-hidden="true" />
            <p className="text-sm text-gray-600">
              {batch.status === 'presigning' && 'Preparing uploads...'}
              {batch.status === 'uploading' && `Uploading ${batch.files.length} files...`}
              {batch.status === 'confirming' && 'Confirming batch...'}
            </p>
          </div>
          <div className="space-y-2">
            {batch.files.map((f, i) => (
              <FileProgressRow key={i} file={f} />
            ))}
          </div>
        </div>
      )}

      {showBatchDone && (
        <div className="space-y-3 animate-fade-in" role="status">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
            <span aria-hidden="true">&#x2713;</span>
            Batch upload complete! {batch.files.length} jobs created.
          </div>
          <div className="space-y-2">
            {batch.files.map((f, i) => (
              <FileProgressRow key={i} file={f} />
            ))}
          </div>
          <button onClick={handleReset} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-200">
            Upload More
          </button>
        </div>
      )}

      {showBatchError && (
        <div className="space-y-3 animate-fade-in" role="alert">
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <span aria-hidden="true">&#x2717;</span>
            {batch.error || 'Batch upload failed.'}
          </div>
          <div className="space-y-2">
            {batch.files.map((f, i) => (
              <FileProgressRow key={i} file={f} />
            ))}
          </div>
          <button onClick={handleReset} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-200">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
