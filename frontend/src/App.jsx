import { useState, useCallback } from 'react'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import ProductListPage from './pages/products/ProductListPage'
import CategoryPage from './pages/categories/CategoryPage'
import PlaceholderPage from './components/common/PlaceholderPage'
import LoginPage from './pages/LoginPage'

// ─────────────────────────────────────────────────────────────────────────────
// HƯỚNG DẪN TÍCH HỢP VỚI BRANCH feature/frontend-ui (module đăng nhập)
//
// Khi merge branch đăng nhập vào, làm 3 việc:
//
// 1. Bỏ comment dòng import bên dưới, sửa đường dẫn cho đúng với file
//    LoginPage của thành viên kia (thường là LoginPage.jsx hoặc Login.jsx)
//
//    import LoginPage from './pages/auth/LoginPage'
//
// 2. Thay hàm checkAuth() bên dưới bằng cách kiểm tra token thật nếu cần.
//    Hiện tại đang đọc từ localStorage — phù hợp với SimpleJWT của backend.
//
// 3. Truyền prop onLogin và onLogout đúng tên mà LoginPage của bạn kia expect.
//    Xem phần <LoginPage> bên dưới.
// ─────────────────────────────────────────────────────────────────────────────

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Kiểm tra token còn trong localStorage không
function checkAuth() {
  return !!(
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken')
  )
}

// ── Map pageKey -> component ──────────────────────────────────────────────────
function renderPage(pageKey, { onNavigate, stats, onStatsChange, onLogout }) {
  switch (pageKey) {
    case 'home':
      return <HomePage stats={stats} onNavigate={onNavigate} />

    case 'product-list':
      return <ProductListPage onStatsChange={onStatsChange} />

    case 'product-add':
      return <ProductListPage onStatsChange={onStatsChange} />

    case 'product-categories':
      return <CategoryPage />

    case 'product-suppliers':
      return <PlaceholderPage title="Nhà phân phối" description="Danh sách và thông tin các nhà phân phối sản phẩm." icon="🏭" />

    case 'warehouse-list':
      return <PlaceholderPage title="Danh sách kho" description="Quản lý các kho hàng: vị trí, sức chứa, trạng thái." icon="🏬" />

    case 'warehouse-by-product':
      return <PlaceholderPage title="Tồn kho theo sản phẩm" description="Xem số lượng tồn kho của từng sản phẩm trên tất cả kho." icon="📦" />

    case 'warehouse-by-location':
      return <PlaceholderPage title="Tồn kho theo kho" description="Xem tổng hợp hàng hóa đang có tại từng kho." icon="📍" />

    case 'import-orders':
      return <PlaceholderPage title="Phiếu nhập kho" description="Tạo và quản lý các phiếu nhập hàng vào kho." icon="📥" />

    case 'export-orders':
      return <PlaceholderPage title="Phiếu xuất kho" description="Tạo và quản lý các phiếu xuất hàng ra khỏi kho." icon="📤" />

    case 'adjustment-orders':
      return <PlaceholderPage title="Phiếu điều chỉnh kho" description="Điều chỉnh số lượng tồn kho khi kiểm kê phát sinh chênh lệch." icon="🔧" />

    case 'transaction-history':
      return <PlaceholderPage title="Lịch sử giao dịch kho" description="Xem toàn bộ lịch sử nhập, xuất, điều chỉnh theo thời gian." icon="📋" />

    case 'report-overview':
      return <PlaceholderPage title="Tổng quan tồn kho" description="Báo cáo tổng hợp về tình hình tồn kho hiện tại." icon="📊" />

    case 'report-low-stock':
      return <PlaceholderPage title="Sản phẩm sắp hết hàng" description="Danh sách các sản phẩm có số lượng tồn kho thấp cần nhập thêm." icon="⚠️" />

    case 'report-value':
      return <PlaceholderPage title="Giá trị tồn kho" description="Báo cáo giá trị tổng tồn kho theo danh mục và thời gian." icon="💰" />

    case 'system-users':
      return <PlaceholderPage title="Người dùng" description="Quản lý tài khoản người dùng trong hệ thống." icon="👤" />

    case 'system-roles':
      return <PlaceholderPage title="Nhóm quyền" description="Phân quyền theo nhóm: admin, nhân viên kho, kế toán..." icon="🔑" />

    // Khi bấm Đăng xuất: xóa token và về trang login
    case 'system-logout':
      onLogout()
      return null

    default:
      return <PlaceholderPage title="Trang không tồn tại" description="Không tìm thấy trang yêu cầu." icon="🔍" />
  }
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  // isLoggedIn: đọc từ localStorage để giữ trạng thái sau refresh
  const [isLoggedIn, setIsLoggedIn] = useState(checkAuth)
  const [activePage, setActivePage] = useState('home')
  const [isDemoMode, setIsDemoMode] = useState(!checkAuth())
  const [stats, setStats] = useState(null)

  const handleStatsChange = useCallback((newStats) => {
    setStats(newStats)
    setIsDemoMode(false) // Khi nhận được stats từ API thật → tắt demo mode
  }, [])

  // Gọi khi đăng nhập thành công (LoginPage sẽ gọi hàm này)
  function handleLogin() {
    setIsLoggedIn(true)
    setIsDemoMode(!checkAuth())
    setActivePage('home')
  }

  // Gọi khi đăng xuất
  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refresh_token')
    setIsLoggedIn(false)
    setActivePage('home')
    setStats(null)
    setIsDemoMode(true)
  }

  // ── Chưa đăng nhập → hiển thị LoginPage ────────────────────────────────────
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  // ── Đã đăng nhập → hiển thị layout chính ───────────────────────────────────
  return (
    <AppLayout
      activePage={activePage}
      onNavigate={setActivePage}
      isDemoMode={isDemoMode}
      apiUrl={apiUrl}
    >
      {renderPage(activePage, {
        onNavigate: setActivePage,
        stats,
        onStatsChange: handleStatsChange,
        onLogout: handleLogout,
      })}
    </AppLayout>
  )
}
