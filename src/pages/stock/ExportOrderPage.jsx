import { useEffect, useState } from 'react'
import api from '../../services/api'
import './StockPage.css'

const PAGE_SIZE = 10
const DEMO_ORDERS = [
  { id: 1, transaction_code: 'XK-2026-001', warehouse: { name: 'Kho Hà Nội' }, reason: 'Xuất hàng cho khách', note: '', created_by_name: 'Admin', created_at: '2026-06-11T14:20:00Z', items: [{ product_name: 'Bàn phím Keychron', quantity: 2, unit_price: '2190000', total_amount: '4380000' }] },
  { id: 2, transaction_code: 'XK-2026-002', warehouse: { name: 'Kho TP.HCM' }, reason: 'Giao cho đại lý', note: '', created_by_name: 'Admin', created_at: '2026-06-09T16:00:00Z', items: [{ product_name: 'Chuột Logitech', quantity: 1, unit_price: '2450000', total_amount: '2450000' }] },
]

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v || 0))
const formatDate = (iso) => iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function ExportOrderPage() {
  const [orders, setOrders] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ warehouse: '', reason: '', note: '' })
  const [items, setItems] = useState([{ product: '', quantity: 1, unit_price: '' }])

  async function fetchOrders(p = 1) {
    setLoading(true)
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
    if (!token) { setOrders(DEMO_ORDERS); setTotal(DEMO_ORDERS.length); setIsDemoMode(true); setLoading(false); return }
    try {
      const res = await api.get(`/stock-transactions/?transaction_type=export&ordering=-created_at&page=${p}`)
      const data = res.data
      setOrders(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []))
      setTotal(data.count ?? 0)
      setIsDemoMode(false)
    } catch {
      setOrders(DEMO_ORDERS); setTotal(DEMO_ORDERS.length); setIsDemoMode(true)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchOrders(page)
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
    if (!token) return
    Promise.all([api.get('/warehouses/'), api.get('/products/?page_size=1000')]).then(([w, p]) => {
      const wd = w.data; const pd = p.data
      setWarehouses(Array.isArray(wd.results) ? wd.results : (Array.isArray(wd) ? wd : []))
      setProducts(Array.isArray(pd.results) ? pd.results : (Array.isArray(pd) ? pd : []))
    }).catch(() => {})
  }, [page])

  function addItem() { setItems((p) => [...p, { product: '', quantity: 1, unit_price: '' }]) }
  function removeItem(i) { setItems((p) => p.filter((_, idx) => idx !== i)) }
  function updateItem(i, field, val) { setItems((p) => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it)) }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.warehouse) { setFormError('Vui lòng chọn kho'); return }
    if (items.some((it) => !it.product || !it.quantity || !it.unit_price)) { setFormError('Điền đầy đủ thông tin sản phẩm'); return }
    setSaving(true); setFormError('')
    try {
      await api.post('/stock-transactions/', { ...form, transaction_type: 'export', items: items.map((it) => ({ product: it.product, quantity: Number(it.quantity), unit_price: it.unit_price })) })
      setShowCreate(false); fetchOrders(1); setPage(1)
    } catch (err) {
      const detail = err.response?.data
      setFormError(typeof detail === 'object' ? JSON.stringify(detail) : 'Tạo phiếu thất bại.')
    } finally { setSaving(false) }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="stock-page">
      <div className="stock-header">
        <div>
          <h2>Phiếu xuất kho</h2>
          <p>Tạo và quản lý các phiếu xuất hàng ra khỏi kho</p>
        </div>
        <button type="button" className="stock-add-btn green" onClick={() => { setForm({ warehouse: '', reason: '', note: '' }); setItems([{ product: '', quantity: 1, unit_price: '' }]); setFormError(''); setShowCreate(true) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tạo phiếu xuất
        </button>
      </div>

      {isDemoMode && <div className="stock-notice info">📋 Đang hiển thị dữ liệu mẫu.</div>}

      <div className="stock-card">
        <div className="stock-card-head">
          <span className="stock-count">{total} phiếu xuất kho</span>
          <span className={`stock-mode-dot ${isDemoMode ? 'demo' : 'api'}`}>{isDemoMode ? 'Demo' : 'API'}</span>
        </div>

        {loading ? (
          <div className="stock-state"><div className="stock-spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="stock-state"><span style={{ fontSize: '2rem' }}>📤</span><p>Chưa có phiếu xuất nào.</p></div>
        ) : (
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead><tr><th>Mã phiếu</th><th>Kho xuất</th><th>Lý do</th><th>Người tạo</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><span className="stock-code">{o.transaction_code}</span></td>
                    <td>{o.warehouse?.name || '—'}</td>
                    <td>{o.reason || '—'}</td>
                    <td>{o.created_by_name || o.created_by?.username || '—'}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td><button type="button" className="stock-btn-view" onClick={() => setDetailOrder(o)}>Xem</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="stock-pagination">
          <span>Trang {page} / {totalPages}</span>
          <div className="stock-pagination-btns">
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Trước</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau →</button>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="stock-modal-backdrop" role="presentation" onClick={() => setShowCreate(false)}>
          <div className="stock-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="stock-modal-header">
              <h3>📤 Tạo phiếu xuất kho</h3>
              <button type="button" className="stock-modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className="stock-form">
              <div className="stock-form-row">
                <div className="stock-form-group">
                  <label>Kho xuất <span className="required">*</span></label>
                  <select value={form.warehouse} onChange={(e) => setForm((p) => ({ ...p, warehouse: e.target.value }))}>
                    <option value="">-- Chọn kho --</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="stock-form-group">
                  <label>Lý do xuất</label>
                  <input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="VD: Xuất cho khách hàng" />
                </div>
              </div>
              <div className="stock-form-group">
                <label>Ghi chú</label>
                <textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} rows={2} placeholder="Ghi chú..." />
              </div>
              <div>
                <div className="stock-items-label">Sản phẩm xuất <span className="required">*</span></div>
                <div className="stock-item-rows">
                  {items.map((it, i) => (
                    <div key={i} className="stock-item-row">
                      <select value={it.product} onChange={(e) => updateItem(i, 'product', e.target.value)}>
                        <option value="">-- Sản phẩm --</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} placeholder="SL" />
                      <input type="number" min="0" value={it.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} placeholder="Đơn giá" />
                      <button type="button" className="stock-remove-item" onClick={() => removeItem(i)} disabled={items.length === 1}>×</button>
                    </div>
                  ))}
                </div>
                <button type="button" className="stock-add-item-btn" onClick={addItem} style={{ marginTop: '0.5rem' }}>+ Thêm sản phẩm</button>
              </div>
              {formError && <div className="stock-form-error">⚠ {formError}</div>}
              <div className="stock-form-actions">
                <button type="button" className="stock-btn-cancel" onClick={() => setShowCreate(false)} disabled={saving}>Hủy</button>
                <button type="submit" className="stock-btn-save green" disabled={saving}>{saving ? 'Đang lưu...' : 'Tạo phiếu xuất'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailOrder && (
        <div className="stock-modal-backdrop" role="presentation" onClick={() => setDetailOrder(null)}>
          <div className="stock-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="stock-modal-header">
              <h3>📋 Chi tiết — {detailOrder.transaction_code}</h3>
              <button type="button" className="stock-modal-close" onClick={() => setDetailOrder(null)}>×</button>
            </div>
            <div className="stock-detail-section">
              <div className="stock-detail-grid">
                <div className="stock-detail-item"><span>Mã phiếu</span><strong>{detailOrder.transaction_code}</strong></div>
                <div className="stock-detail-item"><span>Kho</span><strong>{detailOrder.warehouse?.name || '—'}</strong></div>
                <div className="stock-detail-item"><span>Lý do</span><strong>{detailOrder.reason || '—'}</strong></div>
                <div className="stock-detail-item"><span>Ngày tạo</span><strong>{formatDate(detailOrder.created_at)}</strong></div>
              </div>
              <div className="stock-detail-items-title">Danh sách sản phẩm</div>
              <table className="stock-detail-items-table">
                <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {(detailOrder.items || []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.product_name || item.product?.name || `SP #${item.product}`}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td><strong>{formatCurrency(item.total_amount)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
