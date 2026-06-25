import './PaginationControls.css'

export default function PaginationControls({
  itemLabel = 'bản ghi',
  loading = false,
  onPageChange,
  page,
  pageSize = 10,
  totalCount,
}) {
  const totalPages = Math.max(1, Math.ceil(Number(totalCount || 0) / pageSize))
  const safePage = Math.min(Math.max(1, Number(page || 1)), totalPages)
  const start = totalCount > 0 ? (safePage - 1) * pageSize + 1 : 0
  const end = Math.min(safePage * pageSize, Number(totalCount || 0))

  return (
    <div className="pagination-controls">
      <span>
        {start}-{end} / {totalCount} {itemLabel}
      </span>
      <div className="pagination-actions">
        <button
          type="button"
          disabled={loading || safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
        >
          Trước
        </button>
        <strong>Trang {safePage} / {totalPages}</strong>
        <button
          type="button"
          disabled={loading || safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
        >
          Sau
        </button>
      </div>
    </div>
  )
}
