export interface PresignResponse {
  presignedUrl: string;
  s3Key: string;
  expiresIn: number;
}

export interface UploadResponse {
  jobId: string;
  fileId: string;
  status: string;
  message: string;
}

export interface ValidationRules {
  requiredFields?: string[];
  fieldTypes?: Record<string, 'string' | 'number' | 'email' | 'date'>;
  customPatterns?: Record<string, string>;
}

export interface BatchPresignResponse {
  batchId: string;
  files: PresignResponse[];
}

export interface BatchConfirmResponse {
  batchId: string;
  jobs: { jobId: string; fileId: string }[];
}

export type BatchFileStatus = 'pending' | 'uploading' | 'uploaded' | 'done' | 'error';

export interface BatchFileState {
  file: File;
  status: BatchFileStatus;
  progress: number;
  jobId: string | null;
  error: string | null;
  s3Key: string | null;
}

export type ConcurrentUploadStatus = 'uploading' | 'confirming' | 'done' | 'error';

export interface ConcurrentUploadEntry {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: ConcurrentUploadStatus;
  error: string | null;
  jobId: string | null;
}
