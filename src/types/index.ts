export * from './enums';

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
