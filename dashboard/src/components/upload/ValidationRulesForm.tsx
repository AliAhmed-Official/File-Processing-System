import { useState } from 'react';
import RequiredFieldsEditor from './RequiredFieldsEditor';
import FieldTypesEditor from './FieldTypesEditor';
import CustomPatternsEditor from './CustomPatternsEditor';
import type { ValidationRules } from '../../types/upload.types';

interface ValidationRulesFormProps {
  onChange: (rules: ValidationRules) => void;
}

export default function ValidationRulesForm({ onChange }: ValidationRulesFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [fieldTypes, setFieldTypes] = useState<Record<string, string>>({});
  const [customPatterns, setCustomPatterns] = useState<Record<string, string>>({});

  const emit = (
    rf: string[] = requiredFields,
    ft: Record<string, string> = fieldTypes,
    cp: Record<string, string> = customPatterns
  ) => {
    onChange({
      requiredFields: rf.length > 0 ? rf : undefined,
      fieldTypes: Object.keys(ft).length > 0 ? ft as ValidationRules['fieldTypes'] : undefined,
      customPatterns: Object.keys(cp).length > 0 ? cp : undefined,
    });
  };

  const handleRequiredFields = (fields: string[]) => {
    setRequiredFields(fields);
    emit(fields, fieldTypes, customPatterns);
  };

  const handleFieldTypes = (types: Record<string, string>) => {
    setFieldTypes(types);
    emit(requiredFields, types, customPatterns);
  };

  const handleCustomPatterns = (patterns: Record<string, string>) => {
    setCustomPatterns(patterns);
    emit(requiredFields, fieldTypes, patterns);
  };

  const ruleCount = requiredFields.length + Object.keys(fieldTypes).length + Object.keys(customPatterns).length;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        aria-expanded={expanded}
        aria-controls="validation-rules-panel"
      >
        <span className="flex items-center gap-2">
          Validation Rules
          {ruleCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {ruleCount}
            </span>
          )}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div id="validation-rules-panel" className="space-y-4 border-t border-gray-200 px-4 py-4 animate-fade-in">
          <RequiredFieldsEditor fields={requiredFields} onChange={handleRequiredFields} />
          <hr className="border-gray-200" />
          <FieldTypesEditor fieldTypes={fieldTypes} onChange={handleFieldTypes} />
          <hr className="border-gray-200" />
          <CustomPatternsEditor patterns={customPatterns} onChange={handleCustomPatterns} />
        </div>
      )}
    </div>
  );
}
