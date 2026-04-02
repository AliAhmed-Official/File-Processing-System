import { Readable } from 'stream';
import { processCsv } from '../../../processors/csv.processor';
import { HashDuplicateDetector } from '../../../processors/duplicateDetector';

const createStream = (content: string): Readable => {
  return Readable.from([content]);
};

describe('CsvProcessor', () => {
  it('should parse valid CSV with correct row counts', async () => {
    const csv = 'name,email,age\nAlice,alice@test.com,30\nBob,bob@test.com,25\nCharlie,charlie@test.com,35\n';

    const report = await processCsv({
      stream: createStream(csv),
      fileSize: Buffer.byteLength(csv),
      validationRules: null,
      duplicateDetector: new HashDuplicateDetector(),
      onProgress: () => {},
    });

    expect(report.totalRows).toBe(3);
    expect(report.validRows).toBe(3);
    expect(report.invalidRows).toBe(0);
    expect(report.duplicateRows).toBe(0);
  });

  it('should count duplicate rows', async () => {
    const csv = 'name,email\nAlice,alice@test.com\nBob,bob@test.com\nAlice,alice@test.com\n';

    const report = await processCsv({
      stream: createStream(csv),
      fileSize: Buffer.byteLength(csv),
      validationRules: null,
      duplicateDetector: new HashDuplicateDetector(),
      onProgress: () => {},
    });

    expect(report.totalRows).toBe(3);
    expect(report.validRows).toBe(2);
    expect(report.duplicateRows).toBe(1);
  });

  it('should handle empty CSV (headers only)', async () => {
    const csv = 'name,email,age\n';

    const report = await processCsv({
      stream: createStream(csv),
      fileSize: Buffer.byteLength(csv),
      validationRules: null,
      duplicateDetector: new HashDuplicateDetector(),
      onProgress: () => {},
    });

    expect(report.totalRows).toBe(0);
    expect(report.validRows).toBe(0);
    expect(report.invalidRows).toBe(0);
  });

  it('should report processing summary', async () => {
    const csv = 'name,email\nAlice,alice@test.com\n';

    const report = await processCsv({
      stream: createStream(csv),
      fileSize: Buffer.byteLength(csv),
      validationRules: null,
      duplicateDetector: new HashDuplicateDetector(),
      onProgress: () => {},
    });

    expect(report.summary.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(report.summary.fileSizeBytes).toBe(Buffer.byteLength(csv));
    expect(report.summary.memoryStrategy).toBe('hash-set');
    expect(report.duplicateStrategy).toBe('hash');
  });
});
