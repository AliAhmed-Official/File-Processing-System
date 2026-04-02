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
