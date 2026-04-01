import { FieldType } from '../types/enums';

export interface ValidationRulesDTO {
  requiredFields?: string[];
  fieldTypes?: Record<string, FieldType>;
  customPatterns?: Record<string, string>;
}
