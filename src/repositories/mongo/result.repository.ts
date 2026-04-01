import { ResultModel } from '../../models/Result';
import { IResultDocument } from '../../interfaces/IResult';
import { IResultRepository, CreateResultData } from '../interfaces/IResultRepository';

export class MongoResultRepository implements IResultRepository {
  async create(data: CreateResultData): Promise<IResultDocument> {
    return ResultModel.create(data);
  }

  async findByJobId(jobId: string): Promise<IResultDocument | null> {
    return ResultModel.findOne({ jobId });
  }
}
