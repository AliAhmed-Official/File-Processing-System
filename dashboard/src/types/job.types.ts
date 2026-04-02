export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface JobStatusData {
  jobId: string;
  status: JobStatus;
  progress: number;
  priority: number;
  attempts: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface JobListData {
  jobs: JobStatusData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JobListFilters {
  status?: JobStatus;
  batchId?: string;
  priority?: number;
  page?: number;
  limit?: number;
}

export interface StatsData {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  successRate: number;
}

export interface BatchStatusData {
  batchId: string;
  totalJobs: number;
  completed: number;
  failed: number;
  inProgress: number;
  pending: number;
}
