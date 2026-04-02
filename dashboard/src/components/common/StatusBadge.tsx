import type { JobStatus } from '../../types/job.types';

const statusConfig: Record<JobStatus, { bg: string; icon: string; label: string }> = {
  pending: { bg: 'bg-yellow-100 text-yellow-800', icon: '\u25CB', label: 'Pending' },
  processing: { bg: 'bg-blue-100 text-blue-800', icon: '\u25D4', label: 'Processing' },
  completed: { bg: 'bg-green-100 text-green-800', icon: '\u2713', label: 'Completed' },
  failed: { bg: 'bg-red-100 text-red-800', icon: '\u2717', label: 'Failed' },
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
