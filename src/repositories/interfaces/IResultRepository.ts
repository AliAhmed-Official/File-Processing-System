import { IResultDocument } from '../../interfaces/IResult';
import { DuplicateStrategy } from '../../types/enums';
import { ErrorDetail, ProcessingSummary } from '../../types';

export interface CreateResultData {
  jobId: string;
  fileId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  duplicateStrategy: DuplicateStrategy;
  errorDetails: ErrorDetail[];
  summary: ProcessingSummary;
}

export interface IResultRepository {
  create(data: CreateResultData): Promise<IResultDocument>;
  findByJobId(jobId: string): Promise<IResultDocument | null>;
}
