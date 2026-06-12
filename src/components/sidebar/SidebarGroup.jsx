import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import SidebarItem from './SidebarItem'
import './Sidebar.css'

const ICONS = {
  products: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  warehouse: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" /><path d="M1 4h22v5H1z" /><line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  stock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
}

export default function SidebarGroup({ group, onNavigate }) {
  const location = useLocation()

  // Tự mở nếu route hiện tại nằm trong nhóm này
  const isGroupActive = group.children?.some((child) =>
    location.pathname === child.path || location.pathname.startsWith(child.path + '/')
  )

  const [isOpen, setIsOpen] = useState(isGroupActive)

  function toggle() {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className={`sidebar-group${isGroupActive ? ' has-active' : ''}`}>
      <button
        type="button"
        className={`sidebar-item sidebar-group-toggle${isOpen ? ' open' : ''}${isGroupActive ? ' active' : ''}`}
        onClick={toggle}
        aria-expanded={isOpen}
      >
        <span className="sidebar-item-icon">{ICONS[group.icon]}</span>
        <span className="sidebar-item-label">{group.label}</span>
        <span className={`sidebar-chevron${isOpen ? ' rotated' : ''}`} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul className="sidebar-submenu" role="list">
          {group.children.map((child) => (
            <SidebarItem
              key={child.path}
              label={child.label}
              path={child.path}
              onClick={onNavigate}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
