import { MongoFileRepository } from '../../../repositories/mongo/file.repository';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/dbSetup';

describe('MongoFileRepository', () => {
  let repo: MongoFileRepository;

  beforeAll(async () => {
    await connectTestDB();
    repo = new MongoFileRepository();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('should create and find a file by ID', async () => {
    const file = await repo.create({
      originalName: 'test.csv',
      s3Key: 'uploads/confirmed/abc/test.csv',
      s3Bucket: 'file-uploads',
      mimeType: 'text/csv',
      size: 1024,
    });

    expect(file._id).toBeDefined();
    expect(file.originalName).toBe('test.csv');

    const found = await repo.findById(file._id.toString());
    expect(found).not.toBeNull();
    expect(found!.s3Key).toBe('uploads/confirmed/abc/test.csv');
  });
});
