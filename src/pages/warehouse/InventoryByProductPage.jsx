import { useEffect, useState } from 'react'
import api from '../../services/api'
import './WarehousePage.css'

const DEMO_DATA = [
  { id: 1, name: 'Laptop Dell Latitude 5420', sku: 'DELL-LAT-5420', category_name: 'Thiết bị công nghệ', quantity: 8, minimum_stock: 3 },
  { id: 2, name: 'Bàn phím cơ Keychron K2', sku: 'KEY-K2', category_name: 'Phụ kiện máy tính', quantity: 15, minimum_stock: 5 },
  { id: 3, name: 'Chuột Logitech MX Master 3S', sku: 'LOG-MX3S', category_name: 'Phụ kiện máy tính', quantity: 3, minimum_stock: 5 },
  { id: 4, name: 'Ổ cứng SSD Samsung 1TB', sku: 'SAM-SSD-1T', category_name: 'Thiết bị lưu trữ', quantity: 0, minimum_stock: 2 },
  { id: 5, name: 'USB-C Hub 7 in 1', sku: 'HUB-7IN1', category_name: 'Phụ kiện máy tính', quantity: 5, minimum_stock: 5 },
]

function getStockStatus(qty, min) {
  const q = Number(qty || 0)
  const m = Number(min || 0)
  if (q === 0) return { label: 'Hết hàng', cls: 'danger' }
  if (q <= m || q <= 5) return { label: 'Sắp hết', cls: 'warning' }
  return { label: 'Còn hàng', cls: 'success' }
}

export default function InventoryByProductPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function fetch() {
      setLoading(true)
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
      if (!token) { setProducts(DEMO_DATA); setIsDemoMode(true); setLoading(false); return }
      try {
        const res = await api.get('/products/?page_size=1000', { signal: controller.signal })
        const data = res.data
        setProducts(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []))
        setIsDemoMode(false)
      } catch {
        setProducts(DEMO_DATA); setIsDemoMode(true)
      } finally { setLoading(false) }
    }
    fetch()
    return () => controller.abort()
  }, [])

  const filtered = products.filter((p) =>
    !search.trim() || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="inv-page">
      <div className="inv-header">
        <h2>Tồn kho theo sản phẩm</h2>
        <p>Xem số lượng tồn kho hiện tại của từng sản phẩm</p>
      </div>

      {isDemoMode && <div className="inv-notice info">📋 Đang hiển thị dữ liệu mẫu.</div>}

      {/* Search */}
      <div className="inv-search-bar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc SKU..."
        />
      </div>

      <div className="inv-card">
        {loading ? (
          <div className="inv-state"><div className="inv-spinner" /><span>Đang tải...</span></div>
        ) : filtered.length === 0 ? (
          <div className="inv-state"><span style={{ fontSize: '2rem' }}>🔍</span><p>Không tìm thấy sản phẩm phù hợp.</p></div>
        ) : (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên sản phẩm</th>
                  <th>SKU</th>
                  <th>Danh mục</th>
                  <th>Số lượng tồn</th>
                  <th>Tồn tối thiểu</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const status = getStockStatus(p.quantity, p.minimum_stock)
                  return (
                    <tr key={p.id}>
                      <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{idx + 1}</td>
                      <td><strong>{p.name}</strong></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#64748b' }}>{p.sku || '—'}</td>
                      <td>{p.category_name || p.category_detail?.name || '—'}</td>
                      <td><span className={`inv-qty ${status.cls}`}>{p.quantity}</span></td>
                      <td style={{ color: '#64748b' }}>{p.minimum_stock ?? '—'}</td>
                      <td><span className={`inv-pill ${status.cls}`}>{status.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
