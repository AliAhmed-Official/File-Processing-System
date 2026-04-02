import type { JobResultData } from '../../types/result.types';

export default function ResultSummary({ result }: { result: JobResultData }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 animate-fade-in">
      <h3 className="text-sm font-medium text-gray-700">Processing Results</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 stagger-children">
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-gray-900">{result.totalRows}</p>
          <p className="text-xs text-gray-500">Total Rows</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-green-700">{result.validRows}</p>
          <p className="text-xs text-gray-500">Valid</p>
        </div>
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-red-700">{result.invalidRows}</p>
          <p className="text-xs text-gray-500">Invalid</p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-yellow-700">{result.duplicateRows}</p>
          <p className="text-xs text-gray-500">Duplicates</p>
        </div>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p>Strategy: {result.duplicateStrategy} ({result.summary.memoryStrategy})</p>
        <p>Processing time: <span className="tabular-nums">{result.summary.processingTimeMs}ms</span></p>
        <p>Throughput: <span className="tabular-nums">{result.summary.rowsPerSecond}</span> rows/sec</p>
      </div>
    </div>
  );
}
