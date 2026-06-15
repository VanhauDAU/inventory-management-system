import { useEffect, useMemo, useState } from 'react'
import './SupplierPage.css'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const initialForm = {
  name: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  tax_code: '',
  note: '',
  is_active: true,
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const formatDateTime = (value) => {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

const getProductPrice = (product) => product?.price ?? product?.selling_price ?? 0
const getProductImage = (product) => product?.image || '/product-images/product-default.svg'

async function refreshAccessToken(signal) {
  const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken')
  if (!refreshToken) return null

  const response = await fetch(`${apiUrl}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
    signal,
  })

  if (!response.ok) return null

  const data = await response.json()
  if (!data.access) return null

  localStorage.setItem('access_token', data.access)
  localStorage.setItem('accessToken', data.access)
  return data.access
}

async function apiJson(path, { method = 'GET', body, signal } = {}) {
  let token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
  if (!token) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.')

  const request = (accessToken) => fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  let response = await request(token)
  if (response.status === 401) {
    const newToken = await refreshAccessToken(signal)
    if (!newToken) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    response = await request(newToken)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(getApiErrorMessage(data, response.status))
  return data
}

function getApiErrorMessage(data, fallbackStatus) {
  if (data?.detail) return data.detail

  const firstField = data && typeof data === 'object' ? Object.keys(data)[0] : ''
  const firstError = firstField ? data[firstField] : null
  const rawMessage =
    (Array.isArray(firstError) ? firstError[0] : '') ||
    (typeof firstError === 'string' ? firstError : '') ||
    ''

  const fieldMap = {
    name: 'Tên nhà phân phối',
    contact_name: 'Người liên hệ',
    phone: 'Số điện thoại',
    email: 'Email',
    address: 'Địa chỉ',
    tax_code: 'Mã số thuế',
    note: 'Ghi chú',
    is_active: 'Trạng thái',
  }

  if (firstField && rawMessage) return `${fieldMap[firstField] || firstField}: ${rawMessage}`
  return `Lỗi API: ${fallbackStatus}`
}

async function fetchPaginated(path) {
  const allItems = []
  let currentPage = 1
  let hasNextPage = true
  const separator = path.includes('?') ? '&' : '?'

  while (hasNextPage) {
    const data = await apiJson(`${path}${separator}page=${currentPage}`)
    const list = Array.isArray(data.results) ? data.results : data
    allItems.push(...(Array.isArray(list) ? list : []))
    hasNextPage = Boolean(data.next)
    currentPage += 1
  }

  return allItems
}

function SupplierForm({ form, errors, editingSupplier, onChange, onSubmit, onCancel, loading }) {
  return (
    <form className="supplier-form" onSubmit={onSubmit} noValidate>
      <div className="supplier-form-grid">
        <label className="supplier-field">
          <span>Tên nhà phân phối <b>*</b></span>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className={errors.name ? 'input-error' : ''}
            placeholder="Ví dụ: Công ty TNHH ABC"
            maxLength={255}
          />
          {errors.name && <small className="supplier-error">{errors.name}</small>}
        </label>

        <label className="supplier-field">
          <span>Người liên hệ</span>
          <input
            name="contact_name"
            value={form.contact_name}
            onChange={onChange}
            className={errors.contact_name ? 'input-error' : ''}
            placeholder="Tên người phụ trách"
            maxLength={255}
          />
          {errors.contact_name && <small className="supplier-error">{errors.contact_name}</small>}
        </label>

        <label className="supplier-field">
          <span>Số điện thoại</span>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            className={errors.phone ? 'input-error' : ''}
            placeholder="Ví dụ: 0901234567"
            maxLength={30}
          />
          {errors.phone && <small className="supplier-error">{errors.phone}</small>}
        </label>

        <label className="supplier-field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            className={errors.email ? 'input-error' : ''}
            placeholder="contact@example.com"
            maxLength={254}
          />
          {errors.email && <small className="supplier-error">{errors.email}</small>}
        </label>

        <label className="supplier-field">
          <span>Mã số thuế</span>
          <input
            name="tax_code"
            value={form.tax_code}
            onChange={onChange}
            className={errors.tax_code ? 'input-error' : ''}
            placeholder="MST hoặc mã nhà phân phối"
            maxLength={100}
          />
          {errors.tax_code && <small className="supplier-error">{errors.tax_code}</small>}
        </label>

        <label className="supplier-toggle">
          <input
            name="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={onChange}
          />
          <span>Đang hợp tác</span>
        </label>

        <label className="supplier-field supplier-field-wide">
          <span>Địa chỉ</span>
          <textarea
            name="address"
            value={form.address}
            onChange={onChange}
            className={errors.address ? 'input-error' : ''}
            placeholder="Nhập địa chỉ nhà phân phối"
            rows={3}
            maxLength={1000}
          />
          {errors.address && <small className="supplier-error">{errors.address}</small>}
        </label>

        <label className="supplier-field supplier-field-wide">
          <span>Ghi chú</span>
          <textarea
            name="note"
            value={form.note}
            onChange={onChange}
            className={errors.note ? 'input-error' : ''}
            placeholder="Điều khoản, công nợ, lịch giao hàng, ghi chú nội bộ..."
            rows={4}
            maxLength={1000}
          />
          {errors.note && <small className="supplier-error">{errors.note}</small>}
        </label>
      </div>

      <div className="supplier-form-actions">
        <button type="button" className="supplier-btn secondary" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button type="submit" className="supplier-btn primary" disabled={loading}>
          {loading ? 'Đang lưu...' : editingSupplier ? 'Lưu thay đổi' : 'Thêm nhà phân phối'}
        </button>
      </div>
    </form>
  )
}

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState([])
  const [supplierProducts, setSupplierProducts] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function showToast(type, message) {
    setToast({ id: Date.now(), type, message })
  }

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, toast.type === 'error' ? 6000 : 3500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchSuppliers() {
      setLoading(true)
      setError('')
      try {
        const allSuppliers = []
        let currentPage = 1
        let hasNextPage = true

        while (hasNextPage) {
          const data = await apiJson(`/suppliers/?page=${currentPage}`, { signal: controller.signal })
          const list = Array.isArray(data.results) ? data.results : data
          allSuppliers.push(...(Array.isArray(list) ? list : []))
          hasNextPage = Boolean(data.next)
          currentPage += 1
        }

        setSuppliers(allSuppliers)
      } catch (requestError) {
        if (requestError.name === 'AbortError') return
        const message = requestError.message || 'Không thể tải danh sách nhà phân phối.'
        setError(message)
        showToast('error', message)
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliers()
    return () => controller.abort()
  }, [refreshKey])

  const visibleSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const keyword = search.trim().toLowerCase()
      const matchesSearch = !keyword ||
        supplier.name.toLowerCase().includes(keyword) ||
        (supplier.contact_name || '').toLowerCase().includes(keyword) ||
        (supplier.phone || '').toLowerCase().includes(keyword) ||
        (supplier.email || '').toLowerCase().includes(keyword) ||
        (supplier.tax_code || '').toLowerCase().includes(keyword) ||
        (supplier.address || '').toLowerCase().includes(keyword)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && supplier.is_active) ||
        (statusFilter === 'inactive' && !supplier.is_active)
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, suppliers])

  const stats = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter((supplier) => supplier.is_active).length,
    inactive: suppliers.filter((supplier) => !supplier.is_active).length,
    productsCount: suppliers.reduce((sum, supplier) => sum + Number(supplier.products_count || 0), 0),
    withTaxCode: suppliers.filter((supplier) => supplier.tax_code).length,
  }), [suppliers])

  function openCreateForm() {
    setEditingSupplier(null)
    setForm(initialForm)
    setErrors({})
    setFormError('')
    setShowForm(true)
  }

  function openEditForm(supplier) {
    setEditingSupplier(supplier)
    setForm({
      name: supplier.name || '',
      contact_name: supplier.contact_name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      tax_code: supplier.tax_code || '',
      note: supplier.note || '',
      is_active: Boolean(supplier.is_active),
    })
    setErrors({})
    setFormError('')
    setShowForm(true)
  }

  function closeForm(force = false) {
    if (saving && !force) return
    setShowForm(false)
    setEditingSupplier(null)
    setForm(initialForm)
    setErrors({})
    setFormError('')
  }

  function validateForm() {
    const nextErrors = {}
    const name = form.name.trim()
    const phone = form.phone.trim()
    const email = form.email.trim()
    const taxCode = form.tax_code.trim()

    if (!name) nextErrors.name = 'Vui lòng nhập tên nhà phân phối'
    else if (name.length < 2) nextErrors.name = 'Tên nhà phân phối phải có ít nhất 2 ký tự'
    else if (name.length > 255) nextErrors.name = 'Tên nhà phân phối không được vượt quá 255 ký tự'

    if (form.contact_name.trim().length > 255) nextErrors.contact_name = 'Người liên hệ không được vượt quá 255 ký tự'
    if (phone && !/^[0-9+\-\s()]{8,30}$/.test(phone)) nextErrors.phone = 'Số điện thoại không hợp lệ'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email không hợp lệ'
    if (taxCode && !/^[A-Za-z0-9._-]{3,100}$/.test(taxCode)) nextErrors.tax_code = 'Mã số thuế chỉ gồm chữ, số, dấu chấm, gạch ngang, gạch dưới'
    if (form.address.trim().length > 1000) nextErrors.address = 'Địa chỉ không được vượt quá 1000 ký tự'
    if (form.note.trim().length > 1000) nextErrors.note = 'Ghi chú không được vượt quá 1000 ký tự'

    const duplicateName = suppliers.find((supplier) => (
      supplier.id !== editingSupplier?.id &&
      supplier.name.trim().toLowerCase() === name.toLowerCase()
    ))
    if (duplicateName) nextErrors.name = 'Tên nhà phân phối đã tồn tại'

    const duplicateTaxCode = taxCode && suppliers.find((supplier) => (
      supplier.id !== editingSupplier?.id &&
      (supplier.tax_code || '').trim().toLowerCase() === taxCode.toLowerCase()
    ))
    if (duplicateTaxCode) nextErrors.tax_code = 'Mã số thuế đã tồn tại'

    return nextErrors
  }

  function handleFormChange(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateForm()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setFormError('Vui lòng kiểm tra lại thông tin nhà phân phối.')
      showToast('error', 'Vui lòng kiểm tra lại thông tin nhà phân phối.')
      return
    }

    setSaving(true)
    setFormError('')
    const payload = {
      name: form.name.trim(),
      contact_name: form.contact_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      tax_code: form.tax_code.trim() || null,
      note: form.note.trim(),
      is_active: form.is_active,
    }

    try {
      if (editingSupplier) {
        await apiJson(`/suppliers/${editingSupplier.id}/`, { method: 'PATCH', body: payload })
        showToast('success', 'Đã cập nhật nhà phân phối thành công.')
      } else {
        await apiJson('/suppliers/', { method: 'POST', body: payload })
        showToast('success', 'Đã thêm nhà phân phối thành công.')
      }

      closeForm(true)
      setRefreshKey((value) => value + 1)
    } catch (requestError) {
      const message = requestError.message || 'Không thể lưu nhà phân phối. Vui lòng thử lại.'
      setFormError(message)
      showToast('error', message)
    } finally {
      setSaving(false)
    }
  }

  async function openProductDetail(supplier) {
    setSelectedSupplier(supplier)
    setSupplierProducts([])
    if (Number(supplier.products_count || 0) === 0) {
      setProductsLoading(false)
      return
    }

    setProductsLoading(true)
    try {
      let allProducts
      try {
        allProducts = await fetchPaginated(`/suppliers/${supplier.id}/products/`)
      } catch {
        allProducts = await fetchPaginated(`/products/?supplier=${supplier.id}`)
      }
      setSupplierProducts(allProducts)
    } catch (requestError) {
      showToast('error', requestError.message || 'Không thể tải sản phẩm của nhà phân phối.')
    } finally {
      setProductsLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    if (Number(deleteTarget.products_count || 0) > 0) {
      showToast('error', 'Không thể xóa nhà phân phối đang có sản phẩm. Hãy chuyển sản phẩm sang nhà phân phối khác hoặc tắt trạng thái.')
      return
    }

    setDeleting(true)
    try {
      await apiJson(`/suppliers/${deleteTarget.id}/`, { method: 'DELETE' })
      setDeleteTarget(null)
      setRefreshKey((value) => value + 1)
      showToast('success', 'Đã xóa nhà phân phối thành công.')
    } catch (requestError) {
      showToast('error', requestError.message || 'Không thể xóa nhà phân phối.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="supplier-page">
      {toast && (
        <div className={`supplier-toast ${toast.type}`} role="status" aria-live="polite">
          <div className="supplier-toast-icon" aria-hidden="true">{toast.type === 'success' ? '✓' : '!'}</div>
          <p>{toast.message}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <section className="supplier-header">
        <div>
          <span className="supplier-eyebrow">Quản lý sản phẩm</span>
          <h2>Nhà phân phối</h2>
          <p>Quản lý thông tin liên hệ, mã số thuế, trạng thái hợp tác và các sản phẩm đang được cung cấp.</p>
        </div>
        <button type="button" className="supplier-btn primary" onClick={openCreateForm}>
          Thêm nhà phân phối
        </button>
      </section>

      <section className="supplier-stats">
        <article><span>Tổng nhà phân phối</span><strong>{stats.total}</strong></article>
        <article><span>Đang hợp tác</span><strong>{stats.active}</strong></article>
        <article><span>Tạm ngưng</span><strong>{stats.inactive}</strong></article>
        <article><span>Sản phẩm liên kết</span><strong>{stats.productsCount}</strong></article>
        <article><span>Có mã số thuế</span><strong>{stats.withTaxCode}</strong></article>
      </section>

      <section className="supplier-filters">
        <label>
          <span>Tìm kiếm</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, người liên hệ, SĐT, email, MST" />
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="active">Đang hợp tác</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </label>
      </section>

      {error && <div className="supplier-notice error">{error}</div>}

      <section className="supplier-card">
        <div className="supplier-card-head">
          <span>{visibleSuppliers.length} nhà phân phối</span>
          <small>Nhà phân phối đang có sản phẩm thì không xóa trực tiếp; hãy chuyển sản phẩm hoặc tắt trạng thái.</small>
        </div>

        {loading ? (
          <div className="supplier-state">Đang tải nhà phân phối...</div>
        ) : visibleSuppliers.length === 0 ? (
          <div className="supplier-state">Không có nhà phân phối phù hợp.</div>
        ) : (
          <div className="supplier-table-wrap">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Nhà phân phối</th>
                  <th>Liên hệ</th>
                  <th>Email</th>
                  <th>Mã số thuế</th>
                  <th>Sản phẩm</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <div className="supplier-name-cell">
                        <strong>{supplier.name}</strong>
                        <small>{supplier.address || supplier.note || 'Chưa có địa chỉ/ghi chú'}</small>
                      </div>
                    </td>
                    <td>
                      <strong>{supplier.contact_name || 'Chưa gán'}</strong>
                      <small>{supplier.phone || 'Chưa có SĐT'}</small>
                    </td>
                    <td>{supplier.email || 'Chưa có'}</td>
                    <td>{supplier.tax_code || 'Chưa có'}</td>
                    <td><span className="supplier-count">{supplier.products_count || 0}</span></td>
                    <td>
                      <span className={`supplier-status ${supplier.is_active ? 'active' : 'inactive'}`}>
                        {supplier.is_active ? 'Đang hợp tác' : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td>{formatDateTime(supplier.updated_at)}</td>
                    <td>
                      <div className="supplier-row-actions">
                        <button type="button" className="supplier-action detail" onClick={() => openProductDetail(supplier)}>Sản phẩm</button>
                        <button type="button" className="supplier-action edit" onClick={() => openEditForm(supplier)}>Sửa</button>
                        <button type="button" className="supplier-action delete" onClick={() => setDeleteTarget(supplier)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="supplier-modal-backdrop" role="presentation" onClick={closeForm}>
          <section className="supplier-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="supplier-modal-header">
              <div>
                <span className="supplier-eyebrow">Nhà phân phối</span>
                <h3>{editingSupplier ? 'Sửa nhà phân phối' : 'Thêm nhà phân phối'}</h3>
              </div>
              <button type="button" aria-label="Đóng" disabled={saving} onClick={closeForm}>×</button>
            </div>
            {formError && <div className="supplier-notice error sticky">{formError}</div>}
            <SupplierForm
              form={form}
              errors={errors}
              editingSupplier={editingSupplier}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              loading={saving}
            />
          </section>
        </div>
      )}

      {selectedSupplier && (
        <div className="supplier-modal-backdrop" role="presentation" onClick={() => setSelectedSupplier(null)}>
          <section className="supplier-modal products" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="supplier-modal-header">
              <div>
                <span className="supplier-eyebrow">Sản phẩm liên kết</span>
                <h3>{selectedSupplier.name}</h3>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setSelectedSupplier(null)}>×</button>
            </div>

            {productsLoading ? (
              <div className="supplier-state">Đang tải sản phẩm...</div>
            ) : supplierProducts.length === 0 ? (
              <div className="supplier-state">Nhà phân phối này chưa có sản phẩm.</div>
            ) : (
              <div className="supplier-product-list">
                {supplierProducts.map((product) => (
                  <article className="supplier-product-item" key={product.id}>
                    <img src={getProductImage(product)} alt={product.name} />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.sku || `#${product.id}`} · {product.category_detail?.name || 'Chưa có danh mục'}</span>
                    </div>
                    <div className="supplier-product-numbers">
                      <strong>{formatCurrency(getProductPrice(product))}</strong>
                      <span>Tồn: {product.quantity ?? 0}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="supplier-modal-backdrop" role="presentation" onClick={() => !deleting && setDeleteTarget(null)}>
          <section className="supplier-modal delete" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="supplier-modal-header">
              <div>
                <span className="supplier-eyebrow">Xác nhận xóa</span>
                <h3>{deleteTarget.name}</h3>
              </div>
              <button type="button" aria-label="Đóng" disabled={deleting} onClick={() => setDeleteTarget(null)}>×</button>
            </div>

            {Number(deleteTarget.products_count || 0) > 0 ? (
              <div className="supplier-notice error">
                Nhà phân phối này đang có {deleteTarget.products_count} sản phẩm nên không thể xóa.
                Hãy chuyển các sản phẩm sang nhà phân phối khác hoặc tắt trạng thái nhà phân phối.
              </div>
            ) : (
              <p className="supplier-delete-text">Bạn muốn xóa nhà phân phối này khỏi hệ thống?</p>
            )}

            <div className="supplier-delete-actions">
              <button type="button" className="supplier-btn secondary" disabled={deleting} onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button
                type="button"
                className="supplier-btn danger"
                disabled={deleting || Number(deleteTarget.products_count || 0) > 0}
                onClick={handleDelete}
              >
                {deleting ? 'Đang xóa...' : 'Xóa nhà phân phối'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
