import { NavLink, useNavigate } from 'react-router-dom'
import { sidebarMenus } from '../../router/sidebarMenus'
import SidebarGroup from './SidebarGroup'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose, onLogout }) {
  const navigate = useNavigate()

  function handleNavigate() {
    onClose?.()
  }

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refresh_token')
    onLogout?.()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
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
        {sidebarMenus.map((menu) => {
          // Mục đơn (không có children)
          if (!menu.children) {
            return (
              <NavLink
                key={menu.path}
                to={menu.path}
                className={({ isActive }) =>
                  `sidebar-item sidebar-single${isActive ? ' active' : ''}`
                }
                onClick={handleNavigate}
              >
                <span className="sidebar-item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
                <span className="sidebar-item-label">{menu.label}</span>
              </NavLink>
            )
          }

          // Nhóm có children
          return (
            <SidebarGroup
              key={menu.label}
              group={menu}
              onNavigate={handleNavigate}
            />
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">AD</div>
          <div className="sidebar-user-info">
            <strong>Admin</strong>
            <span>Quản trị viên</span>
          </div>
        </div>
        <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
