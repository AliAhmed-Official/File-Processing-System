import { Document, Types } from 'mongoose';
import { DuplicateStrategy } from '../types/enums';
import { ErrorDetail, ProcessingSummary } from '../types';

export interface IResult {
  jobId: Types.ObjectId;
  fileId: Types.ObjectId;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  duplicateStrategy: DuplicateStrategy;
  errorDetails: ErrorDetail[];
  summary: ProcessingSummary;
  createdAt: Date;
}

export interface IResultDocument extends IResult, Document {}
