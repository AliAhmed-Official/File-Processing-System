import { FieldType } from '../types/enums';

export interface IValidationRules {
  requiredFields: string[];
  fieldTypes: Record<string, FieldType>;
  customPatterns: Record<string, string>;
}
