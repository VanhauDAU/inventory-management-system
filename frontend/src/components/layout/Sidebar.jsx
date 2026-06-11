import { useState } from 'react'
import './Sidebar.css'

// Cấu trúc menu nhóm theo nghiệp vụ
const menuGroups = [
  {
    key: 'home',
    label: 'Trang chủ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    single: true,
    pageKey: 'home',
  },
  {
    key: 'products',
    label: 'Quản lý sản phẩm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    children: [
      { key: 'product-list', label: 'Danh sách sản phẩm' },
      { key: 'product-categories', label: 'Danh mục sản phẩm' },
      { key: 'product-suppliers', label: 'Nhà phân phối' },
    ],
  },
  {
    key: 'warehouse',
    label: 'Quản lý kho hàng',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
        <path d="M1 4h22v5H1z" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
    children: [
      { key: 'warehouse-list', label: 'Danh sách kho' },
      { key: 'warehouse-by-product', label: 'Tồn kho theo sản phẩm' },
      { key: 'warehouse-by-location', label: 'Tồn kho theo kho' },
    ],
  },
  {
    key: 'transactions',
    label: 'Nhập / xuất kho',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    children: [
      { key: 'import-orders', label: 'Phiếu nhập kho' },
      { key: 'export-orders', label: 'Phiếu xuất kho' },
      { key: 'adjustment-orders', label: 'Phiếu điều chỉnh kho' },
      { key: 'transaction-history', label: 'Lịch sử giao dịch kho' },
    ],
  },
  {
    key: 'reports',
    label: 'Báo cáo',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
    children: [
      { key: 'report-overview', label: 'Tổng quan tồn kho' },
      { key: 'report-low-stock', label: 'Sản phẩm sắp hết hàng' },
      { key: 'report-value', label: 'Giá trị tồn kho' },
    ],
  },
  {
    key: 'system',
    label: 'Hệ thống',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    children: [
      { key: 'system-users', label: 'Người dùng' },
      { key: 'system-roles', label: 'Nhóm quyền' },
      { key: 'system-logout', label: 'Đăng xuất', danger: true },
    ],
  },
]

export default function Sidebar({ activePage, onNavigate }) {
  // Tìm group đang active để mở sẵn
  const findActiveGroup = () => {
    for (const group of menuGroups) {
      if (group.single && group.pageKey === activePage) return null
      if (group.children?.some((child) => child.key === activePage)) return group.key
    }
    return null
  }

  const [openGroups, setOpenGroups] = useState(() => {
    const active = findActiveGroup()
    return active ? { [active]: true } : {}
  })

  function toggleGroup(key) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

function handleNavigate(pageKey) {
    onNavigate(pageKey)
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="10" y1="14" x2="14" y2="14" />
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <strong>ProductMS</strong>
          <span>Quản lý kho hàng</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" aria-label="Navigation chính">
        {menuGroups.map((group) => {
          // Mục đơn (Trang chủ)
          if (group.single) {
            const isActive = activePage === group.pageKey
            return (
              <button
                key={group.key}
                type="button"
                className={`sidebar-item sidebar-single${isActive ? ' active' : ''}`}
                onClick={() => handleNavigate(group.pageKey)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="sidebar-item-icon">{group.icon}</span>
                <span className="sidebar-item-label">{group.label}</span>
              </button>
            )
          }

          // Nhóm có menu con
          const isGroupOpen = !!openGroups[group.key]
          const hasActiveChild = group.children?.some((child) => child.key === activePage)

          return (
            <div key={group.key} className={`sidebar-group${hasActiveChild ? ' has-active' : ''}`}>
              <button
                type="button"
                className={`sidebar-item sidebar-group-toggle${isGroupOpen ? ' open' : ''}${hasActiveChild ? ' active' : ''}`}
                onClick={() => toggleGroup(group.key)}
                aria-expanded={isGroupOpen}
              >
                <span className="sidebar-item-icon">{group.icon}</span>
                <span className="sidebar-item-label">{group.label}</span>
                <span className={`sidebar-chevron${isGroupOpen ? ' rotated' : ''}`} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {isGroupOpen && (
                <ul className="sidebar-submenu" role="list">
                  {group.children.map((child) => {
                    const isActive = activePage === child.key
                    return (
                      <li key={child.key} role="listitem">
                        <button
                          type="button"
                          className={`sidebar-subitem${isActive ? ' active' : ''}${child.danger ? ' danger' : ''}`}
                          onClick={() => handleNavigate(child.key)}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <span className="subitem-dot" aria-hidden="true" />
                          {child.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {/* User card ở cuối sidebar */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">LN</div>
          <div className="sidebar-user-info">
            <strong>Lê Đình Nguyên</strong>
            <span>Frontend Developer</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
