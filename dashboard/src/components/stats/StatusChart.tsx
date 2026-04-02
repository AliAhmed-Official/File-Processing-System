import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { StatsData } from '../../types/job.types';

const STATUS_CONFIG = [
  { name: 'Pending', key: 'pending' as const, color: '#ca8a04', pattern: 'dots' },
  { name: 'Processing', key: 'processing' as const, color: '#2563eb', pattern: 'lines' },
  { name: 'Completed', key: 'completed' as const, color: '#16a34a', pattern: 'solid' },
  { name: 'Failed', key: 'failed' as const, color: '#dc2626', pattern: 'cross' },
];

export default function StatusChart({ stats }: { stats: StatsData }) {
  const data = STATUS_CONFIG
    .map((s) => ({ name: s.name, value: stats[s.key], color: s.color }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 animate-fade-in">
        <h3 className="mb-2 text-sm font-medium text-gray-700">Job Status Distribution</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <svg className="mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
          <p className="text-sm">No data yet</p>
        </div>
      </div>
    );
  }

  const summary = data.map((d) => `${d.name}: ${d.value}`).join(', ');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 animate-fade-in">
      <h3 className="mb-2 text-sm font-medium text-gray-700">Job Status Distribution</h3>
      <div role="img" aria-label={`Job status chart. ${summary}`}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Accessible text alternative */}
      <div className="sr-only">
        <table>
          <caption>Job status distribution</caption>
          <thead><tr><th>Status</th><th>Count</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.name}><td>{d.name}</td><td>{d.value}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
