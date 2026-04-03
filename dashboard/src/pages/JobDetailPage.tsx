import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import JobInfo from '../components/job-detail/JobInfo';
import ValidationRulesSummary from '../components/job-detail/ValidationRulesSummary';
import ResultSummary from '../components/job-detail/ResultSummary';
import ErrorTable from '../components/job-detail/ErrorTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useJobDetail } from '../hooks/useJobDetail';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { job, result, isLoading, error } = useJobDetail(id!);

  return (
    <div className="flex min-h-dvh">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main id="main-content" className="flex-1 overflow-auto bg-gray-100 p-4 md:p-6 space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-blue-600 transition-colors hover:bg-blue-50 hover:underline"
            aria-label="Back to Dashboard"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </Link>

          {isLoading && <LoadingSpinner label="Loading job details" />}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              <p className="font-medium">Failed to load job</p>
              <p className="mt-1 text-red-600">Check your connection and try refreshing the page.</p>
            </div>
          )}

          {job && (
            <div className="space-y-4 animate-fade-in">
              <JobInfo job={job} />
              <ValidationRulesSummary rules={job.validationRules} />
              {result && (
                <>
                  <ResultSummary result={result} />
                  <ErrorTable errors={result.errorDetails} />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
