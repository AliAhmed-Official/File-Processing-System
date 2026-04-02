import { IJobRepository } from '../repositories/interfaces/IJobRepository';
import { IFileRepository } from '../repositories/interfaces/IFileRepository';
import { IResultRepository } from '../repositories/interfaces/IResultRepository';
import { ICacheService } from '../interfaces/ICacheService';
import { JobStatus } from '../types/enums';
import { JobStatusDTO, JobListDTO, JobListFilters, BatchStatusDTO } from '../dtos/job.dto';
import { JobResultDTO } from '../dtos/result.dto';
import { PaginationQuery } from '../types';
import { ApiError } from '../utils/ApiError';
import { IJobDocument } from '../interfaces/IJob';

export class JobService {
  constructor(
    private jobRepo: IJobRepository,
    private fileRepo: IFileRepository,
    private resultRepo: IResultRepository,
    private cache: ICacheService
  ) { }

  private toJobStatusDTO(job: IJobDocument): JobStatusDTO {
    return {
      jobId: job._id.toString(),
      status: job.status,
      progress: job.progress,
      priority: job.priority,
      attempts: job.attempts,
      error: job.error,
      validationRules: job.validationRules,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  }

  async getJobStatus(id: string): Promise<JobStatusDTO> {
    const job = await this.jobRepo.findById(id);
    if (!job) throw ApiError.notFound('Job not found');
    return this.toJobStatusDTO(job);
  }

  async getJobResult(id: string): Promise<JobResultDTO> {
    const result = await this.resultRepo.findByJobId(id);
    if (!result) throw ApiError.notFound('Result not found');

    return {
      jobId: result.jobId.toString(),
      fileId: result.fileId.toString(),
      totalRows: result.totalRows,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      duplicateRows: result.duplicateRows,
      duplicateStrategy: result.duplicateStrategy,
      errorDetails: result.errorDetails,
      summary: result.summary,
      createdAt: result.createdAt,
    };
  }

  async listJobs(filters: JobListFilters, pagination: PaginationQuery): Promise<JobListDTO> {
    const result = await this.jobRepo.list(filters, pagination);

    return {
      jobs: result.data.map((job) => this.toJobStatusDTO(job)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getStats(): Promise<Record<string, unknown>> {
    const cached = await this.cache.get<Record<string, unknown>>('stats:dashboard');
    if (cached) return cached;

    const counts = await this.jobRepo.countByStatus();
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    const successRate = total > 0 ? (counts[JobStatus.COMPLETED] / total) * 100 : 0;

    const stats = {
      total,
      ...counts,
      successRate: Math.round(successRate * 100) / 100,
    };

    await this.cache.set('stats:dashboard', stats, 10);

    return stats;
  }

  async getBatchStatus(batchId: string): Promise<BatchStatusDTO> {
    const counts = await this.jobRepo.countByBatchId(batchId);
    const totalJobs = Object.values(counts).reduce((sum, c) => sum + c, 0);

    if (totalJobs === 0) throw ApiError.notFound('Batch not found');

    return {
      batchId,
      totalJobs,
      completed: counts[JobStatus.COMPLETED],
      failed: counts[JobStatus.FAILED],
      inProgress: counts[JobStatus.PROCESSING],
      pending: counts[JobStatus.PENDING],
    };
  }

  async invalidateJobCache(): Promise<void> {
    await this.cache.delete('stats:dashboard');
  }
}
