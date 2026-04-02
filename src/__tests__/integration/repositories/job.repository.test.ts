import mongoose from 'mongoose';
import { MongoJobRepository } from '../../../repositories/mongo/job.repository';
import { MongoFileRepository } from '../../../repositories/mongo/file.repository';
import { JobStatus } from '../../../types/enums';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/dbSetup';

describe('MongoJobRepository', () => {
  let jobRepo: MongoJobRepository;
  let fileRepo: MongoFileRepository;
  let testFileId: string;

  beforeAll(async () => {
    await connectTestDB();
    jobRepo = new MongoJobRepository();
    fileRepo = new MongoFileRepository();
  });

  beforeEach(async () => {
    await clearTestDB();
    const file = await fileRepo.create({
      originalName: 'test.csv',
      s3Key: 'uploads/confirmed/abc/test.csv',
      s3Bucket: 'file-uploads',
      mimeType: 'text/csv',
      size: 1024,
    });
    testFileId = file._id.toString();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('should create, find, and update job status', async () => {
    const job = await jobRepo.create({
      fileId: testFileId,
      priority: 5,
      validationRules: null,
      batchId: null,
      maxAttempts: 3,
    });

    expect(job.status).toBe(JobStatus.PENDING);

    const updated = await jobRepo.updateStatus(job._id.toString(), JobStatus.PROCESSING);
    expect(updated!.status).toBe(JobStatus.PROCESSING);

    const found = await jobRepo.findById(job._id.toString());
    expect(found!.status).toBe(JobStatus.PROCESSING);
  });
});
