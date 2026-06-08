import '../styles/Modal.css'

function DeleteConfirmModal({ product, onConfirm, onCancel, loading = false }) {
  if (!product) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon modal-icon-danger">🗑️</div>
        <h2 className="modal-title">Xác nhận xóa</h2>
        <p className="modal-desc">
          Bạn có chắc muốn xóa sản phẩm{' '}
          <strong>&ldquo;{product.name}&rdquo;</strong> không?
          <br />
          <span className="modal-warn">Hành động này không thể hoàn tác.</span>
        </p>
        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onCancel} disabled={loading}>
            Hủy
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner spinner-white" /> : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal
