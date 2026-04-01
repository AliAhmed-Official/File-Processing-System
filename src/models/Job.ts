import mongoose, { Schema } from 'mongoose';
import { IJobDocument } from '../interfaces/IJob';
import { JobStatus } from '../types/enums';

const jobSchema = new Schema<IJobDocument>(
  {
    fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
    },
    priority: { type: Number, default: 5, min: 1, max: 10 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    validationRules: {
      type: {
        requiredFields: [String],
        fieldTypes: { type: Map, of: String },
        customPatterns: { type: Map, of: String },
      },
      default: null,
    },
    batchId: { type: String, default: null },
    error: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ batchId: 1 });
jobSchema.index({ status: 1, priority: -1 });

export const JobModel = mongoose.model<IJobDocument>('Job', jobSchema);
