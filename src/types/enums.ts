export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum DuplicateStrategy {
  HASH = 'hash',
  BLOOM = 'bloom',
}

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  EMAIL = 'email',
  DATE = 'date',
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  S3_ERROR = 'S3_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
