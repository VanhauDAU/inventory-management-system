import { useEffect, useMemo, useState } from 'react'
import '../styles/ProductCRUDPage.css'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const demoCategories = [
  { id: 1, name: 'Thiết bị công nghệ' },
  { id: 2, name: 'Phụ kiện máy tính' },
  { id: 3, name: 'Văn phòng phẩm' },
  { id: 4, name: 'Thiết bị lưu trữ' },
]

const demoProducts = [
  {
    id: 1,
    name: 'Laptop Dell Latitude 5420',
    description: 'Laptop văn phòng cấu hình ổn định, phù hợp cho nhân viên kinh doanh và quản trị nội bộ.',
    price: '15500000',
    quantity: 8,
    category: 1,
    category_detail: { id: 1, name: 'Thiết bị công nghệ' },
    created_at: '2026-06-01T08:00:00Z',
    image: '/product-images/laptop.svg',
  },
  {
    id: 2,
    name: 'Bàn phím cơ Keychron K2',
    description: 'Bàn phím cơ layout gọn, hỗ trợ kết nối Bluetooth và Type-C cho lập trình viên.',
    price: '2190000',
    quantity: 15,
    category: 2,
    category_detail: { id: 2, name: 'Phụ kiện máy tính' },
    created_at: '2026-06-02T08:00:00Z',
    image: '/product-images/keyboard.svg',
  },
  {
    id: 3,
    name: 'Chuột Logitech MX Master 3S',
    description: 'Chuột không dây cao cấp, thao tác mượt, phù hợp làm việc văn phòng và thiết kế.',
    price: '2450000',
    quantity: 5,
    category: 2,
    category_detail: { id: 2, name: 'Phụ kiện máy tính' },
    created_at: '2026-06-03T08:00:00Z',
    image: '/product-images/mouse.svg',
  },
  {
    id: 4,
    name: 'Ổ cứng SSD Samsung 1TB',
    description: 'Ổ cứng SSD tốc độ cao phục vụ lưu trữ dữ liệu dự án và sao lưu tài liệu.',
    price: '1890000',
    quantity: 3,
    category: 4,
    category_detail: { id: 4, name: 'Thiết bị lưu trữ' },
    created_at: '2026-06-04T08:00:00Z',
    image: '/product-images/ssd.svg',
  },
  {
    id: 5,
    name: 'Sổ tay A5 Project Note',
    description: 'Sổ ghi chú dùng cho họp nhóm, ghi task, phân tích yêu cầu và lập kế hoạch sprint.',
    price: '45000',
    quantity: 30,
    category: 3,
    category_detail: { id: 3, name: 'Văn phòng phẩm' },
    created_at: '2026-06-05T08:00:00Z',
    image: '/product-images/notebook.svg',
  },
  {
    id: 6,
    name: 'USB-C Hub 7 in 1',
    description: 'Hub mở rộng cổng kết nối HDMI, USB 3.0, Type-C, phù hợp laptop văn phòng.',
    price: '849000',
    quantity: 0,
    category: 2,
    category_detail: { id: 2, name: 'Phụ kiện máy tính' },
    created_at: '2026-06-06T08:00:00Z',
    image: '/product-images/hub.svg',
  },
]

const orderingOptions = [
  { value: '-created_at', label: 'Mới nhất' },
  { value: 'name', label: 'Tên A-Z' },
  { value: 'price', label: 'Giá tăng dần' },
  { value: '-price', label: 'Giá giảm dần' },
  { value: '-quantity', label: 'Tồn kho cao' },
]

const navItems = [
  { key: 'home', label: 'Trang chính', icon: '⌂' },
  { key: 'products', label: 'Sản phẩm', icon: '▦' },
  { key: 'categories', label: 'Danh mục', icon: '▣' },
  { key: 'statistics', label: 'Thống kê', icon: '◈' },
]

const formatCurrency = (value) => {
  const numberValue = Number(value || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numberValue)
}

