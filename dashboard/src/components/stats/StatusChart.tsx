import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { StatsData } from '../../types/job.types';

const COLORS = ['#eab308', '#3b82f6', '#22c55e', '#ef4444'];

export default function StatusChart({ stats }: { stats: StatsData }) {
  const data = [
    { name: 'Pending', value: stats.pending },
    { name: 'Processing', value: stats.processing },
    { name: 'Completed', value: stats.completed },
    { name: 'Failed', value: stats.failed },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-medium text-gray-700">Job Status Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
