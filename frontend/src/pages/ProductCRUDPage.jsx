import { useState } from 'react'
import Modal from '../components/Modal'
import ProductForm from '../components/ProductForm'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { createProduct, updateProduct, deleteProduct } from '../services/productService'
import '../styles/ProductCRUDPage.css'

function ProductCRUDPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)   // product đang sửa
  const [deleteTarget, setDeleteTarget] = useState(null) // product đang xóa
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', message }

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  // Thêm sản phẩm
  const handleAdd = async (data) => {
    setSubmitLoading(true)
    try {
      await createProduct(data)
      setShowAddModal(false)
      showToast('success', 'Thêm sản phẩm thành công!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Thêm sản phẩm thất bại.'
      showToast('error', msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  // Sửa sản phẩm
  const handleEdit = async (data) => {
    setSubmitLoading(true)
    try {
      await updateProduct(editProduct.id, data)
      setEditProduct(null)
      showToast('success', 'Cập nhật sản phẩm thành công!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cập nhật thất bại.'
      showToast('error', msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  // Xóa sản phẩm
  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      showToast('success', `Đã xóa "${deleteTarget.name}" thành công!`)
    } catch (err) {
      showToast('error', 'Xóa sản phẩm thất bại.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="crud-page">
      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Quản lý sản phẩm</h1>
          <p className="crud-subtitle">Thêm, sửa và xóa sản phẩm</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Thêm sản phẩm
        </button>
      </div>

      {/* Bảng sản phẩm placeholder - sẽ được bạn Nguyên tích hợp */}
      <div className="table-placeholder">
        <p>📋 Bảng danh sách sản phẩm sẽ được tích hợp từ nhánh <code>feature/frontend-ui</code></p>
        <p>Demo nút sửa/xóa:</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={() =>
              setEditProduct({
                id: 1,
                name: 'Sản phẩm demo',
                description: 'Mô tả demo',
                price: 50000,
                quantity: 10,
                category: '',
              })
            }
          >
            ✏️ Sửa demo
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setDeleteTarget({ id: 1, name: 'Sản phẩm demo' })}
          >
            🗑️ Xóa demo
          </button>
        </div>
      </div>

      {/* Modal thêm sản phẩm */}
      {showAddModal && (
        <Modal title="Thêm sản phẩm mới" onClose={() => setShowAddModal(false)}>
          <ProductForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddModal(false)}
            loading={submitLoading}
          />
        </Modal>
      )}

      {/* Modal sửa sản phẩm */}
      {editProduct && (
        <Modal title="Chỉnh sửa sản phẩm" onClose={() => setEditProduct(null)}>
          <ProductForm
            initialData={editProduct}
            onSubmit={handleEdit}
            onCancel={() => setEditProduct(null)}
            loading={submitLoading}
          />
        </Modal>
      )}

      {/* Modal xác nhận xóa */}
      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}

export default ProductCRUDPage
