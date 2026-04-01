import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

export class QueueService {
  private queue: Queue;

  constructor(connection: IORedis) {
    this.queue = new Queue('file-processing', { connection });
  }

  async addJob(jobId: string, fileId: string, priority: number): Promise<void> {
    await this.queue.add(
      'process-csv',
      { jobId, fileId },
      {
        jobId,
        priority,
        attempts: config.QUEUE_MAX_RETRIES,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      }
    );
    logger.info('Job added to queue:', { jobId, priority });
  }

  async addBatchJobs(jobs: { jobId: string; fileId: string; priority: number }[]): Promise<void> {
    const bulkJobs = jobs.map((job) => ({
      name: 'process-csv',
      data: { jobId: job.jobId, fileId: job.fileId },
      opts: {
        jobId: job.jobId,
        priority: job.priority,
        attempts: config.QUEUE_MAX_RETRIES,
        backoff: { type: 'exponential' as const, delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    }));

    await this.queue.addBulk(bulkJobs);
    logger.info('Batch jobs added to queue:', { count: jobs.length });
  }

  getQueue(): Queue {
    return this.queue;
  }
}
