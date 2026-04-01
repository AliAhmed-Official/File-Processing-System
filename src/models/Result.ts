import mongoose, { Schema } from 'mongoose';
import { IResultDocument } from '../interfaces/IResult';
import { DuplicateStrategy } from '../types/enums';

const resultSchema = new Schema<IResultDocument>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true },
    totalRows: { type: Number, required: true },
    validRows: { type: Number, required: true },
    invalidRows: { type: Number, required: true },
    duplicateRows: { type: Number, required: true },
    duplicateStrategy: {
      type: String,
      enum: Object.values(DuplicateStrategy),
      required: true,
    },
    errorDetails: [
      {
        row: { type: Number, required: true },
        data: { type: String, required: true },
        reason: { type: String, required: true },
      },
    ],
    summary: {
      processingTimeMs: { type: Number, required: true },
      fileSizeBytes: { type: Number, required: true },
      memoryStrategy: { type: String, required: true },
      rowsPerSecond: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

resultSchema.index({ jobId: 1 }, { unique: true });

export const ResultModel = mongoose.model<IResultDocument>('Result', resultSchema);
