import type { JobStatus, JobListFilters } from '../../types/job.types';

interface JobFiltersProps {
  filters: JobListFilters;
  onFilterChange: (filters: JobListFilters) => void;
}

const statuses: { value: JobStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export default function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
  return (
    <div className="flex gap-3">
      <label className="sr-only" htmlFor="status-filter">Filter by status</label>
      <select
        id="status-filter"
        value={filters.status || ''}
        onChange={(e) =>
          onFilterChange({ ...filters, status: (e.target.value || undefined) as JobStatus | undefined, page: 1 })
        }
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:border-gray-400"
      >
        <option value="">All Statuses</option>
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
