import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/sidebar/Sidebar'
import Topbar from '../components/header/Topbar'
import './AppLayout.css'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function closeSidebar() {
    setSidebarOpen(false)
  }

  return (
    <div className="app-layout">
      {/* Overlay backdrop khi mở drawer trên mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          role="presentation"
          onClick={closeSidebar}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="app-main">
        <Topbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
