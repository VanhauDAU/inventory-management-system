import { useEffect, useMemo, useState } from 'react'
import useToast from '../../hooks/useToast'
import { authJson } from '../../services/authApi'
import { getProductPrice } from '../../utils/productDisplay'
import { hasPermission } from '../../utils/permissions'
import ProductDeleteModal from './components/ProductDeleteModal'
import ProductDetailModal from './components/ProductDetailModal'
import ProductFilters from './components/ProductFilters'
import ProductFormModal from './components/ProductFormModal'
import ProductTable from './components/ProductTable'
import useProductListData from './hooks/useProductListData'
import { createProductFormData, getProductApiErrorMessage } from './productListConfig'
import './ProductListPage.css'

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProductListPage({ onStatsChange, currentUser }) {
  const canAdd = hasPermission(currentUser, 'products.add_product')
  const canChange = hasPermission(currentUser, 'products.change_product')
  const canDelete = hasPermission(currentUser, 'products.delete_product')
  const {
    categories,
    error,
    filteredProducts,
    filters,
    loading,
    nextPage,
    page,
    previousPage,
    refreshProducts,
    resetFilters,
    setFilter,
    setPage,
    showNewestFirst,
    suppliers,
    totalCount,
    totalPages,
  } = useProductListData()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const { clearToast, showToast, toast } = useToast()

  // Expose stats lên App để dùng ở HomePage
  useEffect(() => {
    if (!onStatsChange) return
    const totalValue = filteredProducts.reduce((sum, p) => sum + Number(getProductPrice(p)) * Number(p.quantity || 0), 0)
    const lowStock = filteredProducts.filter((p) => Number(p.quantity || 0) > 0 && Number(p.quantity || 0) <= Number(p.minimum_stock ?? 5)).length
    onStatsChange({
      totalProducts: totalCount,
      totalQuantity: filteredProducts.reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      totalValue,
      lowStock,
    })
  }, [filteredProducts, totalCount, onStatsChange])

  async function handleCreateProduct(payload) {
    setCreating(true)
    setCreateError('')

    try {
      await authJson('/products/', {
        method: 'POST',
        body: createProductFormData(payload),
        errorResolver: getProductApiErrorMessage,
      })
      setShowAddModal(false)
      showNewestFirst()
      refreshProducts()
      showToast('success', 'Đã thêm sản phẩm thành công.')
    } catch (requestError) {
      const message = requestError.message || 'Không thể thêm sản phẩm. Vui lòng thử lại.'
      setCreateError(message)
      showToast('error', message)
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdateProduct(payload) {
    if (!editingProduct) return

    setUpdating(true)
    setEditError('')

    try {
      await authJson(`/products/${editingProduct.id}/`, {
        method: 'PATCH',
        body: createProductFormData(payload),
        errorResolver: getProductApiErrorMessage,
      })
      setEditingProduct(null)
      refreshProducts()
      showToast('success', 'Đã cập nhật sản phẩm thành công.')
    } catch (requestError) {
      const message = requestError.message || 'Không thể cập nhật sản phẩm. Vui lòng thử lại.'
      setEditError(message)
      showToast('error', message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleDeleteProduct() {
    if (!deleteTarget) return

    setDeleting(true)
    setDeleteError('')

    try {
      await authJson(`/products/${deleteTarget.id}/`, {
        method: 'DELETE',
        errorResolver: getProductApiErrorMessage,
      })
      setDeleteTarget(null)
      refreshProducts()
      showToast('success', 'Đã xóa sản phẩm thành công.')
    } catch (requestError) {
      const message =
        requestError.message ||
        'Không thể xóa sản phẩm. Nếu sản phẩm đã có phiếu kho hoặc dữ liệu liên quan, hãy đổi trạng thái thay vì xóa.'
      setDeleteError(message)
      showToast('error', message)
    } finally {
      setDeleting(false)
    }
  }

  function openCreateModal() {
    setCreateError('')
    setShowAddModal(true)
  }

  function openEditModal(product) {
    setEditError('')
    setEditingProduct(product)
  }

  function openDeleteModal(product) {
    setDeleteError('')
    setDeleteTarget(product)
  }

  return (
    <div className="product-list-page">
      {toast && (
        <div className={`plp-toast ${toast.type}`} role="status" aria-live="polite">
          <div className="plp-toast-icon" aria-hidden="true">
            {toast.type === 'success' ? '✓' : '!'}
          </div>
          <p>{toast.message}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={clearToast}>
            ×
          </button>
        </div>
      )}

      <ProductFilters
        categories={categories}
        filters={filters}
        onChange={setFilter}
        onReset={resetFilters}
        suppliers={suppliers}
      />

      {error && <div className="plp-notice error">{error}</div>}

      <ProductTable
        canAdd={canAdd}
        canChange={canChange}
        canDelete={canDelete}
        loading={loading}
        nextPage={nextPage}
        onAdd={openCreateModal}
        onDelete={openDeleteModal}
        onEdit={openEditModal}
        onPageChange={setPage}
        onSelect={setSelectedProduct}
        page={page}
        previousPage={previousPage}
        products={filteredProducts}
        totalCount={totalCount}
        totalPages={totalPages}
      />

      <ProductDetailModal
        canChange={canChange}
        onClose={() => setSelectedProduct(null)}
        onEdit={(product) => {
          openEditModal(product)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
      />

      {showAddModal && (
        <ProductFormModal
          error={createError}
          loading={creating}
          onCancel={() => setShowAddModal(false)}
          onSubmit={handleCreateProduct}
          title="Thêm sản phẩm"
        />
      )}

      {editingProduct && (
        <ProductFormModal
          error={editError}
          initialData={editingProduct}
          loading={updating}
          onCancel={() => setEditingProduct(null)}
          onSubmit={handleUpdateProduct}
          title="Sửa sản phẩm"
        />
      )}

      <ProductDeleteModal
        deleting={deleting}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProduct}
        product={deleteTarget}
      />
    </div>
  )
}
