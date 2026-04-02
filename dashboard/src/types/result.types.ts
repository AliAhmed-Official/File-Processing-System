export interface ErrorDetail {
  row: number;
  data: string;
  reason: string;
}

export interface ProcessingSummary {
  processingTimeMs: number;
  fileSizeBytes: number;
  memoryStrategy: string;
  rowsPerSecond: number;
}

export interface JobResultData {
  jobId: string;
  fileId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  duplicateStrategy: 'hash' | 'bloom';
  errorDetails: ErrorDetail[];
  summary: ProcessingSummary;
  createdAt: string;
}
