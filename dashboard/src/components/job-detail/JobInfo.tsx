import type { JobStatusData } from '../../types/job.types';
import StatusBadge from '../common/StatusBadge';
import ProgressBar from '../jobs/ProgressBar';

export default function JobInfo({ job, progress }: { job: JobStatusData; progress: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Job {job.jobId.substring(0, 8)}...</h2>
        <StatusBadge status={job.status} />
      </div>
      {job.status === 'processing' && (
        <div>
          <ProgressBar progress={progress} />
          <p className="mt-1 text-xs text-gray-500">{progress}% complete</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-gray-500">Priority:</span> {job.priority}</div>
        <div><span className="text-gray-500">Attempts:</span> {job.attempts}</div>
        <div><span className="text-gray-500">Created:</span> {new Date(job.createdAt).toLocaleString()}</div>
        {job.startedAt && <div><span className="text-gray-500">Started:</span> {new Date(job.startedAt).toLocaleString()}</div>}
        {job.completedAt && <div><span className="text-gray-500">Completed:</span> {new Date(job.completedAt).toLocaleString()}</div>}
      </div>
      {job.error && <p className="text-sm text-red-600">Error: {job.error}</p>}
    </div>
  );
}
