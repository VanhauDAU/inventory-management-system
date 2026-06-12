import { useEffect, useState } from 'react'
import api from '../../services/api'
import './WarehousePage.css'

const DEMO_WAREHOUSES = [
  { id: 1, name: 'Kho Hà Nội' },
  { id: 2, name: 'Kho TP.HCM' },
  { id: 3, name: 'Kho Đà Nẵng' },
]

const DEMO_PRODUCTS = [
  { id: 1, name: 'Laptop Dell Latitude 5420', quantity: 5, warehouse_id: 1 },
  { id: 2, name: 'Bàn phím cơ Keychron K2', quantity: 10, warehouse_id: 1 },
  { id: 3, name: 'Chuột Logitech MX Master 3S', quantity: 3, warehouse_id: 2 },
  { id: 4, name: 'Ổ cứng SSD Samsung 1TB', quantity: 2, warehouse_id: 2 },
  { id: 5, name: 'USB-C Hub 7 in 1', quantity: 0, warehouse_id: 3 },
]

export default function InventoryByWarehousePage() {
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')

  useEffect(() => {
    const controller = new AbortController()
    async function fetchAll() {
      setLoading(true)
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
      if (!token) {
        setWarehouses(DEMO_WAREHOUSES); setProducts(DEMO_PRODUCTS)
        setIsDemoMode(true); setLoading(false); return
      }
      try {
        const [whRes, prodRes] = await Promise.allSettled([
          api.get('/warehouses/', { signal: controller.signal }),
          api.get('/products/?page_size=1000', { signal: controller.signal }),
        ])
        const whData = whRes.status === 'fulfilled' ? whRes.value.data : []
        const prodData = prodRes.status === 'fulfilled' ? prodRes.value.data : []
        setWarehouses(Array.isArray(whData.results) ? whData.results : (Array.isArray(whData) ? whData : []))
        setProducts(Array.isArray(prodData.results) ? prodData.results : (Array.isArray(prodData) ? prodData : []))
        setIsDemoMode(false)
      } catch {
        setWarehouses(DEMO_WAREHOUSES); setProducts(DEMO_PRODUCTS); setIsDemoMode(true)
      } finally { setLoading(false) }
    }
    fetchAll()
    return () => controller.abort()
  }, [])

  // Nhóm sản phẩm theo kho (nếu có warehouse_id)
  const warehousesWithProducts = warehouses.map((w) => ({
    ...w,
    items: products.filter((p) => p.warehouse_id === w.id || !p.warehouse_id),
  }))

  const displayWarehouses = selectedWarehouse === 'all'
    ? warehousesWithProducts
    : warehousesWithProducts.filter((w) => String(w.id) === selectedWarehouse)

  return (
    <div className="inv-page">
      <div className="inv-header">
        <h2>Tồn kho theo kho hàng</h2>
        <p>Xem tổng hợp hàng hóa đang có tại từng kho</p>
      </div>

      {isDemoMode && <div className="inv-notice info">📋 Đang hiển thị dữ liệu mẫu.</div>}

      {/* Filter kho */}
      <div className="inv-search-bar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" /><path d="M1 4h22v5H1z" />
        </svg>
        <select
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          style={{ background: 'transparent', border: 'none', outline: 'none', font: 'inherit', fontSize: '0.875rem', color: '#334155', flex: 1, cursor: 'pointer' }}
        >
          <option value="all">Tất cả kho hàng</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="inv-card"><div className="inv-state"><div className="inv-spinner" /><span>Đang tải...</span></div></div>
      ) : (
        displayWarehouses.map((warehouse) => (
          <div key={warehouse.id} className="inv-card" style={{ marginBottom: 0 }}>
            <div className="inv-wh-title">
              <span>🏬</span>
              <strong>{warehouse.name}</strong>
              <span className={`wh-status ${warehouse.is_active !== false ? 'active' : 'inactive'}`}>
                {warehouse.is_active !== false ? 'Hoạt động' : 'Ngừng'}
              </span>
              <span className="inv-wh-count">{products.length} sản phẩm</span>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Tên sản phẩm</th>
                    <th>Số lượng tồn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>Kho trống</td></tr>
                  ) : (
                    products.map((p) => {
                      const q = Number(p.quantity || 0)
                      const cls = q === 0 ? 'danger' : q <= 5 ? 'warning' : 'success'
                      const label = q === 0 ? 'Hết hàng' : q <= 5 ? 'Sắp hết' : 'Còn hàng'
                      return (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td><span className={`inv-qty ${cls}`}>{q}</span></td>
                          <td><span className={`inv-pill ${cls}`}>{label}</span></td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
