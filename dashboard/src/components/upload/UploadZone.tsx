import { useCallback, useState } from 'react';
import { useUpload } from '../../hooks/useUpload';
import ProgressBar from '../jobs/ProgressBar';

export default function UploadZone() {
  const { progress, status, error, jobId, upload, reset } = useUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.name.endsWith('.csv')) {
        alert('Only CSV files are supported');
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        alert('File must be under 500MB');
        return;
      }
      upload(file);
    },
    [upload]
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">Upload CSV File</h3>

      {status === 'idle' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <p className="text-sm text-gray-600">Drag & drop a CSV file here, or</p>
          <label className="mt-2 cursor-pointer rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Browse Files
            <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        </div>
      )}

      {(status === 'uploading' || status === 'confirming') && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{status === 'uploading' ? 'Uploading to S3...' : 'Confirming...'}</p>
          <ProgressBar progress={progress} />
          <p className="text-xs text-gray-400">{progress}%</p>
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-2">
          <p className="text-sm text-green-600">Upload complete! Job ID: {jobId}</p>
          <button onClick={reset} className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">
            Upload Another
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={reset} className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
