export default function ProductDeleteModal({ deleting, error, onCancel, onConfirm, product }) {
  if (!product) return null

  return (
    <div className="plp-modal-backdrop" role="presentation" onClick={() => !deleting && onCancel()}>
      <section className="plp-modal plp-delete-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="plp-modal-header">
          <div>
            <span className="plp-modal-eyebrow">Xác nhận xóa</span>
            <h2>{product.name}</h2>
          </div>
          <button className="plp-modal-close" type="button" aria-label="Đóng" disabled={deleting} onClick={onCancel}>×</button>
        </div>

        {error && <div className="plp-notice error">{error}</div>}

        <p className="plp-delete-text">
          Bạn muốn xóa sản phẩm này khỏi hệ thống? Nếu sản phẩm đã xuất hiện
          trong phiếu nhập, phiếu xuất hoặc dữ liệu nghiệp vụ khác, hệ thống
          sẽ không cho xóa để giữ lịch sử chính xác.
        </p>

        <div className="plp-delete-actions">
          <button type="button" className="plp-delete-cancel" disabled={deleting} onClick={onCancel}>Hủy</button>
          <button type="button" className="plp-delete-confirm" disabled={deleting} onClick={onConfirm}>
            {deleting ? 'Đang xóa...' : 'Xóa sản phẩm'}
          </button>
        </div>
      </section>
    </div>
  )
}
