import { Link } from 'react-router-dom';
import type { JobStatusData } from '../../types/job.types';
import StatusBadge from '../common/StatusBadge';
import ProgressBar from './ProgressBar';

export default function JobTable({ jobs }: { jobs: JobStatusData[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white animate-fade-in">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.jobId} className="transition-colors hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    to={`/job/${job.jobId}`}
                    className="rounded px-1 py-0.5 text-sm font-mono text-blue-600 hover:underline"
                  >
                    {job.jobId.substring(0, 8)}...
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={job.status} /></td>
                <td className="px-4 py-3 w-40"><ProgressBar progress={job.progress} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{job.priority}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{new Date(job.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
