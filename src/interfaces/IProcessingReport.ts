import { DuplicateStrategy } from '../types/enums';
import { ErrorDetail, ProcessingSummary } from '../types';

export interface IProcessingReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  duplicateStrategy: DuplicateStrategy;
  errorDetails: ErrorDetail[];
  summary: ProcessingSummary;
}
