import { FileModel } from '../../models/File';
import { IFileDocument } from '../../interfaces/IFile';
import { IFileRepository, CreateFileData } from '../interfaces/IFileRepository';

export class MongoFileRepository implements IFileRepository {
  async create(data: CreateFileData): Promise<IFileDocument> {
    return FileModel.create(data);
  }

  async findById(id: string): Promise<IFileDocument | null> {
    return FileModel.findById(id);
  }

  async findByS3Key(s3Key: string): Promise<IFileDocument | null> {
    return FileModel.findOne({ s3Key });
  }

  async delete(id: string): Promise<void> {
    await FileModel.findByIdAndDelete(id);
  }
}
