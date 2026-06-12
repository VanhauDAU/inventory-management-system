import { useEffect, useState } from 'react'
import api from '../../services/api'
import './StockPage.css'

const PAGE_SIZE = 10

const DEMO_TX = [
  { id: 1, transaction_code: 'NK-2026-001', transaction_type: 'import', warehouse: { name: 'Kho Hà Nội' }, reason: 'Nhập hàng định kỳ', created_by_name: 'Admin', created_at: '2026-06-12T08:30:00Z' },
  { id: 2, transaction_code: 'XK-2026-042', transaction_type: 'export', warehouse: { name: 'Kho HCM' }, reason: 'Xuất cho khách', created_by_name: 'Admin', created_at: '2026-06-11T14:20:00Z' },
  { id: 3, transaction_code: 'DC-2026-007', transaction_type: 'adjustment', warehouse: { name: 'Kho Đà Nẵng' }, reason: 'Kiểm kê tháng 6', created_by_name: 'Admin', created_at: '2026-06-10T10:00:00Z' },
  { id: 4, transaction_code: 'NK-2026-002', transaction_type: 'import', warehouse: { name: 'Kho Hà Nội' }, reason: 'Bổ sung tồn kho', created_by_name: 'Admin', created_at: '2026-06-09T09:15:00Z' },
  { id: 5, transaction_code: 'XK-2026-043', transaction_type: 'export', warehouse: { name: 'Kho HCM' }, reason: 'Giao đại lý', created_by_name: 'Admin', created_at: '2026-06-08T16:45:00Z' },
]

const TX_LABEL = { import: 'Nhập kho', export: 'Xuất kho', adjustment: 'Điều chỉnh' }
const TX_CLASS = { import: 'badge-import', export: 'badge-export', adjustment: 'badge-adjust' }

const formatDate = (iso) => iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detailTx, setDetailTx] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    async function fetchTx() {
      setLoading(true)
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
      if (!token) { setTransactions(DEMO_TX); setTotal(DEMO_TX.length); setIsDemoMode(true); setLoading(false); return }
      try {
        const params = new URLSearchParams({ ordering: '-created_at', page: String(page) })
        if (typeFilter !== 'all') params.set('transaction_type', typeFilter)
        if (search.trim()) params.set('search', search.trim())
        const res = await api.get(`/stock-transactions/?${params}`, { signal: controller.signal })
        const data = res.data
        setTransactions(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []))
        setTotal(data.count ?? 0); setIsDemoMode(false)
      } catch {
        setTransactions(DEMO_TX); setTotal(DEMO_TX.length); setIsDemoMode(true)
      } finally { setLoading(false) }
    }
    fetchTx()
    return () => controller.abort()
  }, [page, typeFilter, search])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="stock-page">
      <div className="stock-header">
        <div>
          <h2>Lịch sử giao dịch kho</h2>
          <p>Xem toàn bộ phiếu nhập, xuất, điều chỉnh theo thời gian</p>
        </div>
      </div>

      {isDemoMode && <div className="stock-notice info">📋 Đang hiển thị dữ liệu mẫu.</div>}

      {/* Filters */}
      <div className="stock-filter-bar">
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}>
          <option value="all">Tất cả loại</option>
          <option value="import">Nhập kho</option>
          <option value="export">Xuất kho</option>
          <option value="adjustment">Điều chỉnh</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Tìm theo mã phiếu, lý do..."
        />
      </div>

      <div className="stock-card">
        <div className="stock-card-head">
          <span className="stock-count">{total} giao dịch</span>
          <span className={`stock-mode-dot ${isDemoMode ? 'demo' : 'api'}`}>{isDemoMode ? 'Demo' : 'API'}</span>
        </div>

        {loading ? (
          <div className="stock-state"><div className="stock-spinner" /><span>Đang tải...</span></div>
        ) : transactions.length === 0 ? (
          <div className="stock-state"><span style={{ fontSize: '2rem' }}>📋</span><p>Không có giao dịch nào.</p></div>
        ) : (
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Loại</th>
                  <th>Kho</th>
                  <th>Lý do</th>
                  <th>Người tạo</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td><span className="stock-code">{tx.transaction_code}</span></td>
                    <td>
                      <span className={`stock-badge ${TX_CLASS[tx.transaction_type] || ''}`}>
                        {TX_LABEL[tx.transaction_type] || tx.transaction_type}
                      </span>
                    </td>
                    <td>{tx.warehouse?.name || '—'}</td>
                    <td>{tx.reason || '—'}</td>
                    <td>{tx.created_by_name || tx.created_by?.username || '—'}</td>
                    <td>{formatDate(tx.created_at)}</td>
                    <td>
                      <button type="button" className="stock-btn-view" onClick={() => setDetailTx(tx)}>Xem</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="stock-pagination">
          <span>Trang {page} / {totalPages} · {total} giao dịch</span>
          <div className="stock-pagination-btns">
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Trước</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau →</button>
          </div>
        </div>
      </div>

      {detailTx && (
        <div className="stock-modal-backdrop" role="presentation" onClick={() => setDetailTx(null)}>
          <div className="stock-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="stock-modal-header">
              <h3>
                <span className={`stock-badge ${TX_CLASS[detailTx.transaction_type] || ''}`} style={{ marginRight: '0.65rem' }}>
                  {TX_LABEL[detailTx.transaction_type]}
                </span>
                {detailTx.transaction_code}
              </h3>
              <button type="button" className="stock-modal-close" onClick={() => setDetailTx(null)}>×</button>
            </div>
            <div className="stock-detail-section">
              <div className="stock-detail-grid">
                <div className="stock-detail-item"><span>Mã phiếu</span><strong>{detailTx.transaction_code}</strong></div>
                <div className="stock-detail-item"><span>Kho</span><strong>{detailTx.warehouse?.name || '—'}</strong></div>
                <div className="stock-detail-item"><span>Lý do</span><strong>{detailTx.reason || '—'}</strong></div>
                <div className="stock-detail-item"><span>Ngày tạo</span><strong>{formatDate(detailTx.created_at)}</strong></div>
              </div>
              {detailTx.note && <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>{detailTx.note}</p>}
              {(detailTx.items || []).length > 0 && (
                <>
                  <div className="stock-detail-items-title">Danh sách sản phẩm</div>
                  <table className="stock-detail-items-table">
                    <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                    <tbody>
                      {detailTx.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.product_name || item.product?.name || `SP #${item.product}`}</td>
                          <td>{item.quantity}</td>
                          <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(item.unit_price || 0))}</td>
                          <td><strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(item.total_amount || 0))}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
