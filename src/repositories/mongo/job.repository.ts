import { JobModel } from '../../models/Job';
import { IJobDocument } from '../../interfaces/IJob';
import { IJobRepository, CreateJobData } from '../interfaces/IJobRepository';
import { JobStatus } from '../../types/enums';
import { PaginatedResult, PaginationQuery } from '../../types';
import { JobListFilters } from '../../dtos/job.dto';

export class MongoJobRepository implements IJobRepository {
  async create(data: CreateJobData): Promise<IJobDocument> {
    return JobModel.create(data);
  }

  async createMany(data: CreateJobData[]): Promise<IJobDocument[]> {
    return JobModel.insertMany(data) as unknown as Promise<IJobDocument[]>;
  }

  async findById(id: string): Promise<IJobDocument | null> {
    return JobModel.findById(id);
  }

  async updateStatus(id: string, status: JobStatus, error: string | null = null): Promise<IJobDocument | null> {
    return JobModel.findByIdAndUpdate(id, { status, error }, { returnDocument: 'after' });
  }

  async updateProgress(id: string, progress: number): Promise<IJobDocument | null> {
    return JobModel.findByIdAndUpdate(id, { progress }, { returnDocument: 'after' });
  }

  async incrementAttempts(id: string): Promise<IJobDocument | null> {
    return JobModel.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { returnDocument: 'after' });
  }

  async setStartedAt(id: string): Promise<IJobDocument | null> {
    return JobModel.findByIdAndUpdate(id, { startedAt: new Date() }, { returnDocument: 'after' });
  }

  async setCompletedAt(id: string): Promise<IJobDocument | null> {
    return JobModel.findByIdAndUpdate(id, { completedAt: new Date() }, { returnDocument: 'after' });
  }

  async list(filters: JobListFilters, pagination: PaginationQuery): Promise<PaginatedResult<IJobDocument>> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.batchId) query.batchId = filters.batchId;
    if (filters.priority) query.priority = filters.priority;

    const skip = (pagination.page - 1) * pagination.limit;
    const [data, total] = await Promise.all([
      JobModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(pagination.limit),
      JobModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async countByStatus(): Promise<Record<JobStatus, number>> {
    const result = await JobModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = {
      [JobStatus.PENDING]: 0,
      [JobStatus.PROCESSING]: 0,
      [JobStatus.COMPLETED]: 0,
      [JobStatus.FAILED]: 0,
    };

    for (const item of result) {
      counts[item._id as JobStatus] = item.count;
    }

    return counts;
  }

  async countByBatchId(batchId: string): Promise<Record<JobStatus, number>> {
    const result = await JobModel.aggregate([
      { $match: { batchId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = {
      [JobStatus.PENDING]: 0,
      [JobStatus.PROCESSING]: 0,
      [JobStatus.COMPLETED]: 0,
      [JobStatus.FAILED]: 0,
    };

    for (const item of result) {
      counts[item._id as JobStatus] = item.count;
    }

    return counts;
  }
}
