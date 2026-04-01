import { IFileRepository } from './interfaces/IFileRepository';
import { IJobRepository } from './interfaces/IJobRepository';
import { IResultRepository } from './interfaces/IResultRepository';
import { MongoFileRepository } from './mongo/file.repository';
import { MongoJobRepository } from './mongo/job.repository';
import { MongoResultRepository } from './mongo/result.repository';

export const createFileRepository = (): IFileRepository => new MongoFileRepository();
export const createJobRepository = (): IJobRepository => new MongoJobRepository();
export const createResultRepository = (): IResultRepository => new MongoResultRepository();

export * from './interfaces/IFileRepository';
export * from './interfaces/IJobRepository';
export * from './interfaces/IResultRepository';
