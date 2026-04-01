import { IJobDocument } from '../../interfaces/IJob';
import { JobStatus } from '../../types/enums';
import { IValidationRules } from '../../interfaces/IValidationRule';
import { PaginatedResult, PaginationQuery } from '../../types';
import { JobListFilters } from '../../dtos/job.dto';

export interface CreateJobData {
  fileId: string;
  priority: number;
  validationRules: IValidationRules | null;
  batchId: string | null;
  maxAttempts: number;
}

export interface IJobRepository {
  create(data: CreateJobData): Promise<IJobDocument>;
  createMany(data: CreateJobData[]): Promise<IJobDocument[]>;
  findById(id: string): Promise<IJobDocument | null>;
  updateStatus(id: string, status: JobStatus, error?: string | null): Promise<IJobDocument | null>;
  updateProgress(id: string, progress: number): Promise<IJobDocument | null>;
  incrementAttempts(id: string): Promise<IJobDocument | null>;
  setStartedAt(id: string): Promise<IJobDocument | null>;
  setCompletedAt(id: string): Promise<IJobDocument | null>;
  list(filters: JobListFilters, pagination: PaginationQuery): Promise<PaginatedResult<IJobDocument>>;
  countByStatus(): Promise<Record<JobStatus, number>>;
  countByBatchId(batchId: string): Promise<Record<JobStatus, number>>;
}
