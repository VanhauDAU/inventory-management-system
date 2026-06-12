export const sidebarMenus = [
  {
    label: 'Trang chủ',
    path: '/dashboard',
    icon: 'home',
  },
  {
    label: 'Quản lý sản phẩm',
    icon: 'products',
    children: [
      { label: 'Danh sách sản phẩm', path: '/products' },
      { label: 'Thêm sản phẩm', path: '/products/create' },
      { label: 'Danh mục sản phẩm', path: '/categories' },
      { label: 'Nhà phân phối', path: '/suppliers' },
    ],
  },
  {
    label: 'Quản lý kho hàng',
    icon: 'warehouse',
    children: [
      { label: 'Danh sách kho', path: '/warehouses' },
      { label: 'Tồn kho theo sản phẩm', path: '/inventory/products' },
      { label: 'Tồn kho theo kho', path: '/inventory/warehouses' },
    ],
  },
  {
    label: 'Nhập / xuất kho',
    icon: 'stock',
    children: [
      { label: 'Phiếu nhập kho', path: '/stock/imports' },
      { label: 'Phiếu xuất kho', path: '/stock/exports' },
      { label: 'Phiếu điều chỉnh kho', path: '/stock/adjustments' },
      { label: 'Lịch sử giao dịch kho', path: '/stock/transactions' },
    ],
  },
  {
    label: 'Báo cáo',
    icon: 'reports',
    children: [
      { label: 'Tổng quan tồn kho', path: '/reports/inventory' },
      { label: 'Sản phẩm sắp hết hàng', path: '/reports/low-stock' },
      { label: 'Giá trị tồn kho', path: '/reports/inventory-value' },
    ],
  },
]
