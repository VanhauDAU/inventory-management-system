import { useState, useCallback, useEffect } from 'react'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import ProductListPage from './pages/products/ProductListPage'
import CategoryPage from './pages/categories/CategoryPage'
import SupplierPage from './pages/suppliers/SupplierPage'
import WarehousePage from './pages/warehouses/WarehousePage'
import StockTransactionPage from './pages/stock-transactions/StockTransactionPage'
import UserManagementPage from './pages/system/UserManagementPage'
import RoleManagementPage from './pages/system/RoleManagementPage'
import PlaceholderPage from './components/common/PlaceholderPage'
import LoginPage from './pages/LoginPage'
import api from './services/api'
import { canAccessPage } from './utils/permissions'

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

function getStoredCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('current_user') || 'null')
  } catch {
    localStorage.removeItem('current_user')
    return null
  }
}

// ── Map pageKey -> component ──────────────────────────────────────────────────
function renderPage(pageKey, { onNavigate, stats, onStatsChange, onLogout, currentUser, authReady }) {
  if (!canAccessPage(currentUser, pageKey)) {
    if (!authReady && pageKey !== 'home') {
      return <PlaceholderPage title="Đang kiểm tra quyền" description="Hệ thống đang đồng bộ quyền truy cập của tài khoản." icon="⏳" />
    }

    return <PlaceholderPage title="Không có quyền truy cập" description="Tài khoản của bạn chưa được cấp quyền sử dụng chức năng này." icon="🔒" />
  }

  switch (pageKey) {
    case 'home':
      return <HomePage stats={stats} onStatsChange={onStatsChange} onNavigate={onNavigate} />

    case 'product-list':
      return <ProductListPage onStatsChange={onStatsChange} />

    case 'product-add':
      return <ProductListPage onStatsChange={onStatsChange} />

    case 'product-categories':
      return <CategoryPage />

    case 'product-suppliers':
      return <SupplierPage />

    case 'warehouse-list':
      return <WarehousePage />

    case 'warehouse-by-product':
      return <PlaceholderPage title="Tồn kho theo sản phẩm" description="Xem số lượng tồn kho của từng sản phẩm trên tất cả kho." icon="📦" />

    case 'warehouse-by-location':
      return <PlaceholderPage title="Tồn kho theo kho" description="Xem tổng hợp hàng hóa đang có tại từng kho." icon="📍" />

    case 'import-orders':
      return <StockTransactionPage transactionType="import" />

    case 'export-orders':
      return <StockTransactionPage transactionType="export" />

    case 'adjustment-orders':
      return <StockTransactionPage transactionType="adjustment" />

    case 'transaction-history':
      return <StockTransactionPage transactionType="all" />

    case 'report-overview':
      return <PlaceholderPage title="Tổng quan tồn kho" description="Báo cáo tổng hợp về tình hình tồn kho hiện tại." icon="📊" />

    case 'report-low-stock':
      return <PlaceholderPage title="Sản phẩm sắp hết hàng" description="Danh sách các sản phẩm có số lượng tồn kho thấp cần nhập thêm." icon="⚠️" />

    case 'report-value':
      return <PlaceholderPage title="Giá trị tồn kho" description="Báo cáo giá trị tổng tồn kho theo danh mục và thời gian." icon="💰" />

    case 'system-users':
      return <UserManagementPage />

    case 'system-roles':
      return <RoleManagementPage />

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
  const [currentUser, setCurrentUser] = useState(() => getStoredCurrentUser())
  const [authReady, setAuthReady] = useState(false)

  const handleStatsChange = useCallback((newStats) => {
    setStats(newStats)
    setIsDemoMode(false) // Khi nhận được stats từ API thật → tắt demo mode
  }, [])

  // Gọi khi đăng nhập thành công (LoginPage sẽ gọi hàm này)
  function handleLogin() {
    localStorage.removeItem('current_user')
    setIsLoggedIn(true)
    setIsDemoMode(!checkAuth())
    setActivePage('home')
    setCurrentUser(null)
    setAuthReady(false)
  }

  // Gọi khi đăng xuất
  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('current_user')
    localStorage.removeItem('current_username')
    setIsLoggedIn(false)
    setActivePage('home')
    setStats(null)
    setCurrentUser(null)
    setAuthReady(false)
    setIsDemoMode(true)
  }

  useEffect(() => {
    if (!isLoggedIn) return

    const controller = new AbortController()
    setAuthReady(false)

    api.get('/me/', { signal: controller.signal })
      .then((response) => {
        setCurrentUser(response.data)
        localStorage.setItem('current_user', JSON.stringify(response.data))
      })
      .catch((error) => {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return
        setCurrentUser(getStoredCurrentUser())
      })
      .finally(() => {
        if (!controller.signal.aborted) setAuthReady(true)
      })

    return () => controller.abort()
  }, [isLoggedIn])

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
      currentUser={currentUser}
      authReady={authReady}
    >
      {renderPage(activePage, {
        onNavigate: setActivePage,
        stats,
        onStatsChange: handleStatsChange,
        onLogout: handleLogout,
        currentUser,
        authReady,
      })}
    </AppLayout>
  )
}
