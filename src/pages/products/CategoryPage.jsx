import { useEffect, useState } from 'react'
import api from '../../services/api'
import './CategoryPage.css'

const DEMO_CATEGORIES = [
  { id: 1, name: 'Thiết bị công nghệ', description: 'Laptop, máy tính bảng, điện thoại...', is_active: true },
  { id: 2, name: 'Phụ kiện máy tính', description: 'Bàn phím, chuột, màn hình...', is_active: true },
  { id: 3, name: 'Văn phòng phẩm', description: 'Sổ tay, bút, giấy in...', is_active: true },
  { id: 4, name: 'Thiết bị lưu trữ', description: 'Ổ cứng, USB, thẻ nhớ...', is_active: false },
]

export default function CategoryPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [error, setError] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', is_active: true })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchCategories() {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
    if (!token) {
      setCategories(DEMO_CATEGORIES)
      setIsDemoMode(true)
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/categories/')
      const data = res.data
      setCategories(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []))
      setIsDemoMode(false)
    } catch {
      setCategories(DEMO_CATEGORIES)
      setIsDemoMode(true)
      setError('Không thể kết nối API, đang hiển thị dữ liệu mẫu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  function openCreate() {
    setEditItem(null)
    setForm({ name: '', description: '', is_active: true })
    setFormError('')
    setShowModal(true)
  }

  function openEdit(cat) {
    setEditItem(cat)
    setForm({ name: cat.name, description: cat.description || '', is_active: cat.is_active !== false })
    setFormError('')
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Tên danh mục không được để trống'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editItem) {
        await api.patch(`/categories/${editItem.id}/`, form)
      } else {
        await api.post('/categories/', form)
      }
      setShowModal(false)
      fetchCategories()
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        setFormError(msgs.join(' | '))
      } else {
        setFormError('Lưu thất bại. Vui lòng thử lại.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/categories/${deleteTarget.id}/`)
      setDeleteTarget(null)
      fetchCategories()
    } catch {
      setDeleteTarget(null)
      setError('Xóa danh mục thất bại.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="cat-page">
      <div className="cat-header">
        <div>
          <h2>Danh mục sản phẩm</h2>
          <p>Quản lý phân loại sản phẩm theo nhóm</p>
        </div>
        <button type="button" className="cat-add-btn" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm danh mục
        </button>
      </div>

      {isDemoMode && <div className="cat-notice info">📋 Đang hiển thị dữ liệu mẫu.</div>}
      {error && <div className="cat-notice error">⚠ {error}</div>}

      <div className="cat-card">
        {loading ? (
          <div className="cat-loading">
            <div className="cat-spinner" />
            <span>Đang tải danh mục...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="cat-empty">
            <span>🗂️</span>
            <p>Chưa có danh mục nào. Nhấn "Thêm danh mục" để bắt đầu.</p>
          </div>
        ) : (
          <table className="cat-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={cat.id}>
                  <td className="cat-td-num">{idx + 1}</td>
                  <td className="cat-td-name">
                    <div className="cat-name-cell">
                      <span className="cat-icon-wrap">🗂️</span>
                      <strong>{cat.name}</strong>
                    </div>
                  </td>
                  <td className="cat-td-desc">{cat.description || <span className="cat-no-desc">Chưa có mô tả</span>}</td>
                  <td>
                    <span className={`cat-status ${cat.is_active !== false ? 'active' : 'inactive'}`}>
                      {cat.is_active !== false ? 'Đang dùng' : 'Ngừng dùng'}
                    </span>
                  </td>
                  <td>
                    <div className="cat-actions">
                      <button type="button" className="cat-btn-edit" onClick={() => openEdit(cat)}>Sửa</button>
                      <button type="button" className="cat-btn-delete" onClick={() => setDeleteTarget(cat)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="cat-modal-backdrop" role="presentation" onClick={() => setShowModal(false)}>
          <div className="cat-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal-header">
              <h3>{editItem ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
              <button type="button" className="cat-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="cat-form">
              <div className="cat-form-group">
                <label>Tên danh mục <span className="required">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nhập tên danh mục"
                  autoFocus
                />
              </div>
              <div className="cat-form-group">
                <label>Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả danh mục (tuỳ chọn)"
                  rows={3}
                />
              </div>
              <div className="cat-form-check">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                <label htmlFor="cat-active">Đang sử dụng</label>
              </div>
              {formError && <div className="cat-form-error">⚠ {formError}</div>}
              <div className="cat-form-actions">
                <button type="button" className="cat-btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
                <button type="submit" className="cat-btn-save" disabled={saving}>
                  {saving ? 'Đang lưu...' : editItem ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Xác nhận xóa */}
      {deleteTarget && (
        <div className="cat-modal-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}>
          <div className="cat-modal cat-modal-sm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="cat-del-icon">🗑️</div>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc muốn xóa danh mục <strong>"{deleteTarget.name}"</strong>?<br /><span className="cat-warn">Hành động này không thể hoàn tác.</span></p>
            <div className="cat-form-actions">
              <button type="button" className="cat-btn-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>Hủy</button>
              <button type="button" className="cat-btn-delete-confirm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
