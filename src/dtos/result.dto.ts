import { DuplicateStrategy } from '../types/enums';
import { ErrorDetail, ProcessingSummary } from '../types';

export interface JobResultDTO {
  jobId: string;
  fileId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  duplicateStrategy: DuplicateStrategy;
  errorDetails: ErrorDetail[];
  summary: ProcessingSummary;
  createdAt: Date;
}
