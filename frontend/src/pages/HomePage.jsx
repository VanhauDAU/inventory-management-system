import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { canAccessPage, hasPermission } from '../utils/permissions'
import './HomePage.css'

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0))

const formatNumber = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value || 0))

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const unwrapList = (data) => Array.isArray(data) ? data : data?.results || []

async function fetchAllPages(path, signal) {
  const items = []
  let nextPath = path

  while (nextPath) {
    const response = await api.get(nextPath, { signal })
    const data = response.data
    items.push(...unwrapList(data))

    if (!data?.next) break
    nextPath = data.next.replace(api.defaults.baseURL, '').replace(/^\/api/, '')
  }

  return items
}

function Icon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    package: (
      <>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    warehouse: (
      <>
        <path d="M3 21V8l9-5 9 5v13" />
        <path d="M7 21v-8h10v8" />
        <path d="M7 10h10" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    wallet: (
      <>
        <path d="M20 12V8H6a3 3 0 0 1 0-6h12v4" />
        <path d="M4 6v14h16v-4" />
        <path d="M18 12h4v4h-4a2 2 0 0 1 0-4Z" />
      </>
    ),
    import: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    export: (
      <>
        <path d="M12 15V3" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 21h14" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 15 4-4 3 3 5-7" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
  }

  return <svg {...common}>{paths[name]}</svg>
}

const transactionLabels = {
  import: 'Nhập kho',
  export: 'Xuất kho',
  adjustment: 'Điều chỉnh',
}

const quickLinks = [
  { key: 'import-orders', label: 'Lập phiếu nhập', desc: 'Bổ sung tồn kho từ nhà cung cấp', icon: 'import' },
  { key: 'export-orders', label: 'Lập phiếu xuất', desc: 'Ghi nhận xuất hàng theo kho', icon: 'export' },
  { key: 'product-list', label: 'Sản phẩm', desc: 'Cập nhật giá, tồn và ngưỡng cảnh báo', icon: 'package' },
  { key: 'warehouse-list', label: 'Kho hàng', desc: 'Theo dõi sức chứa và điểm lưu kho', icon: 'warehouse' },
]

export default function HomePage({ stats, onStatsChange, onNavigate, currentUser }) {
  const canViewProducts = hasPermission(currentUser, 'products.view_product')
  const canViewWarehouses = hasPermission(currentUser, 'inventory.view_warehouse')
  const canViewTransactions = hasPermission(currentUser, 'inventory.view_stocktransaction')
  const canViewSummary = canAccessPage(currentUser, 'report-overview')
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const [summaryResponse, productList, warehouseList, transactionList] = await Promise.all([
          canViewSummary
            ? api.get('/reports/inventory/summary/', { signal: controller.signal })
            : Promise.resolve({ data: null }),
          canViewProducts
            ? fetchAllPages('/products/?ordering=name', controller.signal)
            : Promise.resolve([]),
          canViewWarehouses
            ? fetchAllPages('/warehouses/?ordering=name', controller.signal)
            : Promise.resolve([]),
          canViewTransactions
            ? fetchAllPages('/stock-transactions/?ordering=-created_at', controller.signal)
            : Promise.resolve([]),
        ])

        setSummary(summaryResponse.data)
        setProducts(productList)
        setWarehouses(warehouseList)
        setTransactions(transactionList)

        onStatsChange?.({
          totalProducts: summaryResponse.data?.total_products ?? productList.length,
          totalQuantity: summaryResponse.data?.total_quantity ?? productList.reduce((sum, product) => sum + Number(product.quantity || 0), 0),
          lowStock: summaryResponse.data?.low_stock_products ?? productList.filter((product) => Number(product.quantity || 0) <= Number(product.minimum_stock || 0)).length,
          totalValue: summaryResponse.data?.total_stock_value ?? productList.reduce((sum, product) => sum + Number(product.quantity || 0) * Number(product.cost_price || 0), 0),
        })
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          setError('Không thể tải dữ liệu dashboard. Vui lòng kiểm tra kết nối API hoặc đăng nhập lại.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadDashboard()
    return () => controller.abort()
  }, [canViewProducts, canViewSummary, canViewTransactions, canViewWarehouses, onStatsChange])

  const dashboard = useMemo(() => {
    const totalProducts = Number(summary?.total_products ?? stats?.totalProducts ?? products.length)
    const totalQuantity = Number(summary?.total_quantity ?? stats?.totalQuantity ?? products.reduce((sum, product) => sum + Number(product.quantity || 0), 0))
    const totalValue = Number(summary?.total_stock_value ?? stats?.totalValue ?? products.reduce((sum, product) => sum + Number(product.quantity || 0) * Number(product.cost_price || 0), 0))
    const lowStockProducts = products
      .filter((product) => Number(product.quantity || 0) <= Number(product.minimum_stock || 0))
      .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0))

    const importCount = Number(summary?.import_transactions || 0)
    const exportCount = Number(summary?.export_transactions || 0)
    const adjustmentCount = Number(summary?.adjustment_transactions || 0)
    const transactionTotal = importCount + exportCount + adjustmentCount || transactions.length
    const exportRatio = totalQuantity + exportCount > 0 ? Math.min(100, Math.round((exportCount / Math.max(transactionTotal, 1)) * 100)) : 0

    const byCategory = products.reduce((map, product) => {
      const category = product.category_detail?.name || 'Chưa phân loại'
      const current = map.get(category) || { name: category, count: 0, quantity: 0, value: 0 }
      current.count += 1
      current.quantity += Number(product.quantity || 0)
      current.value += Number(product.quantity || 0) * Number(product.cost_price || 0)
      map.set(category, current)
      return map
    }, new Map())

    const topCategories = Array.from(byCategory.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const topWarehouses = [...warehouses]
      .sort((a, b) => Number(b.total_quantity || 0) - Number(a.total_quantity || 0))
      .slice(0, 5)

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 6)

    return {
      totalProducts,
      totalQuantity,
      totalValue,
      lowStockProducts,
      warehousesCount: Number(summary?.warehouses_count ?? warehouses.length),
      importCount,
      exportCount,
      adjustmentCount,
      transactionTotal,
      exportRatio,
      topCategories,
      topWarehouses,
      recentTransactions,
      averageValue: totalProducts > 0 ? totalValue / totalProducts : 0,
    }
  }, [products, stats, summary, transactions, warehouses])

  const statCards = [
    { visible: canViewProducts, label: 'Sản phẩm đang quản lý', value: formatNumber(dashboard.totalProducts), hint: `${formatNumber(dashboard.lowStockProducts.length)} mặt hàng cần chú ý`, icon: 'package', tone: 'blue' },
    { visible: canViewWarehouses, label: 'Tổng tồn kho', value: formatNumber(dashboard.totalQuantity), hint: `${formatNumber(dashboard.warehousesCount)} kho đang theo dõi`, icon: 'warehouse', tone: 'cyan' },
    { visible: canViewProducts, label: 'Giá trị tồn kho', value: formatCurrency(dashboard.totalValue), hint: `Bình quân ${formatCurrency(dashboard.averageValue)}/sản phẩm`, icon: 'wallet', tone: 'green' },
    { visible: canViewTransactions, label: 'Giao dịch kho', value: formatNumber(dashboard.transactionTotal), hint: `${formatNumber(dashboard.importCount)} nhập · ${formatNumber(dashboard.exportCount)} xuất`, icon: 'chart', tone: 'violet' },
  ].filter((card) => card.visible)
  const visibleQuickLinks = quickLinks.filter((link) => canAccessPage(currentUser, link.key))

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">Dashboard vận hành kho</span>
          <h2>Tổng quan dữ liệu sản phẩm và tồn kho</h2>
          <p>Theo dõi nhanh giá trị tồn, hàng cần nhập thêm, phân bổ theo kho và lịch sử nhập xuất mới nhất từ dữ liệu API.</p>
        </div>
        {canViewTransactions && <div className="home-hero-panel" aria-label="Tóm tắt nhập xuất">
          <div>
            <span>Tỷ trọng phiếu xuất</span>
            <strong>{dashboard.exportRatio}%</strong>
          </div>
          <div className="home-progress"><span style={{ width: `${dashboard.exportRatio}%` }} /></div>
          <small>{formatNumber(dashboard.importCount)} nhập · {formatNumber(dashboard.exportCount)} xuất · {formatNumber(dashboard.adjustmentCount)} điều chỉnh</small>
        </div>}
      </section>

      {error && <div className="home-alert">{error}</div>}

      <div className="home-stats-grid">
        {statCards.map((card) => (
          <article className={`home-stat-card tone-${card.tone}`} key={card.label}>
            <div className="home-stat-icon"><Icon name={card.icon} /></div>
            <div className="home-stat-body">
              <span>{card.label}</span>
              <strong>{loading ? '...' : card.value}</strong>
              <small>{card.hint}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="home-dashboard-grid">
        {canViewProducts && <section className="home-panel home-panel-large">
          <div className="home-panel-head">
            <div>
              <span className="home-eyebrow">Cảnh báo tồn kho</span>
              <h3>Sản phẩm dưới ngưỡng tối thiểu</h3>
            </div>
            {canAccessPage(currentUser, 'report-low-stock') && (
              <button type="button" onClick={() => onNavigate('report-low-stock')}>Xem báo cáo</button>
            )}
          </div>

          {loading ? (
            <div className="home-state">Đang tải sản phẩm...</div>
          ) : dashboard.lowStockProducts.length === 0 ? (
            <div className="home-state">Không có sản phẩm dưới ngưỡng tồn kho.</div>
          ) : (
            <div className="home-product-list">
              {dashboard.lowStockProducts.slice(0, 6).map((product) => {
                const quantity = Number(product.quantity || 0)
                const minimum = Number(product.minimum_stock || 0)
                const percent = minimum > 0 ? Math.min(100, Math.round((quantity / minimum) * 100)) : 0

                return (
                  <article className="home-product-row" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.sku} · {product.category_detail?.name || 'Chưa phân loại'}</span>
                    </div>
                    <div className="home-stock-meter">
                      <small>{formatNumber(quantity)} / {formatNumber(minimum)} {product.unit || ''}</small>
                      <div><span style={{ width: `${percent}%` }} /></div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>}

        {canAccessPage(currentUser, 'warehouse-list') && <section className="home-panel">
          <div className="home-panel-head compact">
            <div>
              <span className="home-eyebrow">Kho hàng</span>
              <h3>Tồn theo kho</h3>
            </div>
          </div>
          <div className="home-rank-list">
            {dashboard.topWarehouses.length === 0 && <div className="home-state small">Chưa có kho hàng.</div>}
            {dashboard.topWarehouses.map((warehouse) => (
              <button type="button" className="home-rank-row" key={warehouse.id} onClick={() => onNavigate('warehouse-list')}>
                <span>
                  <strong>{warehouse.name}</strong>
                  <small>{formatNumber(warehouse.product_kinds_count)} loại sản phẩm</small>
                </span>
                <b>{formatNumber(warehouse.total_quantity)}</b>
              </button>
            ))}
          </div>
        </section>}

        {canViewProducts && <section className="home-panel">
          <div className="home-panel-head compact">
            <div>
              <span className="home-eyebrow">Danh mục</span>
              <h3>Giá trị theo nhóm</h3>
            </div>
          </div>
          <div className="home-category-list">
            {dashboard.topCategories.length === 0 && <div className="home-state small">Chưa có dữ liệu danh mục.</div>}
            {dashboard.topCategories.map((category) => {
              const width = dashboard.totalValue > 0 ? Math.max(6, Math.round((category.value / dashboard.totalValue) * 100)) : 0
              return (
                <div className="home-category-row" key={category.name}>
                  <div>
                    <strong>{category.name}</strong>
                    <span>{formatNumber(category.count)} sản phẩm · {formatNumber(category.quantity)} tồn</span>
                  </div>
                  <small>{formatCurrency(category.value)}</small>
                  <div><span style={{ width: `${width}%` }} /></div>
                </div>
              )
            })}
          </div>
        </section>}

        {canAccessPage(currentUser, 'transaction-history') && <section className="home-panel home-panel-large">
          <div className="home-panel-head">
            <div>
              <span className="home-eyebrow">Luồng kho</span>
              <h3>Giao dịch gần đây</h3>
            </div>
            <button type="button" onClick={() => onNavigate('transaction-history')}>Xem lịch sử</button>
          </div>

          {loading ? (
            <div className="home-state">Đang tải giao dịch...</div>
          ) : dashboard.recentTransactions.length === 0 ? (
            <div className="home-state">Chưa có giao dịch kho.</div>
          ) : (
            <div className="home-transaction-table">
              {dashboard.recentTransactions.map((transaction) => {
                const quantity = (transaction.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                const amount = (transaction.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

                return (
                  <button type="button" className="home-transaction-row" key={transaction.id} onClick={() => onNavigate('transaction-history')}>
                    <span className={`home-type ${transaction.transaction_type}`}>{transactionLabels[transaction.transaction_type] || transaction.transaction_type}</span>
                    <span>
                      <strong>{transaction.transaction_code}</strong>
                      <small>{transaction.warehouse_detail?.name || 'Chưa có kho'} · {formatDateTime(transaction.created_at)}</small>
                    </span>
                    <b>{formatNumber(quantity)}</b>
                    <em>{formatCurrency(amount)}</em>
                  </button>
                )
              })}
            </div>
          )}
        </section>}
      </div>

      {visibleQuickLinks.length > 0 && <section className="home-panel">
        <div className="home-panel-head compact">
          <div>
            <span className="home-eyebrow">Thao tác nhanh</span>
            <h3>Lối tắt nghiệp vụ</h3>
          </div>
        </div>
        <div className="home-quick-grid">
          {visibleQuickLinks.map((link) => (
            <button key={link.key} type="button" className="home-quick-card" onClick={() => onNavigate(link.key)}>
              <span className="home-quick-icon"><Icon name={link.icon} /></span>
              <span>
                <strong>{link.label}</strong>
                <small>{link.desc}</small>
              </span>
              <Icon name="arrow" />
            </button>
          ))}
        </div>
      </section>}
    </div>
  )
}
