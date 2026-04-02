import type { StatsData } from '../../types/job.types';

export default function StatsCards({ stats }: { stats: StatsData }) {
  const cards = [
    { label: 'Total Jobs', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
    { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-white' },
    { label: 'Processing', value: stats.processing, color: 'text-blue-600', bg: 'bg-white' },
    { label: 'Failed', value: stats.failed, color: 'text-red-600', bg: 'bg-white' },
    { label: 'Success Rate', value: `${stats.successRate}%`, color: 'text-indigo-600', bg: 'bg-white' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5 stagger-children">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-lg border border-gray-200 ${card.bg} p-4 transition-shadow hover:shadow-sm`}>
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className={`text-2xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
