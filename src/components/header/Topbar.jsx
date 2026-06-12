import { useLocation } from 'react-router-dom'
import './Topbar.css'

const routeMeta = {
  '/dashboard': { title: 'Trang chủ', group: '' },
  '/products': { title: 'Danh sách sản phẩm', group: 'Quản lý sản phẩm' },
  '/products/create': { title: 'Thêm sản phẩm', group: 'Quản lý sản phẩm' },
  '/categories': { title: 'Danh mục sản phẩm', group: 'Quản lý sản phẩm' },
  '/suppliers': { title: 'Nhà phân phối', group: 'Quản lý sản phẩm' },
  '/warehouses': { title: 'Danh sách kho', group: 'Quản lý kho hàng' },
  '/inventory/products': { title: 'Tồn kho theo sản phẩm', group: 'Quản lý kho hàng' },
  '/inventory/warehouses': { title: 'Tồn kho theo kho', group: 'Quản lý kho hàng' },
  '/stock/imports': { title: 'Phiếu nhập kho', group: 'Nhập / xuất kho' },
  '/stock/exports': { title: 'Phiếu xuất kho', group: 'Nhập / xuất kho' },
  '/stock/adjustments': { title: 'Phiếu điều chỉnh kho', group: 'Nhập / xuất kho' },
  '/stock/transactions': { title: 'Lịch sử giao dịch kho', group: 'Nhập / xuất kho' },
  '/reports/inventory': { title: 'Tổng quan tồn kho', group: 'Báo cáo' },
  '/reports/low-stock': { title: 'Sản phẩm sắp hết hàng', group: 'Báo cáo' },
  '/reports/inventory-value': { title: 'Giá trị tồn kho', group: 'Báo cáo' },
}

export default function Topbar({ onMenuToggle }) {
  const location = useLocation()
  const meta = routeMeta[location.pathname] || { title: 'ProductMS', group: '' }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
  const hasToken = !!(localStorage.getItem('access_token') || localStorage.getItem('accessToken'))

  return (
    <header className="topbar">
      <button type="button" className="topbar-menu-btn" onClick={onMenuToggle} aria-label="Mở menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="topbar-title">
        {meta.group && (
          <span className="topbar-breadcrumb">
            {meta.group}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        )}
        <h1 className="topbar-page-title">{meta.title}</h1>
      </div>

      <div className="topbar-actions">
        <span className={`topbar-mode-chip${hasToken ? ' api' : ' demo'}`}>
          <span className="mode-dot" aria-hidden="true" />
          {hasToken ? 'API data' : 'Demo data'}
        </span>

        <code className="topbar-api-url" title={apiUrl}>{apiUrl}</code>

        <button type="button" className="topbar-icon-btn" aria-label="Thông báo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <div className="topbar-user">
          <div className="topbar-user-avatar">AD</div>
        </div>
      </div>
    </header>
  )
}
