import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './services/authService'
import LoginPage from './pages/LoginPage'
import ProductCRUDPage from './pages/ProductCRUDPage'

// Route bảo vệ - chưa đăng nhập thì về login
function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <ProductCRUDPage />
            </PrivateRoute>
          }
        />
        {/* Mặc định về login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
