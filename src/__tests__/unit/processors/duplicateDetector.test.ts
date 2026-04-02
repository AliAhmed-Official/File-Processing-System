import {
  HashDuplicateDetector,
  BloomDuplicateDetector,
  createDuplicateDetector,
} from '../../../processors/duplicateDetector';

describe('DuplicateDetector', () => {
  describe('HashDuplicateDetector', () => {
    it('should detect exact duplicate rows', () => {
      const detector = new HashDuplicateDetector();
      const row = { name: 'Alice', email: 'alice@test.com', age: '30' };

      expect(detector.isDuplicate(row)).toBe(false);
      detector.add(row);
      expect(detector.isDuplicate(row)).toBe(true);
    });

    it('should not flag different rows as duplicates', () => {
      const detector = new HashDuplicateDetector();
      const row1 = { name: 'Alice', email: 'alice@test.com', age: '30' };
      const row2 = { name: 'Bob', email: 'bob@test.com', age: '25' };

      detector.add(row1);
      expect(detector.isDuplicate(row2)).toBe(false);
    });

    it('should return hash strategy', () => {
      const detector = new HashDuplicateDetector();
      expect(detector.getStrategy()).toBe('hash');
    });
  });

  describe('BloomDuplicateDetector', () => {
    it('should detect duplicate rows', () => {
      const detector = new BloomDuplicateDetector(1000, 0.01);
      const row = { name: 'Alice', email: 'alice@test.com', age: '30' };

      expect(detector.isDuplicate(row)).toBe(false);
      detector.add(row);
      expect(detector.isDuplicate(row)).toBe(true);
    });

    it('should return bloom strategy', () => {
      const detector = new BloomDuplicateDetector();
      expect(detector.getStrategy()).toBe('bloom');
    });
  });

  describe('createDuplicateDetector', () => {
    it('should use hash for small files', () => {
      const detector = createDuplicateDetector(10 * 1024 * 1024, 50 * 1024 * 1024);
      expect(detector.getStrategy()).toBe('hash');
    });

    it('should use bloom for large files', () => {
      const detector = createDuplicateDetector(100 * 1024 * 1024, 50 * 1024 * 1024);
      expect(detector.getStrategy()).toBe('bloom');
    });
  });
});
