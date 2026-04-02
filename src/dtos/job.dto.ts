import { JobStatus } from '../types/enums';

export interface JobStatusDTO {
  jobId: string;
  status: JobStatus;
  progress: number;
  priority: number;
  attempts: number;
  error: string | null;
  validationRules: {
    requiredFields: string[];
    fieldTypes: Record<string, string>;
    customPatterns: Record<string, string>;
  } | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface JobListDTO {
  jobs: JobStatusDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JobListFilters {
  status?: JobStatus;
  batchId?: string;
  priority?: number;
}

export interface BatchStatusDTO {
  batchId: string;
  totalJobs: number;
  completed: number;
  failed: number;
  inProgress: number;
  pending: number;
}
