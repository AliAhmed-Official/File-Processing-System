import { MongoResultRepository } from '../../../repositories/mongo/result.repository';
import { MongoFileRepository } from '../../../repositories/mongo/file.repository';
import { MongoJobRepository } from '../../../repositories/mongo/job.repository';
import { DuplicateStrategy } from '../../../types/enums';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/dbSetup';

describe('MongoResultRepository', () => {
  let resultRepo: MongoResultRepository;
  let fileRepo: MongoFileRepository;
  let jobRepo: MongoJobRepository;
  let testJobId: string;
  let testFileId: string;

  beforeAll(async () => {
    await connectTestDB();
    resultRepo = new MongoResultRepository();
    fileRepo = new MongoFileRepository();
    jobRepo = new MongoJobRepository();
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

    const job = await jobRepo.create({
      fileId: testFileId,
      priority: 5,
      validationRules: null,
      batchId: null,
      maxAttempts: 3,
    });
    testJobId = job._id.toString();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('should create and find result by job ID', async () => {
    const result = await resultRepo.create({
      jobId: testJobId,
      fileId: testFileId,
      totalRows: 100,
      validRows: 80,
      invalidRows: 10,
      duplicateRows: 10,
      duplicateStrategy: DuplicateStrategy.HASH,
      errorDetails: [{ row: 5, data: '{"name":""}', reason: 'Empty row' }],
      summary: {
        processingTimeMs: 500,
        fileSizeBytes: 1024,
        memoryStrategy: 'hash-set',
        rowsPerSecond: 200,
      },
    });

    expect(result.totalRows).toBe(100);

    const found = await resultRepo.findByJobId(testJobId);
    expect(found).not.toBeNull();
    expect(found!.validRows).toBe(80);
    expect(found!.duplicateStrategy).toBe('hash');
  });
});
