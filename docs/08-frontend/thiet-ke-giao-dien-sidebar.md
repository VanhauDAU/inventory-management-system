# Thiết kế giao diện sidebar và bố cục quản trị

## 1. Mục tiêu

Thiết kế lại bố cục giao diện quản trị để hệ thống dễ mở rộng khi bổ sung các chức năng:

- Trang chủ
- Quản lý sản phẩm
- Quản lý danh mục sản phẩm
- Quản lý kho hàng
- Quản lý nhập/xuất kho
- Quản lý nhà phân phối
- Báo cáo tồn kho
- Quản lý người dùng và phân quyền

Giao diện nên có sidebar cố định bên trái, phần nội dung chính bên phải và các nhóm menu có thể bấm để mở danh sách mục con.

## 2. Bố cục tổng thể

```text
┌──────────────────────────────────────────────────────────────┐
│ App Layout                                                   │
├───────────────┬──────────────────────────────────────────────┤
│ Sidebar       │ Header                                       │
│               ├──────────────────────────────────────────────┤
│ Navigation    │ Page Content                                 │
│ Menu          │                                              │
│               │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

### Thành phần chính

```text
AppLayout
- Sidebar
- Topbar/Header
- MainContent
```

Ý nghĩa:

- `Sidebar`: chứa menu điều hướng.
- `Topbar`: hiển thị tiêu đề trang, thông tin người dùng, nút đăng xuất.
- `MainContent`: hiển thị nội dung từng trang như sản phẩm, danh mục, kho hàng.

## 3. Cấu trúc sidebar đề xuất

Không nên để tất cả mục ngang hàng vì khi hệ thống mở rộng sẽ rối. Nên nhóm theo nghiệp vụ.

```text
Trang chủ

Quản lý sản phẩm
  - Danh sách sản phẩm
  - Thêm sản phẩm
  - Danh mục sản phẩm
  - Nhà phân phối

Quản lý kho hàng
  - Danh sách kho
  - Tồn kho theo sản phẩm
  - Tồn kho theo kho

Nhập / xuất kho
  - Phiếu nhập kho
  - Phiếu xuất kho
  - Phiếu điều chỉnh kho
  - Lịch sử giao dịch kho

Báo cáo
  - Tổng quan tồn kho
  - Sản phẩm sắp hết hàng
  - Giá trị tồn kho

Hệ thống
  - Người dùng
  - Nhóm quyền
  - Đăng xuất
```

## 4. Menu sidebar chi tiết

### 4.1. Trang chủ

```text
Trang chủ
Route: /dashboard
```

Chức năng:

- Hiển thị tổng số sản phẩm.
- Hiển thị số sản phẩm sắp hết hàng.
- Hiển thị số sản phẩm hết hàng.
- Hiển thị tổng giá trị tồn kho.
- Hiển thị các giao dịch kho gần đây.

### 4.2. Quản lý sản phẩm

Nhóm này chứa các chức năng liên quan trực tiếp tới sản phẩm.

```text
Quản lý sản phẩm
  - Danh sách sản phẩm
  - Thêm sản phẩm
  - Danh mục sản phẩm
  - Nhà phân phối
```

Route đề xuất:

```text
/products
/products/create
/categories
/suppliers
```

Ý nghĩa:

- `Danh sách sản phẩm`: xem, tìm kiếm, lọc, sửa, xóa sản phẩm.
- `Thêm sản phẩm`: mở form tạo sản phẩm mới.
- `Danh mục sản phẩm`: quản lý category.
- `Nhà phân phối`: quản lý supplier/distributor.

### 4.3. Quản lý kho hàng

Nhóm này dùng để quản lý thông tin kho và số lượng tồn.

```text
Quản lý kho hàng
  - Danh sách kho
  - Tồn kho theo sản phẩm
  - Tồn kho theo kho