const getCategoryName = (product) => product.category_detail?.name || product.category_name || `Danh mục #${product.category || 'N/A'}`

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
  return product.image || product.image_url || product.thumbnail || productImageMap[Number(product.id)] || categoryImageMap[categoryName] || productImageMap.default
}

const getStockStatus = (quantity) => {
  const value = Number(quantity || 0)
  if (value === 0) return { label: 'Hết hàng', className: 'danger' }
  if (value <= 5) return { label: 'Sắp hết', className: 'warning' }
  return { label: 'Còn hàng', className: 'success' }
}

function ProductCRUDPage() {
  const [activePage, setActivePage] = useState('home')
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
        if (!token) {
          throw new Error('Chưa có access token. Frontend đang hiển thị dữ liệu mẫu để demo giao diện.')
        }

        const headers = { Authorization: `Bearer ${token}` }
        const [productResponse, categoryResponse] = await Promise.all([
          fetch(`${apiUrl}/products/?${params.toString()}`, { headers, signal: controller.signal }),
          fetch(`${apiUrl}/categories/`, { headers, signal: controller.signal }),
        ])

        if (!productResponse.ok) {
          throw new Error(`Không tải được sản phẩm từ API. Mã lỗi: ${productResponse.status}`)
        }

        const productData = await productResponse.json()
        const categoryData = categoryResponse.ok ? await categoryResponse.json() : []
        const apiProducts = Array.isArray(productData.results) ? productData.results : productData
        const apiCategories = Array.isArray(categoryData.results) ? categoryData.results : categoryData

        setProducts(apiProducts)
        setCategories(apiCategories)
        setTotalCount(productData.count ?? apiProducts.length)
        setNextPage(productData.next || null)
        setPreviousPage(productData.previous || null)
        setIsDemoMode(false)
      } catch (requestError) {
        if (requestError.name === 'AbortError') return

        setProducts(demoProducts)
        setCategories(demoCategories)
        setTotalCount(demoProducts.length)
        setNextPage(null)
        setPreviousPage(null)
        setError(requestError.message)
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

    if (stockFilter === 'in-stock') {
      result = result.filter((product) => Number(product.quantity || 0) > 5)
    }

    if (stockFilter === 'low-stock') {
      result = result.filter((product) => Number(product.quantity || 0) > 0 && Number(product.quantity || 0) <= 5)
    }

    if (stockFilter === 'out-of-stock') {
      result = result.filter((product) => Number(product.quantity || 0) === 0)
    }

    return result
  }, [products, stockFilter])

  const stats = useMemo(() => {
    const totalValue = filteredProducts.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.quantity || 0), 0)
    const outOfStock = filteredProducts.filter((product) => Number(product.quantity || 0) === 0).length
    const lowStock = filteredProducts.filter((product) => Number(product.quantity || 0) > 0 && Number(product.quantity || 0) <= 5).length

    return {
      totalProducts: totalCount,
      totalQuantity: filteredProducts.reduce((sum, product) => sum + Number(product.quantity || 0), 0),
      totalValue,
      outOfStock,
      lowStock,
    }
  }, [filteredProducts, totalCount])

  const categoryOverview = useMemo(() => {
    return categories.map((category) => {
      const productsInCategory = filteredProducts.filter((product) => String(product.category) === String(category.id) || product.category_detail?.id === category.id)
      const value = productsInCategory.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.quantity || 0), 0)
      return { ...category, count: productsInCategory.length, value }
    })
  }, [categories, filteredProducts])

  const pieChartData = useMemo(() => {
    const colors = ['#2563eb', '#06b6d4', '#f59e0b', '#22c55e', '#8b5cf6', '#ef4444']
    const total = categoryOverview.reduce((sum, category) => sum + Number(category.count || 0), 0)
    let current = 0

    const segments = categoryOverview.map((category, index) => {
      const percentage = total > 0 ? (Number(category.count || 0) / total) * 100 : 0
      const start = current
      const end = current + percentage
      current = end
      return {
        ...category,
        color: colors[index % colors.length],
        percentage,
        range: `${colors[index % colors.length]} ${start}% ${end}%`,
      }
    })

    return {
      total,
      segments,
      gradient: total > 0 ? `conic-gradient(${segments.map((segment) => segment.range).join(', ')})` : 'conic-gradient(#e2e8f0 0% 100%)',
    }
  }, [categoryOverview])

  const bestProducts = useMemo(() => {
    return [...filteredProducts]
      .sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0))
      .slice(0, 4)
  }, [filteredProducts])

  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  function resetFilters() {
    setSearch('')
    setSelectedCategory('all')
    setStockFilter('all')
    setOrdering('-created_at')
    setPage(1)
  }

  function renderHomePage() {
    return (
      <>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">React + Django REST API</span>
            <h1>Giao diện quản lý sản phẩm theo dạng website</h1>
            <p>
              Trang chính được thiết kế như một website sản phẩm: có khu vực giới thiệu, danh mục nổi bật,
              sản phẩm tiêu biểu và lối điều hướng nhanh đến danh sách sản phẩm, danh mục, thống kê.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" type="button" onClick={() => setActivePage('products')}>Xem sản phẩm</button>
              <button className="btn btn-secondary" type="button" onClick={() => setActivePage('categories')}>Xem danh mục</button>
            </div>
          </div>
          <div className="hero-card">
            <span className="hero-card-title">Tổng quan kho</span>
            <strong>{formatCurrency(stats.totalValue)}</strong>
            <small>{stats.totalProducts} sản phẩm · {stats.totalQuantity} đơn vị tồn kho</small>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Danh mục</span>
              <h2>Danh mục sản phẩm</h2>
            </div>
            <button className="text-button" type="button" onClick={() => setActivePage('categories')}>Xem tất cả</button>
          </div>
          <div className="category-grid">
            {categoryOverview.map((category) => (
              <button className="category-card" key={category.id} type="button" onClick={() => { setSelectedCategory(String(category.id)); setActivePage('products') }}>
                <span className="category-icon">{category.name.charAt(0).toUpperCase()}</span>
                <strong>{category.name}</strong>
                <small>{category.count} sản phẩm</small>
              </button>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Sản phẩm</span>
              <h2>Sản phẩm nổi bật</h2>
            </div>
            <button className="text-button" type="button" onClick={() => setActivePage('products')}>Mở danh sách</button>
          </div>
          <div className="product-card-grid">
            {bestProducts.map((product) => (
              <ProductCard key={product.id} product={product} onView={() => setSelectedProduct(product)} />
            ))}
          </div>
        </section>
      </>
    )
  }

  function renderProductsPage() {
    return (
      <>
        <section className="section-block product-section">
          <div className="section-heading product-heading">
            <div>
              <span className="eyebrow">GET /API/PRODUCTS/</span>
              <h2>Danh sách sản phẩm</h2>
              <p>Hiển thị sản phẩm, tìm kiếm, lọc danh mục, sắp xếp và phân trang theo tài liệu backend.</p>
            </div>
            <button className="btn btn-secondary" type="button" onClick={resetFilters}>Đặt lại bộ lọc</button>
          </div>

          <div className="filter-panel">
            <label>
              <span>Tìm kiếm</span>
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Tìm theo tên hoặc mô tả" />
            </label>
            <label>
              <span>Danh mục</span>
              <select value={selectedCategory} onChange={(event) => { setSelectedCategory(event.target.value); setPage(1) }}>
                <option value="all">Tất cả danh mục</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              <span>Tồn kho</span>
              <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
                <option value="all">Tất cả</option>
                <option value="in-stock">Còn hàng</option>
                <option value="low-stock">Sắp hết</option>
                <option value="out-of-stock">Hết hàng</option>
              </select>
            </label>
            <label>
              <span>Sắp xếp</span>
              <select value={ordering} onChange={(event) => { setOrdering(event.target.value); setPage(1) }}>
                {orderingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          {error && <div className="notice-banner">Thông báo kết nối: {error}</div>}
          {isDemoMode && <div className="demo-note">Frontend đang dùng dữ liệu mẫu. Khi thành viên phụ trách Login lưu access token vào localStorage, bảng sẽ tự gọi API thật.</div>}

          {loading ? (
            <div className="state-box">Đang tải danh sách sản phẩm...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="state-box">Không có sản phẩm phù hợp với bộ lọc hiện tại.</div>
          ) : (
            <div className="table-wrap">
              <table className="product-table">
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
                    const stockStatus = getStockStatus(product.quantity)
                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="table-product">
                            <span className="product-avatar image-avatar">
                              <img src={getProductImage(product)} alt={product.name} loading="lazy" />
                            </span>
                            <div>
                              <strong>{product.name}</strong>
                              <small>{product.description || 'Chưa có mô tả'}</small>
                            </div>
                          </div>
                        </td>
                        <td>{getCategoryName(product)}</td>
                        <td><strong>{formatCurrency(product.price)}</strong></td>
                        <td>{product.quantity}</td>
                        <td><span className={`status-pill ${stockStatus.className}`}>{stockStatus.label}</span></td>
                        <td>
                          <button className="btn btn-small" type="button" onClick={() => setSelectedProduct(product)}>Xem chi tiết</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="pagination-bar">
            <span>Trang {page} / {totalPages} · Tổng {totalCount} sản phẩm</span>
            <div className="pagination-actions">
              <button className="btn btn-secondary" type="button" disabled={page === 1 || (!isDemoMode && !previousPage)} onClick={() => setPage((current) => Math.max(1, current - 1))}>Trước</button>
              <button className="btn btn-primary" type="button" disabled={page >= totalPages || (!isDemoMode && !nextPage)} onClick={() => setPage((current) => current + 1)}>Sau</button>
            </div>
          </div>
        </section>
      </>
    )
  }

  function renderCategoriesPage() {
    return (
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GET /API/CATEGORIES/</span>
            <h2>Danh mục sản phẩm</h2>
            <p>Trang danh mục chỉ hiển thị và điều hướng lọc sản phẩm, không thực hiện CRUD danh mục.</p>
          </div>
        </div>
        <div className="category-list-grid">
          {categoryOverview.map((category) => (
            <article className="category-summary" key={category.id}>
              <span className="category-icon">{category.name.charAt(0).toUpperCase()}</span>
              <div>
                <h3>{category.name}</h3>
                <p>{category.count} sản phẩm · {formatCurrency(category.value)} giá trị tồn kho</p>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => { setSelectedCategory(String(category.id)); setActivePage('products') }}>Xem sản phẩm</button>
            </article>
          ))}
        </div>
      </section>
    )
  }

  function renderStatisticsPage() {
    const maxValue = Math.max(...categoryOverview.map((category) => category.value), 1)
    return (
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Thống kê</span>
            <h2>Báo cáo tổng quan sản phẩm</h2>
            <p>Giữ lại chức năng thống kê ở một mục riêng trên giao diện chính.</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard label="Tổng sản phẩm" value={stats.totalProducts} note="Theo API hoặc dữ liệu demo" />
          <StatCard label="Tổng số lượng" value={stats.totalQuantity} note="Số lượng tồn kho" />
          <StatCard label="Sắp hết hàng" value={stats.lowStock} note="Số lượng từ 1 đến 5" />
          <StatCard label="Giá trị tồn kho" value={formatCurrency(stats.totalValue)} note="Giá x số lượng" />
        </div>

        <div className="statistics-layout">
          <div className="chart-panel">
            <h3>Giá trị tồn kho theo danh mục</h3>
            <div className="bar-list">
              {categoryOverview.map((category) => (
                <div className="bar-row" key={category.id}>
                  <span>{category.name}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(6, Math.round((category.value / maxValue) * 100))}%` }} /></div>
                  <strong>{formatCurrency(category.value)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-panel pie-panel">
            <h3>Cơ cấu sản phẩm theo danh mục</h3>
            <div className="pie-content">
              <div className="pie-chart" style={{ background: pieChartData.gradient }}>
                <span>{pieChartData.total}</span>
                <small>sản phẩm</small>
              </div>
              <div className="pie-legend">
                {pieChartData.segments.map((segment) => (
                  <div className="pie-legend-item" key={segment.id}>
                    <span className="legend-dot" style={{ background: segment.color }} />
                    <strong>{segment.name}</strong>
                    <small>{segment.count} SP · {Math.round(segment.percentage)}%</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const pageTitle = {
    home: 'Trang chính',
    products: 'Danh sách sản phẩm',
    categories: 'Danh mục sản phẩm',
    statistics: 'Thống kê',
  }[activePage]

  return (
    <div className="website-shell">
      <aside className="site-sidebar">
        <div className="brand-box">
          <span className="brand-logo">PM</span>
          <div>
            <strong>Product Management</strong>
            <small>Frontend UI</small>
          </div>
        </div>

        <nav className="site-nav">
          {navItems.map((item) => (
            <button key={item.key} type="button" className={`nav-link ${activePage === item.key ? 'active' : ''}`} onClick={() => setActivePage(item.key)}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="role-card">
          <span>Nhiệm vụ cá nhân</span>
          <strong>Lê Đình Nguyên</strong>
          <small>Setup React · Layout · Product List · Product Detail</small>
        </div>
      </aside>

      <main className="site-main">
        <header className="site-header">
          <div>
            <span className="eyebrow">Product Management System</span>
            <h1>{pageTitle}</h1>
          </div>
          <div className="header-actions">
            <span className={`mode-chip ${isDemoMode ? 'demo' : 'api'}`}>{isDemoMode ? 'Demo data' : 'API data'}</span>
            <code>{apiUrl}</code>
          </div>
        </header>

        <div className="content-area">
          {activePage === 'home' && renderHomePage()}
          {activePage === 'products' && renderProductsPage()}
          {activePage === 'categories' && renderCategoriesPage()}
          {activePage === 'statistics' && renderStatisticsPage()}
        </div>
      </main>

      {selectedProduct && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedProduct(null)}>
          <section className="product-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">Chi tiết sản phẩm</span>
                <h2>{selectedProduct.name}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelectedProduct(null)}>×</button>
            </div>
            <div className="modal-product-image">
              <img src={getProductImage(selectedProduct)} alt={selectedProduct.name} />
            </div>
            <p>{selectedProduct.description || 'Sản phẩm chưa có mô tả.'}</p>
            <div className="detail-grid">
              <DetailItem label="Danh mục" value={getCategoryName(selectedProduct)} />
              <DetailItem label="Giá" value={formatCurrency(selectedProduct.price)} />
              <DetailItem label="Số lượng" value={selectedProduct.quantity} />
              <DetailItem label="Trạng thái" value={getStockStatus(selectedProduct.quantity).label} />
            </div>
            <div className="modal-note">Màn hình này thuộc phần Product Detail của frontend. Không thực hiện thêm/sửa/xóa vì đó là nhiệm vụ của thành viên khác.</div>
          </section>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, note }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  )
}

function ProductCard({ product, onView }) {
  const stockStatus = getStockStatus(product.quantity)
  return (
    <article className="product-card">
      <div className="product-thumb">
        <img src={getProductImage(product)} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card-body">
        <span className={`status-pill ${stockStatus.className}`}>{stockStatus.label}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>
      <div className="product-card-footer">
        <strong>{formatCurrency(product.price)}</strong>
        <button className="btn btn-small" type="button" onClick={onView}>Chi tiết</button>
      </div>
    </article>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default ProductCRUDPage
