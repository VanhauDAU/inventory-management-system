import { useEffect, useState } from 'react'
import api from '../../services/api'
import './WarehousePage.css'

const DEMO_WAREHOUSES = [
  { id: 1, name: 'Kho Hà Nội', address: 'Số 10, Đường Láng, Đống Đa, Hà Nội', phone: '024 3456 7890', manager_name: 'Nguyễn Văn A', is_active: true },
  { id: 2, name: 'Kho TP.HCM', address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM', phone: '028 1234 5678', manager_name: 'Trần Thị B', is_active: true },
  { id: 3, name: 'Kho Đà Nẵng', address: '45 Nguyễn Văn Thoại, Đà Nẵng', phone: '0236 987 6543', manager_name: 'Lê Văn C', is_active: false },
]

const EMPTY_FORM = { name: '', address: '', phone: '', manager_name: '', is_active: true }

export default function WarehouseListPage() {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchWarehouses() {
    setLoading(true); setError('')
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
    if (!token) { setWarehouses(DEMO_WAREHOUSES); setIsDemoMode(true); setLoading(false); return }
    try {
      const res = await api.get('/warehouses/')
      const data = res.data
      setWarehouses(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []))
      setIsDemoMode(false)
    } catch {
      setWarehouses(DEMO_WAREHOUSES); setIsDemoMode(true)
      setError('Không thể kết nối API, đang hiển thị dữ liệu mẫu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWarehouses() }, [])

  function openCreate() { setEditItem(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true) }
  function openEdit(w) { setEditItem(w); setForm({ name: w.name, address: w.address || '', phone: w.phone || '', manager_name: w.manager_name || '', is_active: w.is_active !== false }); setFormError(''); setShowModal(true) }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Tên kho không được để trống'); return }
    setSaving(true); setFormError('')
    try {
      if (editItem) { await api.patch(`/warehouses/${editItem.id}/`, form) }
      else { await api.post('/warehouses/', form) }
      setShowModal(false); fetchWarehouses()
    } catch (err) {
      const detail = err.response?.data
      setFormError(typeof detail === 'object' ? Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Lưu thất bại.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try { await api.delete(`/warehouses/${deleteTarget.id}/`); setDeleteTarget(null); fetchWarehouses() }
    catch { setDeleteTarget(null); setError('Xóa kho thất bại.') }
    finally { setDeleting(false) }
  }

  return (
    <div className="wh-page">
      <div className="wh-header">
        <div>
          <h2>Danh sách kho hàng</h2>
          <p>Quản lý thông tin các kho: vị trí, người quản lý, trạng thái</p>
        </div>
        <button type="button" className="wh-add-btn" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm kho mới
        </button>
      </div>

      {isDemoMode && <div className="wh-notice info">📋 Đang hiển thị dữ liệu mẫu.</div>}
      {error && <div className="wh-notice error">⚠ {error}</div>}

      <div className="wh-grid">
        {loading ? (
          <div className="wh-state"><div className="wh-spinner" /><span>Đang tải...</span></div>
        ) : warehouses.length === 0 ? (
          <div className="wh-state"><span style={{ fontSize: '2.5rem' }}>🏬</span><p>Chưa có kho nào. Nhấn "Thêm kho mới" để bắt đầu.</p></div>
        ) : (
          warehouses.map((w) => (
            <article key={w.id} className="wh-card">
              <div className="wh-card-icon">🏬</div>
              <div className="wh-card-body">
                <div className="wh-card-name-row">
                  <strong>{w.name}</strong>
                  <span className={`wh-status ${w.is_active !== false ? 'active' : 'inactive'}`}>
                    {w.is_active !== false ? 'Hoạt động' : 'Ngừng'}
                  </span>
                </div>
                <div className="wh-card-details">
                  {w.address && <span>📍 {w.address}</span>}
                  {w.phone && <span>📞 {w.phone}</span>}
                  {w.manager_name && <span>👤 {w.manager_name}</span>}
                </div>
              </div>
              <div className="wh-card-actions">
                <button type="button" className="wh-btn-edit" onClick={() => openEdit(w)}>Sửa</button>
                <button type="button" className="wh-btn-delete" onClick={() => setDeleteTarget(w)}>Xóa</button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="wh-modal-backdrop" role="presentation" onClick={() => setShowModal(false)}>
          <div className="wh-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="wh-modal-header">
              <h3>{editItem ? 'Sửa thông tin kho' : 'Thêm kho hàng mới'}</h3>
              <button type="button" className="wh-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="wh-form">
              <div className="wh-form-row">
                <div className="wh-form-group">
                  <label>Tên kho <span className="required">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="VD: Kho Hà Nội" autoFocus />
                </div>
                <div className="wh-form-group">
                  <label>Người quản lý</label>
                  <input name="manager_name" value={form.manager_name} onChange={handleChange} placeholder="Tên người quản lý" />
                </div>
              </div>
              <div className="wh-form-group">
                <label>Địa chỉ</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Địa chỉ kho hàng" />
              </div>
              <div className="wh-form-group">
                <label>Số điện thoại</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Số điện thoại kho" />
              </div>
              <div className="wh-form-check">
                <input type="checkbox" id="wh-active" name="is_active" checked={form.is_active} onChange={handleChange} />
                <label htmlFor="wh-active">Đang hoạt động</label>
              </div>
              {formError && <div className="wh-form-error">⚠ {formError}</div>}
              <div className="wh-form-actions">
                <button type="button" className="wh-btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
                <button type="submit" className="wh-btn-save" disabled={saving}>
                  {saving ? 'Đang lưu...' : editItem ? 'Lưu thay đổi' : 'Thêm kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Xác nhận xóa */}
      {deleteTarget && (
        <div className="wh-modal-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}>
          <div className="wh-modal wh-modal-sm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🗑️</div>
            <h3>Xác nhận xóa kho</h3>
            <p>Bạn có chắc muốn xóa kho <strong>"{deleteTarget.name}"</strong>?<br /><span className="wh-warn">Hành động này không thể hoàn tác.</span></p>
            <div className="wh-form-actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="wh-btn-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>Hủy</button>
              <button type="button" className="wh-btn-delete-confirm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa kho'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
