import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './DashboardPage.css'

const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v || 0))

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TX_TYPE_LABEL = { import: 'Nhập kho', export: 'Xuất kho', adjustment: 'Điều chỉnh' }
const TX_TYPE_CLASS = { import: 'tx-import', export: 'tx-export', adjustment: 'tx-adjust' }

const quickLinks = [
  { key: '/products', label: 'Danh sách sản phẩm', desc: 'Xem và quản lý toàn bộ sản phẩm', icon: '📦' },
  { key: '/products/create', label: 'Thêm sản phẩm', desc: 'Tạo sản phẩm mới vào hệ thống', icon: '➕' },
  { key: '/stock/imports', label: 'Phiếu nhập kho', desc: 'Tạo và theo dõi phiếu nhập', icon: '📥' },
  { key: '/reports/inventory', label: 'Báo cáo tồn kho', desc: 'Thống kê tổng quan kho hàng', icon: '📊' },
]

// Demo data khi chưa có API
const DEMO_STATS = { totalProducts: 24, outOfStock: 3, lowStock: 5, totalValue: 385000000 }
const DEMO_TX = [
  { id: 1, transaction_code: 'NK-2026-001', transaction_type: 'import', warehouse: { name: 'Kho Hà Nội' }, created_at: '2026-06-12T08:30:00Z', items_count: 3 },
  { id: 2, transaction_code: 'XK-2026-042', transaction_type: 'export', warehouse: { name: 'Kho HCM' }, created_at: '2026-06-11T14:20:00Z', items_count: 2 },
  { id: 3, transaction_code: 'DC-2026-007', transaction_type: 'adjustment', warehouse: { name: 'Kho Đà Nẵng' }, created_at: '2026-06-10T10:00:00Z', items_count: 1 },
  { id: 4, transaction_code: 'NK-2026-002', transaction_type: 'import', warehouse: { name: 'Kho Hà Nội' }, created_at: '2026-06-09T09:15:00Z', items_count: 5 },
  { id: 5, transaction_code: 'XK-2026-043', transaction_type: 'export', warehouse: { name: 'Kho HCM' }, created_at: '2026-06-08T16:45:00Z', items_count: 4 },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const onNavigate = (path) => navigate(path)
  const [dashStats, setDashStats] = useState(null)
  const [recentTx, setRecentTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      setLoading(true)
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
      if (!token) {
        setDashStats(DEMO_STATS)
        setRecentTx(DEMO_TX)
        setIsDemoMode(true)
        setLoading(false)
        return
      }

      try {
        const [productRes, txRes] = await Promise.allSettled([
          api.get('/products/?page_size=1000', { signal: controller.signal }),
          api.get('/stock-transactions/?ordering=-created_at&page_size=5', { signal: controller.signal }),
        ])

        // Xử lý stats sản phẩm
        if (productRes.status === 'fulfilled') {
          const data = productRes.value.data
          const products = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : [])
          const totalValue = products.reduce((s, p) => s + Number(p.price || p.selling_price || 0) * Number(p.quantity || 0), 0)
          const outOfStock = products.filter((p) => Number(p.quantity || 0) === 0).length
          const lowStock = products.filter((p) => Number(p.quantity || 0) > 0 && Number(p.quantity || 0) <= 5).length
          setDashStats({ totalProducts: data.count ?? products.length, outOfStock, lowStock, totalValue })
        } else {
          setDashStats(DEMO_STATS)
          setIsDemoMode(true)
        }

        // Xử lý giao dịch gần đây
        if (txRes.status === 'fulfilled') {
          const txData = txRes.value.data
          setRecentTx(Array.isArray(txData.results) ? txData.results : (Array.isArray(txData) ? txData : []))
        } else {
          setRecentTx(DEMO_TX)
          setIsDemoMode(true)
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        setDashStats(DEMO_STATS)
        setRecentTx(DEMO_TX)
        setIsDemoMode(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    return () => controller.abort()
  }, [])

  const statCards = [
    {
      key: 'totalProducts',
      label: 'Tổng sản phẩm',
      value: dashStats?.totalProducts ?? '—',
      color: 'blue',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      key: 'lowStock',
      label: 'Sắp hết hàng',
      value: dashStats?.lowStock ?? '—',
      color: 'amber',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      key: 'outOfStock',
      label: 'Hết hàng',
      value: dashStats?.outOfStock ?? '—',
      color: 'red',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
    },
    {
      key: 'totalValue',
      label: 'Giá trị tồn kho',
      value: formatCurrency(dashStats?.totalValue || 0),
      color: 'green',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ]

  return (
    <div className="dashboard-page">
      {/* Banner */}
      <section className="db-banner">
        <div className="db-banner-copy">
          <span className="db-eyebrow">Product Management System</span>
          <h2>Tổng quan hệ thống</h2>
          <p>Theo dõi hàng tồn kho, nhập xuất hàng và các giao dịch kho mới nhất từ một nơi duy nhất.</p>
        </div>
        <div className="db-banner-visual" aria-hidden="true">
          <svg width="110" height="110" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="56" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
            <rect x="30" y="48" width="60" height="38" rx="6" fill="#2563eb" opacity="0.9" />
            <rect x="30" y="34" width="60" height="16" rx="6" fill="#1d4ed8" />
            <rect x="38" y="58" width="14" height="18" rx="2" fill="#93c5fd" />
            <rect x="56" y="58" width="14" height="18" rx="2" fill="#93c5fd" />
            <rect x="74" y="58" width="8" height="18" rx="2" fill="#93c5fd" />
            <circle cx="60" cy="42" r="4" fill="#60a5fa" />
          </svg>
        </div>
      </section>

      {isDemoMode && (
        <div className="db-notice">
          📊 Đang hiển thị dữ liệu mẫu. Đăng nhập để xem số liệu thực từ hệ thống.
        </div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="db-loading">
          <div className="db-spinner" aria-label="Đang tải" />
          <span>Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="db-stats-grid">
          {statCards.map((card) => (
            <article className={`db-stat-card color-${card.color}`} key={card.key}>
              <div className="db-stat-icon">{card.icon}</div>
              <div className="db-stat-body">
                <span className="db-stat-label">{card.label}</span>
                <strong className="db-stat-value">{card.value}</strong>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="db-bottom-grid">
        {/* Giao dịch gần đây */}
        <section className="db-card db-transactions">
          <div className="db-card-header">
            <h3>Giao dịch kho gần đây</h3>
            <button type="button" className="db-link-btn" onClick={() => onNavigate('transaction-history')}>
              Xem tất cả →
            </button>
          </div>

          {recentTx.length === 0 ? (
            <div className="db-empty">
              <span>📋</span>
              <p>Chưa có giao dịch nào.</p>
            </div>
          ) : (
            <ul className="db-tx-list">
              {recentTx.map((tx) => (
                <li key={tx.id} className="db-tx-item">
                  <span className={`db-tx-badge ${TX_TYPE_CLASS[tx.transaction_type] || ''}`}>
                    {TX_TYPE_LABEL[tx.transaction_type] || tx.transaction_type}
                  </span>
                  <div className="db-tx-info">
                    <strong>{tx.transaction_code}</strong>
                    <span>{tx.warehouse?.name || '—'}</span>
                  </div>
                  <div className="db-tx-meta">
                    {tx.items_count != null && (
                      <span className="db-tx-items">{tx.items_count} sản phẩm</span>
                    )}
                    <time className="db-tx-time">{formatDate(tx.created_at)}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Truy cập nhanh */}
        <section className="db-card db-quick">
          <div className="db-card-header">
            <h3>Truy cập nhanh</h3>
          </div>
          <div className="db-quick-grid">
            {quickLinks.map((link) => (
              <button
                key={link.key}
                type="button"
                className="db-quick-card"
                onClick={() => onNavigate(link.key)}
              >
                <span className="db-quick-icon">{link.icon}</span>
                <div>
                  <strong>{link.label}</strong>
                  <p>{link.desc}</p>
                </div>
                <svg className="db-quick-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
