import { Document } from 'mongoose';

export interface IFile {
  originalName: string;
  s3Key: string;
  s3Bucket: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFileDocument extends IFile, Document {}
