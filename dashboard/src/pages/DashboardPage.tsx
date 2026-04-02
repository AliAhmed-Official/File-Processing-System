import { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import StatsCards from '../components/stats/StatsCards';
import StatusChart from '../components/stats/StatusChart';
import JobTable from '../components/jobs/JobTable';
import JobFilters from '../components/jobs/JobFilters';
import UploadZone from '../components/upload/UploadZone';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useStats } from '../hooks/useStats';
import { useJobs } from '../hooks/useJobs';
import type { JobListFilters } from '../types/job.types';

export default function DashboardPage() {
  const [filters, setFilters] = useState<JobListFilters>({ page: 1, limit: 20 });
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: jobList, isLoading: jobsLoading } = useJobs(filters);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-100 p-6 space-y-6">
          <UploadZone />

          {statsLoading ? <LoadingSpinner /> : stats && (
            <div className="space-y-4">
              <StatsCards stats={stats} />
              <StatusChart stats={stats} />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
              <JobFilters filters={filters} onFilterChange={setFilters} />
            </div>

            {jobsLoading ? <LoadingSpinner /> : !jobList || jobList.jobs.length === 0 ? (
              <EmptyState message="No jobs yet. Upload a CSV file to get started." />
            ) : (
              <>
                <JobTable jobs={jobList.jobs} />
                <Pagination
                  page={jobList.page}
                  totalPages={jobList.totalPages}
                  onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
