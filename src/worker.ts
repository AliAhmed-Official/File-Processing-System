import { Worker, Job } from 'bullmq';
import { config } from './config';
import { connectDB } from './config/db';
import { createRedisConnection } from './config/redis';
import { createFileRepository, createJobRepository, createResultRepository } from './repositories';
import { StorageService } from './services/storage.service';
import { socketService } from './services/socket.service';
import { processCsv } from './processors/csv.processor';
import { createDuplicateDetector } from './processors/duplicateDetector';
import { JobStatus } from './types/enums';
import { logger } from './utils/logger';

const startWorker = async (): Promise<void> => {
  await connectDB();

  const redisConnection = createRedisConnection();
  const fileRepo = createFileRepository();
  const jobRepo = createJobRepository();
  const resultRepo = createResultRepository();
  const storageService = new StorageService();

  const worker = new Worker(
    'file-processing',
    async (bullJob: Job<{ jobId: string; fileId: string }>) => {
      const { jobId, fileId } = bullJob.data;

      logger.info('Processing job:', { jobId, fileId });

      await jobRepo.updateStatus(jobId, JobStatus.PROCESSING);
      await jobRepo.setStartedAt(jobId);
      await jobRepo.incrementAttempts(jobId);

      const file = await fileRepo.findById(fileId);
      if (!file) {
        throw new Error(`File not found: ${fileId}`);
      }

      const job = await jobRepo.findById(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const stream = await storageService.getObjectStream(file.s3Key);
      const duplicateDetector = createDuplicateDetector(file.size, config.DUPLICATE_HASH_THRESHOLD_BYTES);

      let validationRules = job.validationRules;
      if (validationRules) {
        validationRules = {
          requiredFields: validationRules.requiredFields,
          fieldTypes: validationRules.fieldTypes instanceof Map
            ? Object.fromEntries(validationRules.fieldTypes)
            : validationRules.fieldTypes,
          customPatterns: validationRules.customPatterns instanceof Map
            ? Object.fromEntries(validationRules.customPatterns)
            : validationRules.customPatterns,
        };
      }

      const report = await processCsv({
        stream,
        fileSize: file.size,
        validationRules,
        duplicateDetector,
      });

      const result = await resultRepo.create({
        jobId,
        fileId,
        totalRows: report.totalRows,
        validRows: report.validRows,
        invalidRows: report.invalidRows,
        duplicateRows: report.duplicateRows,
        duplicateStrategy: report.duplicateStrategy,
        errorDetails: report.errorDetails,
        summary: report.summary,
      });

      await jobRepo.updateStatus(jobId, JobStatus.COMPLETED);
      await jobRepo.setCompletedAt(jobId);

      socketService.emitJobCompleted(jobId, result._id.toString());

      if (job.batchId) {
        const counts = await jobRepo.countByBatchId(job.batchId);
        const total = Object.values(counts).reduce((s, c) => s + c, 0);
        socketService.emitBatchUpdate(job.batchId, counts[JobStatus.COMPLETED], total);
      }

      logger.info('Job completed:', { jobId, totalRows: report.totalRows });
    },
    {
      connection: redisConnection,
      concurrency: config.QUEUE_CONCURRENCY,
      lockDuration: 300000,
      limiter: {
        max: config.QUEUE_RATE_LIMIT_MAX,
        duration: config.QUEUE_RATE_LIMIT_DURATION,
      },
    }
  );

  worker.on('failed', async (bullJob, error) => {
    if (!bullJob) return;
    const { jobId } = bullJob.data;
    logger.error('Job failed:', { jobId, error: error.message, attempt: bullJob.attemptsMade });

    if (bullJob.attemptsMade >= config.QUEUE_MAX_RETRIES) {
      await jobRepo.updateStatus(jobId, JobStatus.FAILED, error.message);
      socketService.emitJobFailed(jobId, error.message, bullJob.attemptsMade);
    }
  });

  worker.on('error', (error) => {
    logger.error('Worker error:', error);
  });

  logger.info('Worker started with concurrency:', config.QUEUE_CONCURRENCY);
};

startWorker().catch((error) => {
  logger.error('Failed to start worker:', error);
  process.exit(1);
});