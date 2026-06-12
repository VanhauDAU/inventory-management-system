import { NavLink } from 'react-router-dom'
import './Sidebar.css'

export default function SidebarItem({ label, path, onClick }) {
  return (
    <li role="listitem">
      <NavLink
        to={path}
        className={({ isActive }) =>
          `sidebar-subitem${isActive ? ' active' : ''}`
        }
        onClick={onClick}
      >
        <span className="subitem-dot" aria-hidden="true" />
        {label}
      </NavLink>
    </li>
  )
}
