import type { JobStatus, JobListFilters } from '../../types/job.types';

interface JobFiltersProps {
  filters: JobListFilters;
  onFilterChange: (filters: JobListFilters) => void;
}

const statuses: (JobStatus | '')[] = ['', 'pending', 'processing', 'completed', 'failed'];

export default function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
  return (
    <div className="flex gap-3">
      <select
        value={filters.status || ''}
        onChange={(e) =>
          onFilterChange({ ...filters, status: (e.target.value || undefined) as JobStatus | undefined, page: 1 })
        }
        className="rounded border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="">All Statuses</option>
        {statuses.filter(Boolean).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
