import { z } from 'zod';
import { FieldType } from '../types/enums';

const ValidationRulesSchema = z.object({
  requiredFields: z.array(z.string()).optional().default([]),
  fieldTypes: z.record(z.string(), z.nativeEnum(FieldType)).optional().default({}),
  customPatterns: z.record(z.string(), z.string()).optional().default({}),
});

export const PresignRequestSchema = z.object({
  filename: z.string().min(1).max(255).regex(/\.csv$/i, 'File must be a CSV'),
  fileSize: z.number().positive().max(500 * 1024 * 1024, 'File size must be under 500MB'),
  mimeType: z.literal('text/csv'),
  priority: z.number().min(1).max(10).optional().default(5),
  validationRules: ValidationRulesSchema.optional(),
  batchId: z.string().uuid().optional(),
});

export const ConfirmUploadSchema = z.object({
  s3Key: z.string().min(1),
  originalName: z.string().min(1).max(255),
  fileSize: z.number().positive(),
});

export const BatchPresignRequestSchema = z.object({
  files: z.array(PresignRequestSchema).min(1).max(20),
});

export const BatchConfirmSchema = z.object({
  batchId: z.string().uuid(),
  files: z.array(ConfirmUploadSchema).min(1).max(20),
  validationRules: ValidationRulesSchema.optional(),
});
