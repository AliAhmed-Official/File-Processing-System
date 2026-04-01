import { ValidationRulesDTO } from './validation.dto';

export interface PresignRequestDTO {
  filename: string;
  fileSize: number;
  mimeType: string;
  priority?: number;
  validationRules?: ValidationRulesDTO;
  batchId?: string;
}

export interface PresignResponseDTO {
  presignedUrl: string;
  s3Key: string;
  expiresIn: number;
}

export interface ConfirmUploadDTO {
  s3Key: string;
  originalName: string;
  fileSize: number;
}

export interface UploadResponseDTO {
  jobId: string;
  fileId: string;
  status: string;
  message: string;
}

export interface BatchPresignRequestDTO {
  files: PresignRequestDTO[];
}

export interface BatchPresignResponseDTO {
  batchId: string;
  files: PresignResponseDTO[];
}

export interface BatchConfirmDTO {
  batchId: string;
  files: ConfirmUploadDTO[];
}

export interface BatchConfirmResponseDTO {
  batchId: string;
  jobs: { jobId: string; fileId: string }[];
}
