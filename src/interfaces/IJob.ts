import { Document, Types } from 'mongoose';
import { JobStatus } from '../types/enums';
import { IValidationRules } from './IValidationRule';

export interface IJob {
  fileId: Types.ObjectId;
  status: JobStatus;
  priority: number;
  progress: number;
  attempts: number;
  maxAttempts: number;
  validationRules: IValidationRules | null;
  batchId: string | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobDocument extends IJob, Document {}
