import { z } from 'zod';
import { JobStatus } from '../types/enums';

export const JobIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid job ID'),
});

export const JobListQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.nativeEnum(JobStatus).optional(),
  batchId: z.string().uuid().optional(),
  priority: z.coerce.number().min(1).max(10).optional(),
});

