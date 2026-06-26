export default function WarehouseDeleteModal({
  deleting,
  onClose,
  onDelete,
  warehouse,
}) {
  if (!warehouse) return null

  const hasQuantity = Number(warehouse.total_quantity || 0) > 0
  const hasTransactions = Number(warehouse.stock_transactions_count || 0) > 0
  const cannotDelete = hasQuantity || hasTransactions

  return (
    <div className="warehouse-modal-backdrop" role="presentation" onClick={() => !deleting && onClose()}>
      <section className="warehouse-modal delete" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="warehouse-modal-header">
          <div>
            <span className="warehouse-eyebrow">Xác nhận xóa</span>
            <h3>{warehouse.name}</h3>
          </div>
          <button type="button" aria-label="Đóng" disabled={deleting} onClick={onClose}>×</button>
        </div>

        {cannotDelete ? (
          <div className="warehouse-notice error">
            Không thể xóa kho này vì {hasQuantity
              ? `vẫn còn ${warehouse.total_quantity} sản phẩm tồn`
              : 'đã có phiếu kho'}.
            Hãy tắt trạng thái kho nếu không còn sử dụng.
          </div>
        ) : (
          <p className="warehouse-delete-text">Bạn muốn xóa kho này khỏi hệ thống?</p>
        )}

        <div className="warehouse-delete-actions">
          <button type="button" className="warehouse-btn secondary" disabled={deleting} onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="warehouse-btn danger"
            disabled={deleting || cannotDelete}
            onClick={onDelete}
          >
            {deleting ? 'Đang xóa...' : 'Xóa kho'}
          </button>
        </div>
      </section>
    </div>
  )
}