```

Route đề xuất:

```text
/warehouses
/inventory/products
/inventory/warehouses
```

Ý nghĩa:

- `Danh sách kho`: thêm, sửa, xóa kho hàng.
- `Tồn kho theo sản phẩm`: xem mỗi sản phẩm còn bao nhiêu.
- `Tồn kho theo kho`: xem từng kho đang có những sản phẩm nào.

### 4.4. Nhập / xuất kho

Đây là nhóm thao tác nghiệp vụ chính của phần kho.

```text
Nhập / xuất kho
  - Phiếu nhập kho
  - Phiếu xuất kho
  - Phiếu điều chỉnh kho
  - Lịch sử giao dịch kho
```

Route đề xuất:

```text
/stock/imports
/stock/exports
/stock/adjustments
/stock/transactions
```

Ý nghĩa:

- `Phiếu nhập kho`: tạo phiếu nhập nhiều sản phẩm vào một kho.
- `Phiếu xuất kho`: tạo phiếu xuất nhiều sản phẩm khỏi một kho.
- `Phiếu điều chỉnh kho`: chỉnh số lượng tồn khi kiểm kê sai lệch.
- `Lịch sử giao dịch kho`: xem tất cả phiếu nhập, xuất, điều chỉnh.

## 5. Bố cục màn hình sau khi có sidebar

### 5.1. Desktop

```text
┌──────────────────────────────────────────────────────────────┐
│ Sidebar 240px │ Header                                      │
│               ├──────────────────────────────────────────────┤
│               │ Nội dung trang                              │
│               │                                              │
│               │ Bảng dữ liệu, bộ lọc, form, modal            │
└───────────────┴──────────────────────────────────────────────┘
```

Kích thước đề xuất:

```text
Sidebar width: 240px
Header height: 64px
Main padding: 24px
Card border radius: 8px
Table min width: 860px
```

### 5.2. Mobile / Tablet

Trên màn hình nhỏ:

- Sidebar chuyển thành drawer.
- Có nút menu ở header.
- Khi chọn menu thì drawer tự đóng.
- Các bảng dữ liệu có thể scroll ngang.

## 6. Component frontend nên tạo

```text
frontend/src/layouts/
  AppLayout.jsx

frontend/src/components/sidebar/
  Sidebar.jsx
  SidebarGroup.jsx
  SidebarItem.jsx

frontend/src/components/header/
  Topbar.jsx

frontend/src/pages/
  DashboardPage.jsx
  ProductCRUDPage.jsx
  CategoryPage.jsx
  SupplierPage.jsx
  WarehousePage.jsx
  InventoryProductPage.jsx
  InventoryWarehousePage.jsx
  StockImportPage.jsx
  StockExportPage.jsx
  StockAdjustmentPage.jsx
  StockTransactionPage.jsx
```

## 7. Cấu trúc route đề xuất

```jsx
<Route path="/login" element={<LoginPage />} />

<Route
  path="/"
  element={
    <PrivateRoute>
      <AppLayout />
    </PrivateRoute>
  }
>
  <Route index element={<Navigate to="/dashboard" replace />} />
  <Route path="dashboard" element={<DashboardPage />} />

  <Route path="products" element={<ProductCRUDPage />} />
  <Route path="products/create" element={<ProductCreatePage />} />
  <Route path="categories" element={<CategoryPage />} />
  <Route path="suppliers" element={<SupplierPage />} />

  <Route path="warehouses" element={<WarehousePage />} />
  <Route path="inventory/products" element={<InventoryProductPage />} />
  <Route path="inventory/warehouses" element={<InventoryWarehousePage />} />

  <Route path="stock/imports" element={<StockImportPage />} />
  <Route path="stock/exports" element={<StockExportPage />} />
  <Route path="stock/adjustments" element={<StockAdjustmentPage />} />
  <Route path="stock/transactions" element={<StockTransactionPage />} />
