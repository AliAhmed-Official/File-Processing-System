import { createHash } from 'crypto';
import { BloomFilter } from 'bloom-filters';

export interface IDuplicateDetector {
  add(row: Record<string, string>): void;
  isDuplicate(row: Record<string, string>): boolean;
  getStrategy(): 'hash' | 'bloom';
}

export class HashDuplicateDetector implements IDuplicateDetector {
  private seen = new Set<string>();

  private hashRow(row: Record<string, string>): string {
    const values = Object.values(row).join('|');
    return createHash('sha256').update(values).digest('hex');
  }

  add(row: Record<string, string>): void {
    this.seen.add(this.hashRow(row));
  }

  isDuplicate(row: Record<string, string>): boolean {
    return this.seen.has(this.hashRow(row));
  }

  getStrategy(): 'hash' {
    return 'hash';
  }
}

export class BloomDuplicateDetector implements IDuplicateDetector {
  private filter: BloomFilter;

  constructor(expectedItems: number = 2000000, falsePositiveRate: number = 0.01) {
    this.filter = BloomFilter.create(expectedItems, falsePositiveRate);
  }

  private hashRow(row: Record<string, string>): string {
    const values = Object.values(row).join('|');
    return createHash('sha256').update(values).digest('hex');
  }

  add(row: Record<string, string>): void {
    this.filter.add(this.hashRow(row));
  }

  isDuplicate(row: Record<string, string>): boolean {
    return this.filter.has(this.hashRow(row));
  }

  getStrategy(): 'bloom' {
    return 'bloom';
  }
}

export const createDuplicateDetector = (fileSize: number, thresholdBytes: number): IDuplicateDetector => {
  if (fileSize < thresholdBytes) {
    return new HashDuplicateDetector();
  }
  return new BloomDuplicateDetector();
};
