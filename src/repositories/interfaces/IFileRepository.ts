import { IFileDocument } from '../../interfaces/IFile';

export interface CreateFileData {
  originalName: string;
  s3Key: string;
  s3Bucket: string;
  mimeType: string;
  size: number;
}

export interface IFileRepository {
  create(data: CreateFileData): Promise<IFileDocument>;
  findById(id: string): Promise<IFileDocument | null>;
  findByS3Key(s3Key: string): Promise<IFileDocument | null>;
  delete(id: string): Promise<void>;
}
