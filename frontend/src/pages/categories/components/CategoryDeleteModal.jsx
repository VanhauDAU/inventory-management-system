export default function CategoryDeleteModal({
  category,
  deleting,
  onClose,
  onDelete,
}) {
  if (!category) return null

  const productCount = Number(category.products_count || 0)
  const cannotDelete = productCount > 0

  return (
    <div className="category-modal-backdrop" role="presentation" onClick={() => !deleting && onClose()}>
      <section className="category-modal delete" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="category-modal-header">
          <div>
            <span className="category-eyebrow">Xác nhận xóa</span>
            <h3>{category.name}</h3>
          </div>
          <button type="button" aria-label="Đóng" disabled={deleting} onClick={onClose}>×</button>
        </div>

        {cannotDelete ? (
          <div className="category-notice error">
            Danh mục này đang có {category.products_count} sản phẩm nên không thể xóa.
            Hãy chuyển các sản phẩm sang danh mục khác hoặc tắt trạng thái danh mục.
          </div>
        ) : (
          <p className="category-delete-text">
            Bạn muốn xóa danh mục này? Nếu danh mục có danh mục con, các danh mục con sẽ được chuyển về không có danh mục cha.
          </p>
        )}

        <div className="category-delete-actions">
          <button type="button" className="category-btn secondary" disabled={deleting} onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="category-btn danger"
            disabled={deleting || cannotDelete}
            onClick={onDelete}
          >
            {deleting ? 'Đang xóa...' : 'Xóa danh mục'}
          </button>
        </div>
      </section>
    </div>
  )
}
