interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 py-3" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Go to previous page"
      >
        Previous
      </button>
      <span className="text-sm text-gray-700" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Go to next page"
      >
        Next
      </button>
    </nav>
  );
}
