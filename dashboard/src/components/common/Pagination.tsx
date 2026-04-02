interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded bg-gray-100 px-3 py-1 text-sm disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-700">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded bg-gray-100 px-3 py-1 text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
