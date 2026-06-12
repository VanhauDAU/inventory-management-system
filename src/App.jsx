import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import PrivateRoute from './router/PrivateRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'

// Pages
import DashboardPage from './pages/DashboardPage'
import ProductListPage from './pages/products/ProductListPage'
import ProductCreatePage from './pages/products/ProductCreatePage'
import CategoryPage from './pages/products/CategoryPage'
import SupplierPage from './pages/products/SupplierPage'
import WarehouseListPage from './pages/warehouse/WarehouseListPage'
import InventoryByProductPage from './pages/warehouse/InventoryByProductPage'
import InventoryByWarehousePage from './pages/warehouse/InventoryByWarehousePage'
import ImportOrderPage from './pages/stock/ImportOrderPage'
import ExportOrderPage from './pages/stock/ExportOrderPage'
import AdjustmentOrderPage from './pages/stock/AdjustmentOrderPage'
import TransactionHistoryPage from './pages/stock/TransactionHistoryPage'
import PlaceholderPage from './components/common/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage onLogin={() => window.location.replace('/dashboard')} />} />

        {/* Protected — tất cả nằm trong AppLayout */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Sản phẩm */}
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/create" element={<ProductCreatePage />} />
            <Route path="categories" element={<CategoryPage />} />
            <Route path="suppliers" element={<SupplierPage />} />

            {/* Kho hàng */}
            <Route path="warehouses" element={<WarehouseListPage />} />
            <Route path="inventory/products" element={<InventoryByProductPage />} />
            <Route path="inventory/warehouses" element={<InventoryByWarehousePage />} />

            {/* Nhập xuất kho */}
            <Route path="stock/imports" element={<ImportOrderPage />} />
            <Route path="stock/exports" element={<ExportOrderPage />} />
            <Route path="stock/adjustments" element={<AdjustmentOrderPage />} />
            <Route path="stock/transactions" element={<TransactionHistoryPage />} />

            {/* Báo cáo — placeholder */}
            <Route path="reports/inventory" element={<PlaceholderPage title="Tổng quan tồn kho" description="Báo cáo tổng hợp về tình hình tồn kho hiện tại." icon="📊" />} />
            <Route path="reports/low-stock" element={<PlaceholderPage title="Sản phẩm sắp hết hàng" description="Danh sách các sản phẩm có số lượng tồn kho thấp." icon="⚠️" />} />
            <Route path="reports/inventory-value" element={<PlaceholderPage title="Giá trị tồn kho" description="Báo cáo giá trị tổng tồn kho theo danh mục." icon="💰" />} />

            {/* Catch-all */}
            <Route path="*" element={<PlaceholderPage title="Trang không tồn tại" description="Không tìm thấy trang yêu cầu." icon="🔍" />} />
          </Route>
        </Route>

        {/* Redirect root về dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
