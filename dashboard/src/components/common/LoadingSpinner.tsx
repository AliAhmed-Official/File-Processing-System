export default function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-label={label}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
