import type { ErrorDetail } from '../../types/result.types';

export default function ErrorTable({ errors }: { errors: ErrorDetail[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 animate-fade-in">
      <h3 className="mb-3 text-sm font-medium text-gray-700">
        Error Samples <span className="text-gray-400">({errors.length})</span>
      </h3>
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Row</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {errors.map((err, i) => (
              <tr key={i} className="transition-colors hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-gray-700">{err.row}</td>
                <td className="px-3 py-2 text-red-600">{err.reason}</td>
                <td className="px-3 py-2 text-gray-500 truncate max-w-xs" title={err.data}>{err.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
