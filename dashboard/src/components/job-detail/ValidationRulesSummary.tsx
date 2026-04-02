import type { ValidationRules } from '../../types/upload.types';

export default function ValidationRulesSummary({ rules }: { rules: ValidationRules | null }) {
  const hasRequired = (rules?.requiredFields?.length ?? 0) > 0;
  const hasTypes = Object.keys(rules?.fieldTypes ?? {}).length > 0;
  const hasPatterns = Object.keys(rules?.customPatterns ?? {}).length > 0;
  const hasAny = hasRequired || hasTypes || hasPatterns;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 animate-fade-in">
      <h3 className="text-sm font-medium text-gray-700">Validation Rules</h3>

      {!hasAny && (
        <p className="text-sm text-gray-400">No validation rules configured</p>
      )}

      {hasRequired && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Required Fields</p>
          <div className="flex flex-wrap gap-1.5">
            {rules!.requiredFields!.map((field) => (
              <span key={field} className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasTypes && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Field Types</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(rules!.fieldTypes!).map(([field, type]) => (
              <span key={field} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                <span className="font-medium">{field}</span>
                <span className="text-gray-400">&rarr;</span>
                <span>{type}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {hasPatterns && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Custom Patterns</p>
          <div className="space-y-1">
            {Object.entries(rules!.customPatterns!).map(([field, pattern]) => (
              <div key={field} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-gray-700">{field}</span>
                <span className="text-gray-400">&rarr;</span>
                <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">{pattern}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
