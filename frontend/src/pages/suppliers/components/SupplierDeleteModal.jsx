export default function SupplierDeleteModal({
  deleting,
  onClose,
  onDelete,
  supplier,
}) {
  if (!supplier) return null

  const productCount = Number(supplier.products_count || 0)
  const cannotDelete = productCount > 0

  return (
    <div className="supplier-modal-backdrop" role="presentation" onClick={() => !deleting && onClose()}>
      <section className="supplier-modal delete" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="supplier-modal-header">
          <div>
            <span className="supplier-eyebrow">Xác nhận xóa</span>
            <h3>{supplier.name}</h3>
          </div>
          <button type="button" aria-label="Đóng" disabled={deleting} onClick={onClose}>×</button>
        </div>

        {cannotDelete ? (
          <div className="supplier-notice error">
            Nhà phân phối này đang có {supplier.products_count} sản phẩm nên không thể xóa.
            Hãy chuyển các sản phẩm sang nhà phân phối khác hoặc tắt trạng thái nhà phân phối.
          </div>
        ) : (
          <p className="supplier-delete-text">Bạn muốn xóa nhà phân phối này khỏi hệ thống?</p>
        )}

        <div className="supplier-delete-actions">
          <button type="button" className="supplier-btn secondary" disabled={deleting} onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="supplier-btn danger"
            disabled={deleting || cannotDelete}
            onClick={onDelete}
          >
            {deleting ? 'Đang xóa...' : 'Xóa nhà phân phối'}
          </button>
        </div>
      </section>
    </div>
  )
}
