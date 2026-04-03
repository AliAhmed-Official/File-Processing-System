import type { JobStatusData } from '../../types/job.types';
import StatusBadge from '../common/StatusBadge';

export default function JobInfo({ job }: { job: JobStatusData }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Job <code className="font-mono text-base">{job.jobId.substring(0, 8)}...</code>
        </h2>
        <StatusBadge status={job.status} />
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div><span className="text-gray-500">Priority:</span> {job.priority}</div>
        <div><span className="text-gray-500">Attempts:</span> <span className="tabular-nums">{job.attempts}</span></div>
        <div><span className="text-gray-500">Created:</span> {new Date(job.createdAt).toLocaleString()}</div>
        {job.startedAt && <div><span className="text-gray-500">Started:</span> {new Date(job.startedAt).toLocaleString()}</div>}
        {job.completedAt && <div><span className="text-gray-500">Completed:</span> {new Date(job.completedAt).toLocaleString()}</div>}
      </div>
      {job.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
          <span className="font-medium">Error:</span> {job.error}
        </div>
      )}
    </div>
  );
}
