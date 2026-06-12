import { useEffect, useState } from 'react'
import api from '../../services/api'
import './SupplierPage.css'

const DEMO_SUPPLIERS = [
  { id: 1, name: 'Công ty Dell Vietnam', contact_name: 'Nguyễn Văn A', phone: '0901234567', email: 'contact@dell.vn', address: 'Hà Nội', is_active: true },
  { id: 2, name: 'Phụ kiện Logitech VN', contact_name: 'Trần Thị B', phone: '0912345678', email: 'info@logitech.vn', address: 'TP.HCM', is_active: true },
  { id: 3, name: 'Samsung Distribution', contact_name: 'Lê Văn C', phone: '0923456789', email: 'dist@samsung.vn', address: 'Đà Nẵng', is_active: false },
]

const EMPTY_FORM = { name: '', contact_name: '', phone: '', email: '', address: '', note: '', is_active: true }

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState([])
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

  async function fetchSuppliers() {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
    if (!token) {
      setSuppliers(DEMO_SUPPLIERS); setIsDemoMode(true); setLoading(false); return
    }
    try {
      const res = await api.get('/suppliers/')
      const data = res.data
      setSuppliers(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []))
      setIsDemoMode(false)
    } catch {
      setSuppliers(DEMO_SUPPLIERS); setIsDemoMode(true)
      setError('Không thể kết nối API, đang hiển thị dữ liệu mẫu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSuppliers() }, [])

  function openCreate() { setEditItem(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true) }
  function openEdit(s) { setEditItem(s); setForm({ name: s.name, contact_name: s.contact_name || '', phone: s.phone || '', email: s.email || '', address: s.address || '', note: s.note || '', is_active: s.is_active !== false }); setFormError(''); setShowModal(true) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Tên nhà phân phối không được để trống'); return }
    setSaving(true); setFormError('')
    try {
      if (editItem) { await api.patch(`/suppliers/${editItem.id}/`, form) }
      else { await api.post('/suppliers/', form) }
      setShowModal(false); fetchSuppliers()
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
    try { await api.delete(`/suppliers/${deleteTarget.id}/`); setDeleteTarget(null); fetchSuppliers() }
    catch { setDeleteTarget(null); setError('Xóa thất bại.') }
    finally { setDeleting(false) }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  return (
    <div className="sup-page">
      <div className="sup-header">
        <div>
          <h2>Nhà phân phối</h2>
          <p>Quản lý thông tin các nhà cung cấp và phân phối sản phẩm</p>
        </div>
        <button type="button" className="sup-add-btn" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm nhà phân phối
        </button>
      </div>

      {isDemoMode && <div className="sup-notice info">📋 Đang hiển thị dữ liệu mẫu.</div>}
      {error && <div className="sup-notice error">⚠ {error}</div>}

      <div className="sup-card">
        {loading ? (
          <div className="sup-state"><div className="sup-spinner" /><span>Đang tải...</span></div>
        ) : suppliers.length === 0 ? (
          <div className="sup-state"><span style={{ fontSize: '2.5rem' }}>🏭</span><p>Chưa có nhà phân phối nào.</p></div>
        ) : (
          <div className="sup-table-wrap">
            <table className="sup-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên công ty</th>
                  <th>Người liên hệ</th>
                  <th>Số điện thoại</th>
                  <th>Email</th>
                  <th>Địa chỉ</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="sup-td-num">{idx + 1}</td>
                    <td><strong className="sup-name">{s.name}</strong></td>
                    <td>{s.contact_name || '—'}</td>
                    <td>{s.phone || '—'}</td>
                    <td className="sup-td-email">{s.email || '—'}</td>
                    <td>{s.address || '—'}</td>
                    <td>
                      <span className={`sup-status ${s.is_active !== false ? 'active' : 'inactive'}`}>
                        {s.is_active !== false ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                      </span>
                    </td>
                    <td>
                      <div className="sup-actions">
                        <button type="button" className="sup-btn-edit" onClick={() => openEdit(s)}>Sửa</button>
                        <button type="button" className="sup-btn-delete" onClick={() => setDeleteTarget(s)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="sup-modal-backdrop" role="presentation" onClick={() => setShowModal(false)}>
          <div className="sup-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="sup-modal-header">
              <h3>{editItem ? 'Sửa nhà phân phối' : 'Thêm nhà phân phối'}</h3>
              <button type="button" className="sup-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="sup-form">
              <div className="sup-form-row">
                <div className="sup-form-group">
                  <label>Tên công ty <span className="required">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Nhập tên công ty" autoFocus />
                </div>
                <div className="sup-form-group">
                  <label>Người liên hệ</label>
                  <input name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="Tên người liên hệ" />
                </div>
              </div>
              <div className="sup-form-row">
                <div className="sup-form-group">
                  <label>Số điện thoại</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="09xx..." />
                </div>
                <div className="sup-form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@company.com" />
                </div>
              </div>
              <div className="sup-form-group">
                <label>Địa chỉ</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Địa chỉ công ty" />
              </div>
              <div className="sup-form-group">
                <label>Ghi chú</label>
                <textarea name="note" value={form.note} onChange={handleChange} placeholder="Ghi chú thêm..." rows={2} />
              </div>
              <div className="sup-form-check">
                <input type="checkbox" id="sup-active" name="is_active" checked={form.is_active} onChange={handleChange} />
                <label htmlFor="sup-active">Đang hợp tác</label>
              </div>
              {formError && <div className="sup-form-error">⚠ {formError}</div>}
              <div className="sup-form-actions">
                <button type="button" className="sup-btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
                <button type="submit" className="sup-btn-save" disabled={saving}>
                  {saving ? 'Đang lưu...' : editItem ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Xác nhận xóa */}
      {deleteTarget && (
        <div className="sup-modal-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}>
          <div className="sup-modal sup-modal-sm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="sup-del-icon">🗑️</div>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc muốn xóa <strong>"{deleteTarget.name}"</strong>?<br /><span className="sup-warn">Hành động này không thể hoàn tác.</span></p>
            <div className="sup-form-actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="sup-btn-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>Hủy</button>
              <button type="button" className="sup-btn-delete-confirm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
