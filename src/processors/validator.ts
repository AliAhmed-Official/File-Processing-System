import { IValidationRules } from '../interfaces/IValidationRule';
import { FieldType } from '../types/enums';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export class RowValidator {
  private headers: string[] = [];
  private rules: IValidationRules | null = null;

  initialize(headers: string[], rules: IValidationRules | null): void {
    this.headers = headers;
    this.rules = rules;
  }

  validateRow(row: Record<string, string>): ValidationResult {
    const values = Object.values(row);

    if (values.length !== this.headers.length) {
      return { valid: false, reason: `Column count mismatch: expected ${this.headers.length}, got ${values.length}` };
    }

    if (values.every((v) => v.trim() === '')) {
      return { valid: false, reason: 'Empty row' };
    }

    if (!this.rules) {
      return { valid: true };
    }

    for (const field of this.rules.requiredFields) {
      if (!row[field] || row[field].trim() === '') {
        return { valid: false, reason: `Required field "${field}" is empty` };
      }
    }

    for (const [field, type] of Object.entries(this.rules.fieldTypes)) {
      const value = row[field];
      if (value === undefined || value.trim() === '') continue;

      if (!this.validateType(value, type)) {
        return { valid: false, reason: `Field "${field}" is not a valid ${type}` };
      }
    }

    for (const [field, pattern] of Object.entries(this.rules.customPatterns)) {
      const value = row[field];
      if (value === undefined || value.trim() === '') continue;

      try {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          return { valid: false, reason: `Field "${field}" does not match pattern "${pattern}"` };
        }
      } catch {
        return { valid: false, reason: `Invalid regex pattern for field "${field}"` };
      }
    }

    return { valid: true };
  }

  private validateType(value: string, type: FieldType): boolean {
    switch (type) {
      case FieldType.STRING:
        return true;
      case FieldType.NUMBER:
        return !isNaN(Number(value)) && value.trim() !== '';
      case FieldType.EMAIL:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case FieldType.DATE:
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  }
}
