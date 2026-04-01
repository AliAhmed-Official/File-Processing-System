import { Request, Response } from 'express';
import { JobService } from '../services/job.service';
import { JobIdParamSchema, JobListQuerySchema, BatchIdParamSchema } from '../validators/job.validator';
import { asyncHandler } from '../utils/asyncHandler';

export class JobController {
  constructor(private jobService: JobService) {}

  getJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = JobIdParamSchema.parse(req.params);
    const job = await this.jobService.getJobStatus(id);

    res.json({ success: true, data: job });
  });

  getJobResult = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = JobIdParamSchema.parse(req.params);
    const result = await this.jobService.getJobResult(id);

    res.json({ success: true, data: result });
  });

  listJobs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = JobListQuerySchema.parse(req.query);
    const { page, limit, ...filters } = query;
    const jobs = await this.jobService.listJobs(filters, { page, limit });

    res.json({ success: true, data: jobs });
  });

  getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.jobService.getStats();

    res.json({ success: true, data: stats });
  });

  getBatchStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { batchId } = BatchIdParamSchema.parse(req.params);
    const status = await this.jobService.getBatchStatus(batchId);

    res.json({ success: true, data: status });
  });
}
