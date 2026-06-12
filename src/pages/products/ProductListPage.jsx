import { useEffect, useMemo, useState } from 'react'
import './ProductListPage.css'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// ── Demo data ──────────────────────────────────────────────────────────────────
const demoCategories = [
  { id: 1, name: 'Thiết bị công nghệ' },
  { id: 2, name: 'Phụ kiện máy tính' },
  { id: 3, name: 'Văn phòng phẩm' },
  { id: 4, name: 'Thiết bị lưu trữ' },
]

const demoProducts = [
  { id: 1, name: 'Laptop Dell Latitude 5420', description: 'Laptop văn phòng cấu hình ổn định, phù hợp cho nhân viên kinh doanh và quản trị nội bộ.', price: '15500000', quantity: 8, category: 1, category_detail: { id: 1, name: 'Thiết bị công nghệ' }, created_at: '2026-06-01T08:00:00Z', image: '/product-images/laptop.svg' },
  { id: 2, name: 'Bàn phím cơ Keychron K2', description: 'Bàn phím cơ layout gọn, hỗ trợ kết nối Bluetooth và Type-C cho lập trình viên.', price: '2190000', quantity: 15, category: 2, category_detail: { id: 2, name: 'Phụ kiện máy tính' }, created_at: '2026-06-02T08:00:00Z', image: '/product-images/keyboard.svg' },
  { id: 3, name: 'Chuột Logitech MX Master 3S', description: 'Chuột không dây cao cấp, thao tác mượt, phù hợp làm việc văn phòng và thiết kế.', price: '2450000', quantity: 5, category: 2, category_detail: { id: 2, name: 'Phụ kiện máy tính' }, created_at: '2026-06-03T08:00:00Z', image: '/product-images/mouse.svg' },
  { id: 4, name: 'Ổ cứng SSD Samsung 1TB', description: 'Ổ cứng SSD tốc độ cao phục vụ lưu trữ dữ liệu dự án và sao lưu tài liệu.', price: '1890000', quantity: 3, category: 4, category_detail: { id: 4, name: 'Thiết bị lưu trữ' }, created_at: '2026-06-04T08:00:00Z', image: '/product-images/ssd.svg' },
  { id: 5, name: 'Sổ tay A5 Project Note', description: 'Sổ ghi chú dùng cho họp nhóm, ghi task, phân tích yêu cầu và lập kế hoạch sprint.', price: '45000', quantity: 30, category: 3, category_detail: { id: 3, name: 'Văn phòng phẩm' }, created_at: '2026-06-05T08:00:00Z', image: '/product-images/notebook.svg' },
  { id: 6, name: 'USB-C Hub 7 in 1', description: 'Hub mở rộng cổng kết nối HDMI, USB 3.0, Type-C, phù hợp laptop văn phòng.', price: '849000', quantity: 0, category: 2, category_detail: { id: 2, name: 'Phụ kiện máy tính' }, created_at: '2026-06-06T08:00:00Z', image: '/product-images/hub.svg' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
const orderingOptions = [
  { value: '-created_at', label: 'Mới nhất' },
  { value: 'name', label: 'Tên A-Z' },
  { value: 'price', label: 'Giá tăng dần' },
  { value: '-price', label: 'Giá giảm dần' },
  { value: '-quantity', label: 'Tồn kho cao' },
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0))

const getCategoryName = (product) =>
  product.category_detail?.name || product.category_name || `Danh mục #${product.category || 'N/A'}`

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

const getStockStatus = (quantity) => {
  const v = Number(quantity || 0)
  if (v === 0) return { label: 'Hết hàng', className: 'danger' }
  if (v <= 5) return { label: 'Sắp hết', className: 'warning' }
  return { label: 'Còn hàng', className: 'success' }
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProductListPage({ onStatsChange }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [ordering, setOrdering] = useState('-created_at')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProducts() {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
      const params = new URLSearchParams({ page: String(page), ordering })
      if (search.trim()) params.set('search', search.trim())
      if (selectedCategory !== 'all') params.set('category', selectedCategory)

      try {
        if (!token) throw new Error('Chưa có access token. Đang hiển thị dữ liệu mẫu.')

        const headers = { Authorization: `Bearer ${token}` }
        const [productRes, categoryRes] = await Promise.all([
          fetch(`${apiUrl}/products/?${params}`, { headers, signal: controller.signal }),
          fetch(`${apiUrl}/categories/`, { headers, signal: controller.signal }),
        ])

        if (!productRes.ok) throw new Error(`Lỗi API: ${productRes.status}`)

        const productData = await productRes.json()
        const categoryData = categoryRes.ok ? await categoryRes.json() : []
        const apiProducts = Array.isArray(productData.results) ? productData.results : productData
        const apiCategories = Array.isArray(categoryData.results) ? categoryData.results : categoryData

        setProducts(apiProducts)
        setCategories(apiCategories)
        setTotalCount(productData.count ?? apiProducts.length)
        setNextPage(productData.next || null)
        setPreviousPage(productData.previous || null)
        setIsDemoMode(false)
      } catch (err) {
        if (err.name === 'AbortError') return
        setProducts(demoProducts)
        setCategories(demoCategories)
        setTotalCount(demoProducts.length)
        setNextPage(null)
        setPreviousPage(null)
        setError(err.message)
        setIsDemoMode(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    return () => controller.abort()
  }, [page, ordering, search, selectedCategory])

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (stockFilter === 'in-stock') result = result.filter((p) => Number(p.quantity || 0) > 5)
    if (stockFilter === 'low-stock') result = result.filter((p) => Number(p.quantity || 0) > 0 && Number(p.quantity || 0) <= 5)
    if (stockFilter === 'out-of-stock') result = result.filter((p) => Number(p.quantity || 0) === 0)
    return result
  }, [products, stockFilter])

  // Expose stats lên App để dùng ở HomePage
  useEffect(() => {
    if (!onStatsChange) return
    const totalValue = filteredProducts.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0)
    const lowStock = filteredProducts.filter((p) => Number(p.quantity || 0) > 0 && Number(p.quantity || 0) <= 5).length
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
    setStockFilter('all')
    setOrdering('-created_at')
    setPage(1)
  }

  return (
    <div className="product-list-page">
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

      {/* Banners */}
      {error && <div className="plp-notice error">⚠ {error}</div>}
      {isDemoMode && (
        <div className="plp-notice info">
          Đang hiển thị dữ liệu mẫu. Lưu access token vào localStorage để kết nối API thật.
        </div>
      )}

      {/* Table */}
      <div className="plp-table-card">
        <div className="plp-table-head">
          <span className="plp-count">{totalCount} sản phẩm</span>
          <span className={`plp-mode-dot ${isDemoMode ? 'demo' : 'api'}`}>
            {isDemoMode ? 'Demo' : 'API'}
          </span>
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
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stock = getStockStatus(product.quantity)
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
                        <span className="plp-category-tag">{getCategoryName(product)}</span>
                      </td>
                      <td><strong className="plp-price">{formatCurrency(product.price)}</strong></td>
                      <td><span className="plp-qty">{product.quantity}</span></td>
                      <td>
                        <span className={`plp-status-pill ${stock.className}`}>{stock.label}</span>
                      </td>
                      <td>
                        <button
                          className="plp-detail-btn"
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                        >
                          Chi tiết
                        </button>
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
              disabled={page === 1 || (!isDemoMode && !previousPage)}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages || (!isDemoMode && !nextPage)}
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
            className="plp-modal"
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

            <div className="plp-modal-image">
              <img src={getProductImage(selectedProduct)} alt={selectedProduct.name} />
            </div>

            <p className="plp-modal-desc">{selectedProduct.description || 'Sản phẩm chưa có mô tả.'}</p>

            <div className="plp-modal-grid">
              <div className="plp-modal-item">
                <span>Danh mục</span>
                <strong>{getCategoryName(selectedProduct)}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Giá</span>
                <strong>{formatCurrency(selectedProduct.price)}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Số lượng</span>
                <strong>{selectedProduct.quantity}</strong>
              </div>
              <div className="plp-modal-item">
                <span>Trạng thái</span>
                <strong>{getStockStatus(selectedProduct.quantity).label}</strong>
              </div>
            </div>

            <div className="plp-modal-note">
              Màn hình xem chi tiết — chức năng thêm/sửa/xóa do thành viên khác phụ trách.
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
