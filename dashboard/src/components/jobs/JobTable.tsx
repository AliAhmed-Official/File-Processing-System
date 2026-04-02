import { Link } from 'react-router-dom';
import type { JobStatusData } from '../../types/job.types';
import StatusBadge from '../common/StatusBadge';
import ProgressBar from './ProgressBar';

export default function JobTable({ jobs }: { jobs: JobStatusData[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.jobId} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link to={`/job/${job.jobId}`} className="text-sm text-blue-600 hover:underline">
                  {job.jobId.substring(0, 8)}...
                </Link>
              </td>
              <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
              <td className="px-4 py-3 w-40"><ProgressBar progress={job.progress} /></td>
              <td className="px-4 py-3 text-sm text-gray-700">{job.priority}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{new Date(job.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
