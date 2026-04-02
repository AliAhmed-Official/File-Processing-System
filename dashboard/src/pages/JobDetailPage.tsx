import { useParams, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import JobInfo from '../components/job-detail/JobInfo';
import ResultSummary from '../components/job-detail/ResultSummary';
import ErrorTable from '../components/job-detail/ErrorTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useJobDetail } from '../hooks/useJobDetail';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { job, result, progress, isLoading, error } = useJobDetail(id!);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-100 p-6 space-y-4">
          <Link to="/" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>

          {isLoading && <LoadingSpinner />}
          {error && <p className="text-red-600">Failed to load job</p>}

          {job && (
            <>
              <JobInfo job={job} progress={progress} />
              {result && (
                <>
                  <ResultSummary result={result} />
                  <ErrorTable errors={result.errorDetails} />
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