</Route>
```

## 8. Dữ liệu menu sidebar đề xuất

Nên khai báo sidebar bằng mảng dữ liệu để dễ bảo trì.

```jsx
const sidebarMenus = [
  {
    label: 'Trang chủ',
    path: '/dashboard',
  },
  {
    label: 'Quản lý sản phẩm',
    children: [
      { label: 'Danh sách sản phẩm', path: '/products' },
      { label: 'Thêm sản phẩm', path: '/products/create' },
      { label: 'Danh mục sản phẩm', path: '/categories' },
      { label: 'Nhà phân phối', path: '/suppliers' },
    ],
  },
  {
    label: 'Quản lý kho hàng',
    children: [
      { label: 'Danh sách kho', path: '/warehouses' },
      { label: 'Tồn kho theo sản phẩm', path: '/inventory/products' },
      { label: 'Tồn kho theo kho', path: '/inventory/warehouses' },
    ],
  },
  {
    label: 'Nhập / xuất kho',
    children: [
      { label: 'Phiếu nhập kho', path: '/stock/imports' },
      { label: 'Phiếu xuất kho', path: '/stock/exports' },
      { label: 'Phiếu điều chỉnh kho', path: '/stock/adjustments' },
      { label: 'Lịch sử giao dịch kho', path: '/stock/transactions' },
    ],
  },
  {
    label: 'Báo cáo',
    children: [
      { label: 'Tổng quan tồn kho', path: '/reports/inventory' },
      { label: 'Sản phẩm sắp hết hàng', path: '/reports/low-stock' },
      { label: 'Giá trị tồn kho', path: '/reports/inventory-value' },
    ],
  },
]
```

## 9. Hành vi menu thả xuống

Khi người dùng click vào một nhóm menu:

- Nếu đang đóng thì mở ra.
- Nếu đang mở thì đóng lại.
- Nếu route hiện tại nằm trong nhóm đó, nhóm nên tự mở.
- Item đang active cần có màu nền khác.

Ví dụ:

```text
Click "Quản lý sản phẩm"
  -> mở các mục con:
     Danh sách sản phẩm
     Thêm sản phẩm
     Danh mục sản phẩm
     Nhà phân phối
```

## 10. Trạng thái active

Khi đang ở route:

```text
/products
```

Sidebar nên hiển thị:

```text
Quản lý sản phẩm: đang mở
Danh sách sản phẩm: active
```

Khi đang ở route:

```text
/stock/imports
```

Sidebar nên hiển thị:

```text
Nhập / xuất kho: đang mở
Phiếu nhập kho: active
```

## 11. Gợi ý giao diện sidebar

Màu sắc đề xuất:

```text
Sidebar background: #0f172a
Sidebar text: #cbd5e1
Sidebar active background: #2563eb
Sidebar active text: #ffffff
Sidebar hover background: #1e293b
Main background: #f8fafc
Border: #e2e8f0
```

Không nên dùng màu quá rực cho toàn bộ layout. Giao diện quản trị nên gọn, rõ, dễ nhìn bảng dữ liệu.

## 12. Ưu tiên triển khai

Nên làm theo thứ tự:

1. Tạo `AppLayout.jsx`.
2. Tạo `Sidebar.jsx`.
3. Chuyển `ProductCRUDPage.jsx` vào trong layout mới.
4. Thêm route `/dashboard`.
5. Thêm các route placeholder cho category, supplier, warehouse, stock.
6. Sau đó mới làm chi tiết từng màn CRUD.

## 13. Kết luận

Bố cục sidebar hợp lý nhất cho hệ thống này là nhóm theo nghiệp vụ:

```text
Trang chủ
Quản lý sản phẩm
Quản lý kho hàng
Nhập / xuất kho
Báo cáo
Hệ thống
```

Cách chia này giúp giao diện không bị dài, dễ mở rộng và phù hợp với hệ thống quản lý sản phẩm có tồn kho.
