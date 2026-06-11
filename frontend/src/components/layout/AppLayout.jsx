import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './AppLayout.css'

export default function AppLayout({ activePage, onNavigate, isDemoMode, apiUrl, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleNavigate(pageKey) {
    onNavigate(pageKey)
    setSidebarOpen(false) // Đóng sidebar mobile sau khi chọn
  }

  return (
    <div className="app-layout">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          role="presentation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        className={sidebarOpen ? 'open' : ''}
      />

      <div className="app-main">
        <Topbar
          activePage={activePage}
          isDemoMode={isDemoMode}
          apiUrl={apiUrl}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  )
}
