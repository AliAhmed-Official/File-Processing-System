import type { ErrorDetail } from '../../types/result.types';

export default function ErrorTable({ errors }: { errors: ErrorDetail[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">Error Samples ({errors.length})</h3>
      <div className="overflow-auto max-h-64">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Row</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {errors.map((err, i) => (
              <tr key={i}>
                <td className="px-3 py-2 text-gray-700">{err.row}</td>
                <td className="px-3 py-2 text-red-600">{err.reason}</td>
                <td className="px-3 py-2 text-gray-500 truncate max-w-xs">{err.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
