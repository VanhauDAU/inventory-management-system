import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import './LowStockReportPage.css'

const formatNumber = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value || 0))

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    alert: (
      <>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    package: (
      <>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 0-15.6-6.2L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 15.6 6.2L21 16" />
        <path d="M16 16h5v5" />
      </>
    ),
  }

  return <svg {...common}>{paths[name]}</svg>
}

function getEndpointFromUrl(url) {
  if (!url) return ''
  return url.replace(api.defaults.baseURL, '').replace(/^\/api/, '')
}

export default function LowStockReportPage({ onNavigate }) {
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [next, setNext] = useState('')
  const [previous, setPrevious] = useState('')
  const [currentPath, setCurrentPath] = useState('/reports/inventory/low-stock/')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = useCallback(async (path, signal) => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get(path, { signal })
      const data = response.data
      const rows = Array.isArray(data) ? data : data.results || []

      setItems(rows)
      setCount(Array.isArray(data) ? rows.length : data.count || 0)
      setNext(getEndpointFromUrl(data.next))
      setPrevious(getEndpointFromUrl(data.previous))
      setCurrentPath(path)
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
      const detail = err.response?.data?.detail
      setError(detail || 'Không thể tải báo cáo sản phẩm sắp hết hàng.')
      setItems([])
      setCount(0)
      setNext('')
      setPrevious('')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadReport('/reports/inventory/low-stock/', controller.signal)
    return () => controller.abort()
  }, [loadReport])

  const summary = useMemo(() => {
    const totalMissing = items.reduce((sum, item) => sum + Number(item.missing_quantity || 0), 0)
    const totalCurrent = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const totalMinimum = items.reduce((sum, item) => sum + Number(item.minimum_stock || 0), 0)
    const estimatedCost = items.reduce(
      (sum, item) => sum + Number(item.missing_quantity || 0) * Number(item.cost_price || 0),
      0,
    )

    return { totalMissing, totalCurrent, totalMinimum, estimatedCost }
  }, [items])

  const handleReload = () => {
    loadReport(currentPath)
  }

  const goToImportOrders = () => {
    onNavigate?.('import-orders')
  }

  return (
    <div className="low-stock-page">
      <section className="ls-header">
        <div>
          <span className="ls-eyebrow">Báo cáo tồn kho</span>
          <h2>Sản phẩm sắp hết hàng</h2>
          <p>Theo dõi các sản phẩm có tồn hiện tại thấp hơn hoặc bằng tồn tối thiểu để bổ sung kịp thời.</p>
        </div>
        <div className="ls-actions">
          <button type="button" className="ls-secondary" onClick={handleReload} disabled={loading}>
            <Icon name="refresh" />
            <span>Làm mới</span>
          </button>
          <button type="button" className="ls-primary" onClick={goToImportOrders}>
            <Icon name="plus" />
            <span>Lập phiếu nhập</span>
          </button>
        </div>
      </section>

      {error && <div className="ls-notice error">{error}</div>}

      <section className="ls-card-grid">
        <article className="ls-card tone-red">
          <span><Icon name="alert" /></span>
          <div>
            <small>Sản phẩm cảnh báo</small>
            <strong>{loading ? '...' : formatNumber(count)}</strong>
          </div>
        </article>
        <article className="ls-card tone-blue">
          <span><Icon name="package" /></span>
          <div>
            <small>Tồn hiện tại</small>
            <strong>{loading ? '...' : formatNumber(summary.totalCurrent)}</strong>
          </div>
        </article>
        <article className="ls-card tone-amber">
          <span><Icon name="package" /></span>
          <div>
            <small>Tồn tối thiểu</small>
            <strong>{loading ? '...' : formatNumber(summary.totalMinimum)}</strong>
          </div>
        </article>
        <article className="ls-card tone-green">
          <span><Icon name="plus" /></span>
          <div>
            <small>Cần bổ sung</small>
            <strong>{loading ? '...' : formatNumber(summary.totalMissing)}</strong>
          </div>
        </article>
      </section>

      <section className="ls-panel">
        <div className="ls-panel-head">
          <div>
            <span className="ls-eyebrow">Danh sách</span>
            <h3>Chi tiết sản phẩm</h3>
          </div>
          <strong>{formatCurrency(summary.estimatedCost)}</strong>
        </div>

        {loading ? (
          <div className="ls-state">Đang tải báo cáo...</div>
        ) : items.length === 0 ? (
          <div className="ls-empty">
            <span><Icon name="package" /></span>
            <strong>Không có sản phẩm sắp hết hàng</strong>
            <p>Tất cả sản phẩm hiện đang cao hơn ngưỡng tồn tối thiểu.</p>
          </div>
        ) : (
          <>
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Tên sản phẩm</th>
                    <th>Tồn hiện tại</th>
                    <th>Tồn tối thiểu</th>
                    <th>Cần bổ sung</th>
                    <th>Chi phí dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><code>{item.sku}</code></td>
                      <td>
                        <strong>{item.name}</strong>
                        <small>{item.category_name || 'Chưa phân loại'}</small>
                      </td>
                      <td>{formatNumber(item.quantity)}</td>
                      <td>{formatNumber(item.minimum_stock)}</td>
                      <td><b>{formatNumber(item.missing_quantity)}</b></td>
                      <td>{formatCurrency(Number(item.missing_quantity || 0) * Number(item.cost_price || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ls-pagination">
              <span>{formatNumber(items.length)} / {formatNumber(count)} sản phẩm</span>
              <div>
                <button type="button" disabled={!previous || loading} onClick={() => loadReport(previous)}>
                  Trước
                </button>
                <button type="button" disabled={!next || loading} onClick={() => loadReport(next)}>
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
