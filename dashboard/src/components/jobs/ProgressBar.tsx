export default function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-gray-200">
      <div
        className="h-2 rounded-full bg-blue-600 transition-all duration-300"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}
