import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storage.service';
import { QueueService } from '../services/queue.service';
import { IJobRepository, CreateJobData } from '../repositories/interfaces/IJobRepository';
import { IFileRepository, CreateFileData } from '../repositories/interfaces/IFileRepository';
import { PresignRequestSchema, ConfirmUploadSchema, BatchPresignRequestSchema, BatchConfirmSchema } from '../validators/upload.validator';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

export class UploadController {
  constructor(
    private storageService: StorageService,
    private queueService: QueueService,
    private fileRepo: IFileRepository,
    private jobRepo: IJobRepository
  ) { }

  presign = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = PresignRequestSchema.parse(req.body);

    const { presignedUrl, s3Key } = await this.storageService.generatePresignedUrl(data.filename);

    res.status(200).json({
      success: true,
      data: {
        presignedUrl,
        s3Key,
        expiresIn: 900,
      },
    });
  });

  confirm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = ConfirmUploadSchema.parse(req.body);
    const presignData = PresignRequestSchema.partial().parse(req.body);

    await this.storageService.verifyObject(data.s3Key, data.fileSize);

    const jobId = uuidv4();
    const confirmedKey = await this.storageService.moveToConfirmed(data.s3Key, jobId, data.originalName);

    const file = await this.fileRepo.create({
      originalName: data.originalName,
      s3Key: confirmedKey,
      s3Bucket: config.S3_BUCKET,
      mimeType: 'text/csv',
      size: data.fileSize,
    });

    const job = await this.jobRepo.create({
      fileId: file._id.toString(),
      priority: presignData.priority ?? 5,
      validationRules: presignData.validationRules
        ? {
          requiredFields: presignData.validationRules.requiredFields ?? [],
          fieldTypes: presignData.validationRules.fieldTypes ?? {},
          customPatterns: presignData.validationRules.customPatterns ?? {},
        }
        : null,
      batchId: presignData.batchId ?? null,
      maxAttempts: config.QUEUE_MAX_RETRIES,
    });

    await this.queueService.addJob(job._id.toString(), file._id.toString(), job.priority);

    res.status(201).json({
      success: true,
      data: {
        jobId: job._id.toString(),
        fileId: file._id.toString(),
        status: job.status,
        message: 'File upload confirmed, processing job created',
      },
    });
  });

  batchPresign = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = BatchPresignRequestSchema.parse(req.body);
    const batchId = uuidv4();

    const files = await Promise.all(
      data.files.map(async (file) => {
        const { presignedUrl, s3Key } = await this.storageService.generatePresignedUrl(file.filename);
        return { presignedUrl, s3Key, expiresIn: 900 };
      })
    );

    res.status(200).json({
      success: true,
      data: { batchId, files },
    });
  });

  batchConfirm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = BatchConfirmSchema.parse(req.body);

    await Promise.all(
      data.files.map((file) => this.storageService.verifyObject(file.s3Key, file.fileSize))
    );

    const jobsData: { jobId: string; fileId: string; priority: number }[] = [];

    for (const fileData of data.files) {
      const jobId = uuidv4();
      const confirmedKey = await this.storageService.moveToConfirmed(
        fileData.s3Key,
        jobId,
        fileData.originalName
      );

      const file = await this.fileRepo.create({
        originalName: fileData.originalName,
        s3Key: confirmedKey,
        s3Bucket: config.S3_BUCKET,
        mimeType: 'text/csv',
        size: fileData.fileSize,
      });

      const job = await this.jobRepo.create({
        fileId: file._id.toString(),
        priority: 3,
        validationRules: null,
        batchId: data.batchId,
        maxAttempts: config.QUEUE_MAX_RETRIES,
      });

      jobsData.push({
        jobId: job._id.toString(),
        fileId: file._id.toString(),
        priority: job.priority,
      });
    }

    await this.queueService.addBatchJobs(jobsData);

    res.status(201).json({
      success: true,
      data: {
        batchId: data.batchId,
        jobs: jobsData.map((j) => ({ jobId: j.jobId, fileId: j.fileId })),
      },
    });
  });
}
