import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { RowValidator } from './validator';
import { IDuplicateDetector } from './duplicateDetector';
import { IValidationRules } from '../interfaces/IValidationRule';
import { IProcessingReport } from '../interfaces/IProcessingReport';
import { DuplicateStrategy } from '../types/enums';
import { ErrorDetail } from '../types';

const MAX_ERROR_SAMPLES = 100;

export interface CsvProcessorOptions {
  stream: Readable;
  fileSize: number;
  validationRules: IValidationRules | null;
  duplicateDetector: IDuplicateDetector;
}

export const processCsv = (options: CsvProcessorOptions): Promise<IProcessingReport> => {
  const { stream, fileSize, validationRules, duplicateDetector } = options;

  return new Promise((resolve, reject) => {
    const validator = new RowValidator();
    let headersInitialized = false;

    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let duplicateRows = 0;
    const errorDetails: ErrorDetail[] = [];
    const startTime = Date.now();

    const csvStream = stream.pipe(csvParser());

    csvStream.on('headers', (headers: string[]) => {
      validator.initialize(headers, validationRules);
      headersInitialized = true;
    });

    csvStream.on('data', (row: Record<string, string>) => {
      if (!headersInitialized) return;

      totalRows++;

      const validation = validator.validateRow(row);
      if (!validation.valid) {
        invalidRows++;
        if (errorDetails.length < MAX_ERROR_SAMPLES) {
          errorDetails.push({
            row: totalRows,
            data: JSON.stringify(row).substring(0, 500),
            reason: validation.reason || 'Unknown validation error',
          });
        }
        return;
      }

      if (duplicateDetector.isDuplicate(row)) {
        duplicateRows++;
        return;
      }

      duplicateDetector.add(row);
      validRows++;
    });

    csvStream.on('end', () => {
      const processingTimeMs = Date.now() - startTime;
      const rowsPerSecond = processingTimeMs > 0 ? Math.round((totalRows / processingTimeMs) * 1000) : 0;

      resolve({
        totalRows,
        validRows,
        invalidRows,
        duplicateRows,
        duplicateStrategy: duplicateDetector.getStrategy() as DuplicateStrategy,
        errorDetails,
        summary: {
          processingTimeMs,
          fileSizeBytes: fileSize,
          memoryStrategy: duplicateDetector.getStrategy() === 'hash' ? 'hash-set' : 'bloom-filter',
          rowsPerSecond,
        },
      });
    });

    csvStream.on('error', (error: Error) => {
      reject(error);
    });

    stream.on('error', (error: Error) => {
      reject(error);
    });
  });
};
