import { useEffect, useMemo, useState } from 'react'
import ProductForm from '../../components/ProductForm'
import { hasPermission } from '../../utils/permissions'
import './ProductListPage.css'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// ── Helpers ────────────────────────────────────────────────────────────────────
const orderingOptions = [
  { value: '-created_at', label: 'Mới nhất' },
  { value: 'name', label: 'Tên A-Z' },
  { value: 'price', label: 'Giá tăng dần' },
  { value: '-price', label: 'Giá giảm dần' },
  { value: '-quantity', label: 'Tổng tồn cao' },
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0))

const formatDateTime = (value) => {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

const getProductPrice = (product) => product.price ?? product.selling_price ?? 0

const getCategoryName = (product) =>
  product.category_detail?.name || product.category_name || `Danh mục #${product.category || 'N/A'}`

const getSupplierName = (product) =>
  product.supplier_detail?.name || product.supplier_name || (product.supplier ? `NCC #${product.supplier}` : 'Chưa gán')

const productImageMap = {
  1: '/product-images/laptop.svg',
  2: '/product-images/keyboard.svg',
  3: '/product-images/mouse.svg',
  4: '/product-images/ssd.svg',
  5: '/product-images/notebook.svg',
  6: '/product-images/hub.svg',
  default: '/product-images/product-default.svg',
}
const categoryImageMap = {
  'Thiết bị công nghệ': '/product-images/laptop.svg',
  'Phụ kiện máy tính': '/product-images/keyboard.svg',
  'Văn phòng phẩm': '/product-images/notebook.svg',
  'Thiết bị lưu trữ': '/product-images/ssd.svg',
}

const getProductImage = (product) => {
  const categoryName = getCategoryName(product)
  return (
    product.image || product.image_url || product.thumbnail ||
    productImageMap[Number(product.id)] ||
    categoryImageMap[categoryName] ||
    productImageMap.default
  )
}

const getStockStatus = (product) => {
  const quantity = product?.quantity
  const minimumStock = Number(product?.minimum_stock ?? 5)
  const v = Number(quantity || 0)
  if (v === 0) return { label: 'Hết hàng', className: 'danger' }
  if (v <= minimumStock) return { label: 'Sắp hết', className: 'warning' }
  return { label: 'Còn hàng', className: 'success' }
}

const businessStatusMap = {
  active: { label: 'Đang kinh doanh', className: 'active' },
  inactive: { label: 'Tạm ngưng', className: 'inactive' },
  discontinued: { label: 'Ngừng kinh doanh', className: 'discontinued' },
}

const getBusinessStatus = (product) =>
  businessStatusMap[product?.status] || businessStatusMap.active

const unitLabelMap = {
  piece: 'Cái',
  box: 'Hộp',
  pack: 'Gói',
  set: 'Bộ',
  kg: 'Kg',
  meter: 'Mét',
  liter: 'Lít',
}

const getUnitLabel = (unit) => unitLabelMap[unit] || unit || 'Chưa có'

async function refreshAccessToken(signal) {
  const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken')
  if (!refreshToken) return null

  const response = await fetch(`${apiUrl}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
    signal,
  })

  if (!response.ok) return null

  const data = await response.json()
  if (!data.access) return null

  localStorage.setItem('access_token', data.access)
  localStorage.setItem('accessToken', data.access)
  return data.access
}

async function apiFetch(path, { signal } = {}) {
  let token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
  if (!token) throw new Error('Bạn cần đăng nhập để xem danh sách sản phẩm.')

  const request = (accessToken) => fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  })

  let response = await request(token)
  if (response.status !== 401) return response

  const newToken = await refreshAccessToken(signal)
  if (!newToken) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('refreshToken')
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  }

  response = await request(newToken)
  return response
}

function getApiErrorMessage(data, fallbackStatus) {
  if (data?.detail) return data.detail

  const firstField = data && typeof data === 'object' ? Object.keys(data)[0] : ''
  const firstError = firstField ? data[firstField] : null
  const rawMessage =
    (Array.isArray(firstError) ? firstError[0] : '') ||
    (typeof firstError === 'string' ? firstError : '') ||
    ''

  if (firstField === 'image' && rawMessage.toLowerCase().includes('valid url')) {
    return 'Ảnh sản phẩm chưa được upload đúng kiểu file. Cần chạy migration ImageField và restart backend trước khi thêm sản phẩm.'
  }

  if (firstField === 'image') {
    return `Ảnh sản phẩm: ${rawMessage || 'Không hợp lệ.'}`
  }

  if (firstField === 'barcode') {
    return `Barcode: ${rawMessage || 'Không hợp lệ hoặc đã tồn tại.'}`
  }

  if (firstField && rawMessage) return `${firstField}: ${rawMessage}`
  return `Lỗi API: ${fallbackStatus}`
}

async function apiJson(path, { method = 'GET', body, signal } = {}) {
  let token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
  if (!token) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.')
  const isFormData = body instanceof FormData

  const request = (accessToken) => fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    signal,
  })

  let response = await request(token)
  if (response.status === 401) {
    const newToken = await refreshAccessToken(signal)
    if (!newToken) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('refreshToken')
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
    response = await request(newToken)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, response.status))
  }

  return data
}

function createProductFormData(payload) {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return
    if (value === null) {
      formData.append(key, '')
      return
    }
    formData.append(key, value)
  })

  return formData
}

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
  const [toast, setToast] = useState(null)

  function showToast(type, message) {
    setToast({ id: Date.now(), type, message })
  }

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, toast.type === 'error' ? 6000 : 3500)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

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
          apiFetch(`/products/?${params}`, { signal: controller.signal }),
          apiFetch('/categories/', { signal: controller.signal }),
          apiFetch('/suppliers/', { signal: controller.signal }),
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
      await apiJson('/products/', {
        method: 'POST',
        body: createProductFormData(payload),
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
      await apiJson(`/products/${editingProduct.id}/`, {
        method: 'PATCH',
        body: createProductFormData(payload),
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
      await apiJson(`/products/${deleteTarget.id}/`, {
        method: 'DELETE',
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

  return (
    <div className="product-list-page">
      {toast && (
        <div className={`plp-toast ${toast.type}`} role="status" aria-live="polite">
          <div className="plp-toast-icon" aria-hidden="true">
            {toast.type === 'success' ? '✓' : '!'}
          </div>
          <p>{toast.message}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="plp-filter-bar">
        <label className="plp-filter-item plp-search">
          <span>Tìm kiếm</span>
          <div className="plp-input-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm theo tên hoặc mô tả..."
            />
          </div>
        </label>

        <label className="plp-filter-item">
          <span>Danh mục</span>
          <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setPage(1) }}>
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label className="plp-filter-item">
          <span>Tồn kho</span>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="in-stock">Còn hàng</option>
            <option value="low-stock">Sắp hết</option>
            <option value="out-of-stock">Hết hàng</option>
          </select>
        </label>

        <label className="plp-filter-item">
          <span>Sắp xếp</span>
          <select value={ordering} onChange={(e) => { setOrdering(e.target.value); setPage(1) }}>
            {orderingOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>

        <button className="plp-reset-btn" type="button" onClick={resetFilters}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.27" />
          </svg>
          Đặt lại
        </button>
      </div>

      <div className="plp-filter-bar plp-advanced-filter-bar">
        <label className="plp-filter-item">
          <span>Nhà cung cấp</span>
          <select value={selectedSupplier} onChange={(e) => { setSelectedSupplier(e.target.value); setPage(1) }}>
            <option value="all">Tất cả nhà cung cấp</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </label>

        <label className="plp-filter-item">
          <span>Kinh doanh</span>
          <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setPage(1) }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang kinh doanh</option>
            <option value="inactive">Tạm ngưng</option>
            <option value="discontinued">Ngừng kinh doanh</option>
          </select>
        </label>

        <label className="plp-filter-item">
          <span>Giá từ</span>
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
            placeholder="0"
          />
        </label>

        <label className="plp-filter-item">
          <span>Giá đến</span>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
            placeholder="Không giới hạn"
          />
        </label>

        <label className="plp-filter-item">
          <span>Tổng tồn từ</span>
          <input
            type="number"
            min="0"
            value={minQuantity}
            onChange={(e) => { setMinQuantity(e.target.value); setPage(1) }}
            placeholder="0"
          />
        </label>

        <label className="plp-filter-item">
          <span>Tổng tồn đến</span>
          <input
            type="number"
            min="0"
            value={maxQuantity}
            onChange={(e) => { setMaxQuantity(e.target.value); setPage(1) }}
            placeholder="Không giới hạn"
          />
        </label>
      </div>

      {/* Banners */}
      {error && <div className="plp-notice error">{error}</div>}

      {/* Table */}
      <div className="plp-table-card">
        <div className="plp-table-head">
          <span className="plp-count">{totalCount} sản phẩm</span>
          <div className="plp-table-actions">
            <span className="plp-mode-dot api">API</span>
            {canAdd && (
              <button
                type="button"
                className="plp-add-btn"
                onClick={() => {
                  setCreateError('')
                  setShowAddModal(true)
                }}
              >
                <span>+</span>
                Thêm sản phẩm
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="plp-state">
            <div className="plp-spinner" aria-label="Đang tải" />
            <span>Đang tải danh sách sản phẩm...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="plp-state">
            <span style={{ fontSize: '2rem' }}>🔍</span>
            <span>Không có sản phẩm phù hợp với bộ lọc hiện tại.</span>
          </div>
        ) : (
          <div className="plp-table-wrap">
            <table className="plp-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>SKU</th>
                  <th>Danh mục</th>
                  <th>Nhà cung cấp</th>
                  <th>Giá</th>
                  <th>Tổng tồn</th>
                  <th>Kinh doanh</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stock = getStockStatus(product)
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="plp-product-cell">
                          <div className="plp-avatar">
                            <img src={getProductImage(product)} alt={product.name} loading="lazy" />
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            <small>{product.description || 'Chưa có mô tả'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="plp-code">{product.sku || `#${product.id}`}</span>
                      </td>
                      <td>
                        <span className="plp-category-tag">{getCategoryName(product)}</span>
                      </td>
                      <td>
                        <span className="plp-supplier">{getSupplierName(product)}</span>
                      </td>
                      <td><strong className="plp-price">{formatCurrency(getProductPrice(product))}</strong></td>
                      <td><span className="plp-qty">{product.quantity}</span></td>
                      <td>
                        <span className={`plp-business-pill ${getBusinessStatus(product).className}`}>
                          {getBusinessStatus(product).label}
                        </span>
                      </td>
                      <td>
                        <span className={`plp-status-pill ${stock.className}`}>{stock.label}</span>
                      </td>
                      <td>
                        <div className="plp-row-actions">
                          <button
                            className="plp-action-btn detail"
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                          >
                            Chi tiết
                          </button>
                          {canChange && (
                            <button
                              className="plp-action-btn edit"
                              type="button"
                              onClick={() => {
                                setEditError('')
                                setEditingProduct(product)
                              }}
                            >
                              Sửa
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="plp-action-btn delete"
                              type="button"
                              onClick={() => {
                                setDeleteError('')
                                setDeleteTarget(product)
                              }}
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="plp-pagination">
          <span>Trang {page} / {totalPages} · Tổng {totalCount} sản phẩm</span>
          <div className="plp-pagination-btns">
            <button
              type="button"
              disabled={page === 1 || !previousPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages || !nextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau →
            </button>
          </div>
        </div>
      </div>

      {/* Modal chi tiết */}
      {selectedProduct && (
        <div
          className="plp-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            className="plp-modal plp-detail-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="plp-modal-header">
              <div>
                <span className="plp-modal-eyebrow">Chi tiết sản phẩm</span>
                <h2>{selectedProduct.name}</h2>
              </div>
              <button
                className="plp-modal-close"
                type="button"
                aria-label="Đóng"
                onClick={() => setSelectedProduct(null)}
              >
                ×
              </button>
            </div>

            <div className="plp-detail-layout">
              <div className="plp-detail-media">
                <img src={getProductImage(selectedProduct)} alt={selectedProduct.name} />
              </div>

              <div className="plp-detail-summary">
                <div className="plp-detail-tags">
                  <span className={`plp-business-pill ${getBusinessStatus(selectedProduct).className}`}>
                    {getBusinessStatus(selectedProduct).label}
                  </span>
                  <span className={`plp-status-pill ${getStockStatus(selectedProduct).className}`}>
                    {getStockStatus(selectedProduct).label}
                  </span>
                </div>

                <p className="plp-modal-desc">{selectedProduct.description || 'Sản phẩm chưa có mô tả.'}</p>

                <div className="plp-detail-price-row">
                  <div>
                    <span>Giá bán</span>
                    <strong>{formatCurrency(getProductPrice(selectedProduct))}</strong>
                  </div>
                  <div>
                    <span>Giá nhập</span>
                    <strong>{formatCurrency(selectedProduct.cost_price)}</strong>
                  </div>
                </div>

                {canChange && (
                  <button
                    className="plp-detail-edit"
                    type="button"
                    onClick={() => {
                      setEditError('')
                      setEditingProduct(selectedProduct)
                      setSelectedProduct(null)
                    }}
                  >
                    Sửa sản phẩm
                  </button>
                )}
              </div>
            </div>

            <div className="plp-modal-grid plp-detail-grid">
              <div className="plp-modal-item">
                <span>SKU</span>
                <strong>{selectedProduct.sku || `#${selectedProduct.id}`}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Barcode</span>
                <strong>{selectedProduct.barcode || 'Chưa có'}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Danh mục</span>
                <strong>{getCategoryName(selectedProduct)}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Nhà cung cấp</span>
                <strong>{getSupplierName(selectedProduct)}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Tổng tồn</span>
                <strong>{selectedProduct.quantity ?? 0}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Tồn tối thiểu</span>
                <strong>{selectedProduct.minimum_stock ?? 0}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Đơn vị tính</span>
                <strong>{getUnitLabel(selectedProduct.unit)}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Mã sản phẩm</span>
                <strong>#{selectedProduct.id}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Ngày tạo</span>
                <strong>{formatDateTime(selectedProduct.created_at)}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Cập nhật</span>
                <strong>{formatDateTime(selectedProduct.updated_at)}</strong>
              </div>
            </div>
          </section>
        </div>
      )}

      {showAddModal && (
        <div
          className="plp-modal-backdrop"
          role="presentation"
          onClick={() => !creating && setShowAddModal(false)}
        >
          <section
            className="plp-modal plp-form-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="plp-modal-header">
              <div>
                <span className="plp-modal-eyebrow">Quản lý sản phẩm</span>
                <h2>Thêm sản phẩm</h2>
              </div>
              <button
                className="plp-modal-close"
                type="button"
                aria-label="Đóng"
                disabled={creating}
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            {createError && <div className="plp-notice error">{createError}</div>}

            <ProductForm
              onSubmit={handleCreateProduct}
              onCancel={() => setShowAddModal(false)}
              loading={creating}
            />
          </section>
        </div>
      )}

      {editingProduct && (
        <div
          className="plp-modal-backdrop"
          role="presentation"
          onClick={() => !updating && setEditingProduct(null)}
        >
          <section
            className="plp-modal plp-form-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="plp-modal-header">
              <div>
                <span className="plp-modal-eyebrow">Quản lý sản phẩm</span>
                <h2>Sửa sản phẩm</h2>
              </div>
              <button
                className="plp-modal-close"
                type="button"
                aria-label="Đóng"
                disabled={updating}
                onClick={() => setEditingProduct(null)}
              >
                ×
              </button>
            </div>

            {editError && <div className="plp-notice error">{editError}</div>}

            <ProductForm
              initialData={editingProduct}
              onSubmit={handleUpdateProduct}
              onCancel={() => setEditingProduct(null)}
              loading={updating}
            />
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="plp-modal-backdrop"
          role="presentation"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <section
            className="plp-modal plp-delete-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="plp-modal-header">
              <div>
                <span className="plp-modal-eyebrow">Xác nhận xóa</span>
                <h2>{deleteTarget.name}</h2>
              </div>
              <button
                className="plp-modal-close"
                type="button"
                aria-label="Đóng"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                ×
              </button>
            </div>

            {deleteError && <div className="plp-notice error">{deleteError}</div>}

            <p className="plp-delete-text">
              Bạn muốn xóa sản phẩm này khỏi hệ thống? Nếu sản phẩm đã xuất hiện
              trong phiếu nhập, phiếu xuất hoặc dữ liệu nghiệp vụ khác, hệ thống
              sẽ không cho xóa để giữ lịch sử chính xác.
            </p>

            <div className="plp-delete-actions">
              <button
                type="button"
                className="plp-delete-cancel"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="plp-delete-confirm"
                disabled={deleting}
                onClick={handleDeleteProduct}
              >
                {deleting ? 'Đang xóa...' : 'Xóa sản phẩm'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
