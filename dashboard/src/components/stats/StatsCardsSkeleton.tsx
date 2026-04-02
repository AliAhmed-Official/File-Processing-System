export default function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5" aria-label="Loading statistics" role="status">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-8 w-16" />
        </div>
      ))}
      <span className="sr-only">Loading statistics...</span>
    </div>
  );
}
