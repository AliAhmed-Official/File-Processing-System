import { RowValidator } from '../../../processors/validator';
import { FieldType } from '../../../types/enums';

describe('RowValidator', () => {
  let validator: RowValidator;

  beforeEach(() => {
    validator = new RowValidator();
  });

  describe('structural validation', () => {
    it('should reject row with wrong column count', () => {
      validator.initialize(['name', 'email', 'age'], null);

      const result = validator.validateRow({ name: 'Alice', email: 'alice@test.com' });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Column count mismatch');
    });

    it('should accept valid row with correct column count', () => {
      validator.initialize(['name', 'email', 'age'], null);

      const result = validator.validateRow({ name: 'Alice', email: 'alice@test.com', age: '30' });
      expect(result.valid).toBe(true);
    });

    it('should reject completely empty row', () => {
      validator.initialize(['name', 'email', 'age'], null);

      const result = validator.validateRow({ name: '', email: '', age: '' });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Empty row');
    });
  });

  describe('configurable validation', () => {
    it('should reject type mismatch for number field', () => {
      validator.initialize(['name', 'age'], {
        requiredFields: [],
        fieldTypes: { age: FieldType.NUMBER },
        customPatterns: {},
      });

      const result = validator.validateRow({ name: 'Alice', age: 'notanumber' });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not a valid number');
    });

    it('should validate email field type', () => {
      validator.initialize(['name', 'email'], {
        requiredFields: [],
        fieldTypes: { email: FieldType.EMAIL },
        customPatterns: {},
      });

      const invalid = validator.validateRow({ name: 'Alice', email: 'notanemail' });
      expect(invalid.valid).toBe(false);

      const valid = validator.validateRow({ name: 'Alice', email: 'alice@test.com' });
      expect(valid.valid).toBe(true);
    });

    it('should enforce required fields', () => {
      validator.initialize(['name', 'email'], {
        requiredFields: ['name'],
        fieldTypes: {},
        customPatterns: {},
      });

      const result = validator.validateRow({ name: '', email: 'alice@test.com' });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Required field');
    });
  });

  describe('custom regex patterns', () => {
    it('should validate against custom patterns', () => {
      validator.initialize(['code'], {
        requiredFields: [],
        fieldTypes: {},
        customPatterns: { code: '^[A-Z]{3}-\\d{4}$' },
      });

      const valid = validator.validateRow({ code: 'ABC-1234' });
      expect(valid.valid).toBe(true);

      const invalid = validator.validateRow({ code: 'abc-1234' });
      expect(invalid.valid).toBe(false);
    });
  });
});
