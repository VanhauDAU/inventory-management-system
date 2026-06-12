import './Topbar.css'

// Map pageKey -> tiêu đề hiển thị trên topbar
const pageTitles = {
  home: 'Trang chủ',
  'product-list': 'Danh sách sản phẩm',
  'product-add': 'Thêm sản phẩm',
  'product-categories': 'Danh mục sản phẩm',
  'product-suppliers': 'Nhà phân phối',
  'warehouse-list': 'Danh sách kho',
  'warehouse-by-product': 'Tồn kho theo sản phẩm',
  'warehouse-by-location': 'Tồn kho theo kho',
  'import-orders': 'Phiếu nhập kho',
  'export-orders': 'Phiếu xuất kho',
  'adjustment-orders': 'Phiếu điều chỉnh kho',
  'transaction-history': 'Lịch sử giao dịch kho',
  'report-overview': 'Tổng quan tồn kho',
  'report-low-stock': 'Sản phẩm sắp hết hàng',
  'report-value': 'Giá trị tồn kho',
  'system-users': 'Người dùng',
  'system-roles': 'Nhóm quyền',
  'system-logout': 'Đăng xuất',
}

const groupLabels = {
  home: '',
  'product-list': 'Quản lý sản phẩm',
  'product-add': 'Quản lý sản phẩm',
  'product-categories': 'Quản lý sản phẩm',
  'product-suppliers': 'Quản lý sản phẩm',
  'warehouse-list': 'Quản lý kho hàng',
  'warehouse-by-product': 'Quản lý kho hàng',
  'warehouse-by-location': 'Quản lý kho hàng',
  'import-orders': 'Nhập / xuất kho',
  'export-orders': 'Nhập / xuất kho',
  'adjustment-orders': 'Nhập / xuất kho',
  'transaction-history': 'Nhập / xuất kho',
  'report-overview': 'Báo cáo',
  'report-low-stock': 'Báo cáo',
  'report-value': 'Báo cáo',
  'system-users': 'Hệ thống',
  'system-roles': 'Hệ thống',
  'system-logout': 'Hệ thống',
}

export default function Topbar({ activePage, isDemoMode, apiUrl, onMenuToggle }) {
  const title = pageTitles[activePage] || 'Trang chủ'
  const group = groupLabels[activePage]

  return (
    <header className="topbar">
      {/* Nút mở sidebar trên mobile */}
      <button
        type="button"
        className="topbar-menu-btn"
        onClick={onMenuToggle}
        aria-label="Mở menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Breadcrumb + tiêu đề */}
      <div className="topbar-title">
        {group && (
          <span className="topbar-breadcrumb">
            {group}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        )}
        <h1 className="topbar-page-title">{title}</h1>
      </div>

      {/* Actions bên phải */}
      <div className="topbar-actions">
        <span className={`topbar-mode-chip${isDemoMode ? ' demo' : ' api'}`}>
          <span className="mode-dot" aria-hidden="true" />
          {isDemoMode ? 'Demo data' : 'API data'}
        </span>

        <code className="topbar-api-url" title={apiUrl}>
          {apiUrl}
        </code>

        <button type="button" className="topbar-icon-btn" aria-label="Thông báo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <div className="topbar-user">
          <div className="topbar-user-avatar">LN</div>
        </div>
      </div>
    </header>
  )
}
