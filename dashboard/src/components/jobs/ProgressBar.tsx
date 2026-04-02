export default function ProgressBar({ progress }: { progress: number }) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  return (
    <div
      className="h-2 w-full rounded-full bg-gray-200"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped}% complete`}
    >
      <div
        className="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
