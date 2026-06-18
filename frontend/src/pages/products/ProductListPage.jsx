import { useEffect, useMemo, useState } from 'react'
import useToast from '../../hooks/useToast'
import { authFetch, authJson } from '../../services/authApi'
import { getProductPrice } from '../../utils/productDisplay'
import { hasPermission } from '../../utils/permissions'
import ProductDeleteModal from './components/ProductDeleteModal'
import ProductDetailModal from './components/ProductDetailModal'
import ProductFilters from './components/ProductFilters'
import ProductFormModal from './components/ProductFormModal'
import ProductTable from './components/ProductTable'
import { createProductFormData, getProductApiErrorMessage } from './productListConfig'
import './ProductListPage.css'

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProductListPage({ onStatsChange, currentUser }) {
  const canAdd = hasPermission(currentUser, 'products.add_product')
  const canChange = hasPermission(currentUser, 'products.change_product')
  const canDelete = hasPermission(currentUser, 'products.delete_product')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minQuantity, setMinQuantity] = useState('')
  const [maxQuantity, setMaxQuantity] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
  const [refreshKey, setRefreshKey] = useState(0)
  const { clearToast, showToast, toast } = useToast()

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProducts() {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({ page: String(page), ordering })
      if (search.trim()) params.set('search', search.trim())
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (selectedSupplier !== 'all') params.set('supplier', selectedSupplier)
      if (selectedStatus !== 'all') params.set('status', selectedStatus)
      if (minPrice !== '') params.set('min_price', minPrice)
      if (maxPrice !== '') params.set('max_price', maxPrice)
      if (minQuantity !== '') params.set('min_quantity', minQuantity)
      if (maxQuantity !== '') params.set('max_quantity', maxQuantity)
      if (stockFilter === 'low-stock') params.set('low_stock', 'true')
      if (stockFilter === 'out-of-stock') params.set('max_quantity', '0')
      if (stockFilter === 'in-stock' && minQuantity === '') params.set('min_quantity', '1')

      try {
        const [productRes, categoryRes, supplierRes] = await Promise.all([
          authFetch(`/products/?${params}`, { signal: controller.signal }),
          authFetch('/categories/', { signal: controller.signal }),
          authFetch('/suppliers/', { signal: controller.signal }),
        ])

        if (!productRes.ok) throw new Error(`Không thể tải sản phẩm. Mã lỗi: ${productRes.status}`)

        const productData = await productRes.json()
        const categoryData = categoryRes.ok ? await categoryRes.json() : []
        const supplierData = supplierRes.ok ? await supplierRes.json() : []
        const apiProducts = Array.isArray(productData.results) ? productData.results : productData
        const apiCategories = Array.isArray(categoryData.results) ? categoryData.results : categoryData
        const apiSuppliers = Array.isArray(supplierData.results) ? supplierData.results : supplierData

        setProducts(apiProducts)
        setCategories(apiCategories)
        setSuppliers(apiSuppliers)
        setTotalCount(productData.count ?? apiProducts.length)
        setNextPage(productData.next || null)
        setPreviousPage(productData.previous || null)
      } catch (err) {
        if (err.name === 'AbortError') return
        setProducts([])
        setCategories([])
        setSuppliers([])
        setTotalCount(0)
        setNextPage(null)
        setPreviousPage(null)
        setError(err.message || 'Không thể tải danh sách sản phẩm từ API.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    return () => controller.abort()
  }, [
    page,
    ordering,
    search,
    selectedCategory,
    selectedSupplier,
    selectedStatus,
    stockFilter,
    minPrice,
    maxPrice,
    minQuantity,
    maxQuantity,
    refreshKey,
  ])

  const filteredProducts = useMemo(() => {
    return [...products]
  }, [products])

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

  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  function resetFilters() {
    setSearch('')
    setSelectedCategory('all')
    setSelectedSupplier('all')
    setSelectedStatus('all')
    setStockFilter('all')
    setMinPrice('')
    setMaxPrice('')
    setMinQuantity('')
    setMaxQuantity('')
    setOrdering('-created_at')
    setPage(1)
  }

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
      setPage(1)
      setOrdering('-created_at')
      setRefreshKey((value) => value + 1)
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
      setRefreshKey((value) => value + 1)
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
      setRefreshKey((value) => value + 1)
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

  const filters = {
    maxPrice,
    maxQuantity,
    minPrice,
    minQuantity,
    ordering,
    search,
    selectedCategory,
    selectedStatus,
    selectedSupplier,
    stockFilter,
  }

  const filterSetters = {
    maxPrice: setMaxPrice,
    maxQuantity: setMaxQuantity,
    minPrice: setMinPrice,
    minQuantity: setMinQuantity,
    ordering: setOrdering,
    search: setSearch,
    selectedCategory: setSelectedCategory,
    selectedStatus: setSelectedStatus,
    selectedSupplier: setSelectedSupplier,
    stockFilter: setStockFilter,
  }

  function handleFilterChange(key, value) {
    filterSetters[key]?.(value)
    setPage(1)
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
        onChange={handleFilterChange}
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
