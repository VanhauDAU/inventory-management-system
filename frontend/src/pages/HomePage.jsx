import './HomePage.css'

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0))

const summaryCards = [
  {
    key: 'products',
    label: 'Tổng sản phẩm',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    color: 'blue',
  },
  {
    key: 'quantity',
    label: 'Tổng tồn kho',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" /><path d="M1 4h22v5H1z" /><line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
    color: 'cyan',
  },
  {
    key: 'lowStock',
    label: 'Sắp hết hàng',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: 'amber',
  },
  {
    key: 'value',
    label: 'Giá trị tồn kho',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    color: 'green',
  },
]

const quickLinks = [
  { key: 'product-list', label: 'Danh sách sản phẩm', desc: 'Xem và quản lý toàn bộ sản phẩm', icon: '📦' },
  { key: 'product-categories', label: 'Danh mục sản phẩm', desc: 'Phân loại sản phẩm theo nhóm', icon: '🗂️' },
  { key: 'import-orders', label: 'Phiếu nhập kho', desc: 'Tạo và theo dõi phiếu nhập', icon: '📥' },
  { key: 'report-overview', label: 'Báo cáo tồn kho', desc: 'Thống kê tổng quan kho hàng', icon: '📊' },
]

export default function HomePage({ stats, onNavigate }) {
  return (
    <div className="home-page">
      {/* Welcome banner */}
      <section className="home-banner">
        <div className="home-banner-copy">
          <span className="home-eyebrow">Product Management System</span>
          <h2>Chào mừng trở lại!</h2>
          <p>Hệ thống quản lý sản phẩm và kho hàng. Theo dõi hàng tồn kho, nhập xuất hàng và báo cáo tổng quan từ một nơi duy nhất.</p>
        </div>
        <div className="home-banner-visual" aria-hidden="true">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
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

      {/* Summary cards */}
      <div className="home-stats-grid">
        {summaryCards.map((card) => {
          let displayValue
          if (card.key === 'value') displayValue = formatCurrency(stats?.totalValue || 0)
          else if (card.key === 'products') displayValue = stats?.totalProducts ?? '—'
          else if (card.key === 'quantity') displayValue = stats?.totalQuantity ?? '—'
          else if (card.key === 'lowStock') displayValue = stats?.lowStock ?? '—'

          return (
            <article className={`home-stat-card color-${card.color}`} key={card.key}>
              <div className="home-stat-icon">{card.icon}</div>
              <div className="home-stat-body">
                <span className="home-stat-label">{card.label}</span>
                <strong className="home-stat-value">{displayValue}</strong>
              </div>
            </article>
          )
        })}
      </div>

      {/* Quick links */}
      <section className="home-section">
        <h3 className="home-section-title">Truy cập nhanh</h3>
        <div className="home-quick-grid">
          {quickLinks.map((link) => (
            <button
              key={link.key}
              type="button"
              className="home-quick-card"
              onClick={() => onNavigate(link.key)}
            >
              <span className="home-quick-icon">{link.icon}</span>
              <div>
                <strong>{link.label}</strong>
                <p>{link.desc}</p>
              </div>
              <svg className="home-quick-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
