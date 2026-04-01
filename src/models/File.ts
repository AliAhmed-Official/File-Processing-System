import mongoose, { Schema } from 'mongoose';
import { IFileDocument } from '../interfaces/IFile';

const fileSchema = new Schema<IFileDocument>(
  {
    originalName: { type: String, required: true },
    s3Key: { type: String, required: true },
    s3Bucket: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

fileSchema.index({ s3Key: 1 }, { unique: true });

export const FileModel = mongoose.model<IFileDocument>('File', fileSchema);
