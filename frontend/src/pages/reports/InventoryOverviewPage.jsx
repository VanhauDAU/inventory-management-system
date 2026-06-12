import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import './InventoryOverviewPage.css'

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

const formatNumber = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value || 0))

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

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

const transactionLabels = {
  import: 'Nhập',
  export: 'Xuất',
  adjustment: 'Điều chỉnh',
}

const priorityLabels = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
}

const formatDays = (value) => {
  if (value === null || value === undefined) return 'Chưa đủ dữ liệu'
  return `${formatNumber(value)} ngày`
}

function Icon({ name }) {
  const common = {
    width: 20,
    height: 20,
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
    wallet: (
      <>
        <path d="M20 12V8H6a3 3 0 0 1 0-6h12v4" />
        <path d="M4 6v14h16v-4" />
        <path d="M18 12h4v4h-4a2 2 0 0 1 0-4Z" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    activity: (
      <>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </>
    ),
  }

  return <svg {...common}>{paths[name]}</svg>
}

export default function InventoryOverviewPage({ onNavigate }) {
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [aiAdvice, setAiAdvice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(true)
  const [error, setError] = useState('')
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadReport() {
      setLoading(true)
      setAiLoading(true)
      setError('')
      setAiError('')

      try {
        const [summaryResponse, productList, warehouseList, transactionList, adviceResponse] = await Promise.all([
          api.get('/reports/inventory/summary/', { signal: controller.signal }),
          fetchAllPages('/products/?ordering=name', controller.signal),
          fetchAllPages('/warehouses/?ordering=name', controller.signal),
          fetchAllPages('/stock-transactions/?ordering=-created_at', controller.signal),
          api.get('/ai/inventory-advice/', { signal: controller.signal }).catch((err) => ({ error: err })),
        ])

        setSummary(summaryResponse.data)
        setProducts(productList)
        setWarehouses(warehouseList)
        setTransactions(transactionList)
        if (adviceResponse.error) {
          const detail = adviceResponse.error.response?.data?.detail
          setAiError(detail || 'Không thể tải gợi ý AI nhập hàng.')
          setAiAdvice(null)
        } else {
          setAiAdvice(adviceResponse.data)
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          const detail = err.response?.data?.detail
          setError(detail || 'Không thể tải tổng quan tồn kho. Vui lòng kiểm tra quyền truy cập hoặc kết nối API.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setAiLoading(false)
        }
      }
    }

    loadReport()
    return () => controller.abort()
  }, [])

  const report = useMemo(() => {
    const totalProducts = Number(summary?.total_products ?? products.length)
    const totalQuantity = Number(
      summary?.total_quantity ?? products.reduce((sum, product) => sum + Number(product.quantity || 0), 0)
    )
    const totalValue = Number(
      summary?.total_stock_value ??
      products.reduce((sum, product) => sum + Number(product.quantity || 0) * Number(product.cost_price || 0), 0)
    )
    const lowStockProducts = products
      .filter((product) => Number(product.quantity || 0) <= Number(product.minimum_stock || 0))
      .sort((a, b) => {
        const ratioA = Number(a.minimum_stock || 0) > 0 ? Number(a.quantity || 0) / Number(a.minimum_stock || 1) : 0
        const ratioB = Number(b.minimum_stock || 0) > 0 ? Number(b.quantity || 0) / Number(b.minimum_stock || 1) : 0
        return ratioA - ratioB
      })

    const categoryMap = products.reduce((map, product) => {
      const name = product.category_detail?.name || 'Chưa phân loại'
      const current = map.get(name) || { name, count: 0, quantity: 0, value: 0 }
      current.count += 1
      current.quantity += Number(product.quantity || 0)
      current.value += Number(product.quantity || 0) * Number(product.cost_price || 0)
      map.set(name, current)
      return map
    }, new Map())

    const topCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    const topWarehouses = [...warehouses]
      .sort((a, b) => Number(b.total_quantity || 0) - Number(a.total_quantity || 0))
      .slice(0, 6)

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 8)

    const importCount = Number(summary?.import_transactions || 0)
    const exportCount = Number(summary?.export_transactions || 0)
    const adjustmentCount = Number(summary?.adjustment_transactions || 0)

    return {
      totalProducts,
      totalQuantity,
      totalValue,
      lowStockProducts,
      lowStockCount: Number(summary?.low_stock_products ?? lowStockProducts.length),
      warehousesCount: Number(summary?.warehouses_count ?? warehouses.length),
      topCategories,
      topWarehouses,
      recentTransactions,
      importCount,
      exportCount,
      adjustmentCount,
      transactionTotal: importCount + exportCount + adjustmentCount || transactions.length,
      stockHealth: totalProducts > 0 ? Math.round(((totalProducts - lowStockProducts.length) / totalProducts) * 100) : 100,
    }
  }, [products, summary, transactions, warehouses])

  const cards = [
    { label: 'Tổng sản phẩm', value: formatNumber(report.totalProducts), hint: `${formatNumber(report.lowStockCount)} dưới ngưỡng`, icon: 'package', tone: 'blue' },
    { label: 'Tổng tồn kho', value: formatNumber(report.totalQuantity), hint: `${formatNumber(report.warehousesCount)} kho đang quản lý`, icon: 'warehouse', tone: 'teal' },
    { label: 'Giá trị tồn', value: formatCurrency(report.totalValue), hint: 'Theo giá vốn hiện tại', icon: 'wallet', tone: 'green' },
    { label: 'Luồng giao dịch', value: formatNumber(report.transactionTotal), hint: `${formatNumber(report.importCount)} nhập / ${formatNumber(report.exportCount)} xuất`, icon: 'activity', tone: 'indigo' },
  ]

  return (
    <div className="inventory-report-page">
      <section className="ir-header">
        <div>
          <span className="ir-eyebrow">Báo cáo tồn kho</span>
          <h2>Tổng quan tồn kho</h2>
          <p>Theo dõi sức khỏe tồn kho, giá trị hàng đang giữ, phân bổ theo kho và các mặt hàng cần bổ sung.</p>
        </div>
        <div className="ir-health">
          <span>Sức khỏe tồn kho</span>
          <strong>{loading ? '...' : `${report.stockHealth}%`}</strong>
          <div><i style={{ width: `${report.stockHealth}%` }} /></div>
        </div>
      </section>

      {error && <div className="ir-notice error">{error}</div>}

      <section className="ir-card-grid">
        {cards.map((card) => (
          <article className={`ir-card tone-${card.tone}`} key={card.label}>
            <span className="ir-card-icon"><Icon name={card.icon} /></span>
            <div>
              <span>{card.label}</span>
              <strong>{loading ? '...' : card.value}</strong>
              <small>{card.hint}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="ir-panel ir-ai-panel">
        <div className="ir-panel-head">
          <div>
            <span className="ir-eyebrow">AI advisor</span>
            <h3>Gợi ý nhập hàng</h3>
          </div>
          <button type="button" onClick={() => onNavigate?.('import-orders')}>Lập phiếu nhập</button>
        </div>

        {aiLoading ? (
          <div className="ir-state small">Đang phân tích tồn kho...</div>
        ) : aiError ? (
          <div className="ir-notice error">{aiError}</div>
        ) : !aiAdvice?.recommendations?.length ? (
          <div className="ir-ai-empty">
            <span><Icon name="alert" /></span>
            <strong>Chưa cần nhập thêm</strong>
            <p>{aiAdvice?.ai_summary || 'Tồn kho hiện tại chưa phát sinh cảnh báo theo ngưỡng và tốc độ xuất gần đây.'}</p>
          </div>
        ) : (
          <>
            <div className="ir-ai-summary">
              <p>{aiAdvice.ai_summary}</p>
              <div>
                {aiAdvice.meta?.mode === 'openai' && <span>OpenAI · {aiAdvice.meta?.model}</span>}
                <span>{formatNumber(aiAdvice.summary?.total_alerts)} cảnh báo</span>
                <span>{formatNumber(aiAdvice.summary?.estimated_restock_items)} sản phẩm đề xuất nhập</span>
                <span>{formatNumber(aiAdvice.summary?.high_priority)} ưu tiên cao</span>
              </div>
            </div>

            <div className="ir-ai-list">
              {aiAdvice.recommendations.slice(0, 5).map((item) => (
                <article className="ir-ai-row" key={item.product_id}>
                  <div className="ir-ai-product">
                    <span className={`ir-priority ${item.priority}`}>{priorityLabels[item.priority] || item.priority}</span>
                    <div>
                      <strong>{item.product_name}</strong>
                      <small>{item.sku} · {item.category_name || 'Chưa phân loại'}</small>
                    </div>
                  </div>
                  <div className="ir-ai-metrics">
                    <span><b>{formatNumber(item.current_quantity)}</b><small>Hiện có</small></span>
                    <span><b>{formatNumber(item.minimum_stock)}</b><small>Tối thiểu</small></span>
                    <span><b>{formatNumber(item.suggested_quantity)}</b><small>Đề xuất nhập</small></span>
                    <span><b>{formatDays(item.days_remaining)}</b><small>Dự kiến còn</small></span>
                  </div>
                  <p>{item.ai_reason || item.reason}</p>
                  {(item.risk || item.suggested_action) && (
                    <div className="ir-ai-extra">
                      {item.risk && <span><b>Rủi ro:</b> {item.risk}</span>}
                      {item.suggested_action && <span><b>Hành động:</b> {item.suggested_action}</span>}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="ir-main-grid">
        <article className="ir-panel ir-panel-large">
          <div className="ir-panel-head">
            <div>
              <span className="ir-eyebrow">Cảnh báo</span>
              <h3>Sản phẩm sắp hết hàng</h3>
            </div>
            <button type="button" onClick={() => onNavigate?.('report-low-stock')}>Chi tiết</button>
          </div>

          {loading ? (
            <div className="ir-state">Đang tải dữ liệu...</div>
          ) : report.lowStockProducts.length === 0 ? (
            <div className="ir-state">Không có sản phẩm dưới ngưỡng tối thiểu.</div>
          ) : (
            <div className="ir-low-list">
              {report.lowStockProducts.slice(0, 8).map((product) => {
                const quantity = Number(product.quantity || 0)
                const minimum = Number(product.minimum_stock || 0)
                const percent = minimum > 0 ? Math.min(100, Math.round((quantity / minimum) * 100)) : 0

                return (
                  <button type="button" className="ir-low-row" key={product.id} onClick={() => onNavigate?.('product-list')}>
                    <span>
                      <strong>{product.name}</strong>
                      <small>{product.sku || 'Chưa có SKU'} · {product.category_detail?.name || 'Chưa phân loại'}</small>
                    </span>
                    <span className="ir-meter">
                      <b>{formatNumber(quantity)} / {formatNumber(minimum)}</b>
                      <i><em style={{ width: `${percent}%` }} /></i>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </article>

        <article className="ir-panel">
          <div className="ir-panel-head compact">
            <div>
              <span className="ir-eyebrow">Kho hàng</span>
              <h3>Tồn theo kho</h3>
            </div>
          </div>

          <div className="ir-rank-list">
            {!loading && report.topWarehouses.length === 0 && <div className="ir-state small">Chưa có kho hàng.</div>}
            {report.topWarehouses.map((warehouse) => {
              const width = report.totalQuantity > 0 ? Math.max(8, Math.round((Number(warehouse.total_quantity || 0) / report.totalQuantity) * 100)) : 0
              return (
                <button type="button" className="ir-rank-row" key={warehouse.id} onClick={() => onNavigate?.('warehouse-list')}>
                  <span>
                    <strong>{warehouse.name}</strong>
                    <small>{formatNumber(warehouse.product_kinds_count)} loại sản phẩm</small>
                  </span>
                  <b>{formatNumber(warehouse.total_quantity)}</b>
                  <i><em style={{ width: `${width}%` }} /></i>
                </button>
              )
            })}
          </div>
        </article>

        <article className="ir-panel">
          <div className="ir-panel-head compact">
            <div>
              <span className="ir-eyebrow">Danh mục</span>
              <h3>Giá trị theo danh mục</h3>
            </div>
          </div>

          <div className="ir-category-list">
            {!loading && report.topCategories.length === 0 && <div className="ir-state small">Chưa có dữ liệu danh mục.</div>}
            {report.topCategories.map((category) => {
              const width = report.totalValue > 0 ? Math.max(8, Math.round((category.value / report.totalValue) * 100)) : 0
              return (
                <div className="ir-category-row" key={category.name}>
                  <span>
                    <strong>{category.name}</strong>
                    <small>{formatNumber(category.count)} sản phẩm · {formatNumber(category.quantity)} tồn</small>
                  </span>
                  <b>{formatCurrency(category.value)}</b>
                  <i><em style={{ width: `${width}%` }} /></i>
                </div>
              )
            })}
          </div>
        </article>

        <article className="ir-panel ir-panel-large">
          <div className="ir-panel-head">
            <div>
              <span className="ir-eyebrow">Gần đây</span>
              <h3>Giao dịch kho mới nhất</h3>
            </div>
            <button type="button" onClick={() => onNavigate?.('transaction-history')}>Lịch sử</button>
          </div>

          {loading ? (
            <div className="ir-state">Đang tải giao dịch...</div>
          ) : report.recentTransactions.length === 0 ? (
            <div className="ir-state">Chưa có giao dịch kho.</div>
          ) : (
            <div className="ir-transaction-list">
              {report.recentTransactions.map((transaction) => {
                const quantity = (transaction.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                const amount = (transaction.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

                return (
                  <button type="button" className="ir-transaction-row" key={transaction.id} onClick={() => onNavigate?.('transaction-history')}>
                    <span className={`ir-type ${transaction.transaction_type}`}>
                      {transactionLabels[transaction.transaction_type] || transaction.transaction_type}
                    </span>
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
        </article>
      </section>
    </div>
  )
}
