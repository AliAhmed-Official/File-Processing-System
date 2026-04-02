import type { StatsData } from '../../types/job.types';

export default function StatsCards({ stats }: { stats: StatsData }) {
  const cards = [
    { label: 'Total Jobs', value: stats.total, color: 'text-gray-900' },
    { label: 'Completed', value: stats.completed, color: 'text-green-600' },
    { label: 'Processing', value: stats.processing, color: 'text-blue-600' },
    { label: 'Failed', value: stats.failed, color: 'text-red-600' },
    { label: 'Success Rate', value: `${stats.successRate}%`, color: 'text-indigo-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
