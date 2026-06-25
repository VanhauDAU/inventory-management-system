import { useEffect, useMemo, useState } from 'react'
import useToast from '../../hooks/useToast'
import { authJson, fetchPaginated } from '../../services/authApi'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { hasPermission } from '../../utils/permissions'
import SupplierDeleteModal from './components/SupplierDeleteModal'
import SupplierForm from './components/SupplierForm'
import SupplierProductsModal from './components/SupplierProductsModal'
import SupplierTable from './components/SupplierTable'
import './SupplierPage.css'

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

const PAGE_SIZE = 10

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

export default function SupplierPage({ currentUser }) {
  const canAdd = hasPermission(currentUser, 'suppliers.add_supplier')
  const canChange = hasPermission(currentUser, 'suppliers.change_supplier')
  const canDelete = hasPermission(currentUser, 'suppliers.delete_supplier')
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
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)
  const { clearToast, showToast, toast } = useToast()

  useEffect(() => {
    const controller = new AbortController()

    async function fetchSuppliers() {
      setLoading(true)
      setError('')
      try {
        const allSuppliers = await fetchPaginated('/suppliers/', {
          signal: controller.signal,
          errorResolver: getApiErrorMessage,
        })
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

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    return visibleSuppliers.slice(startIndex, startIndex + PAGE_SIZE)
  }, [page, visibleSuppliers])

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
        await authJson(`/suppliers/${editingSupplier.id}/`, { method: 'PATCH', body: payload, errorResolver: getApiErrorMessage })
        showToast('success', 'Đã cập nhật nhà phân phối thành công.')
      } else {
        await authJson('/suppliers/', { method: 'POST', body: payload, errorResolver: getApiErrorMessage })
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
        allProducts = await fetchPaginated(`/suppliers/${supplier.id}/products/`, { errorResolver: getApiErrorMessage })
      } catch {
        allProducts = await fetchPaginated(`/products/?supplier=${supplier.id}`, { errorResolver: getApiErrorMessage })
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
      await authJson(`/suppliers/${deleteTarget.id}/`, { method: 'DELETE', errorResolver: getApiErrorMessage })
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
          <button type="button" aria-label="Đóng thông báo" onClick={clearToast}>×</button>
        </div>
      )}

      <section className="supplier-header">
        <div>
          <span className="supplier-eyebrow">Quản lý sản phẩm</span>
          <h2>Nhà phân phối</h2>
          <p>Quản lý thông tin liên hệ, mã số thuế, trạng thái hợp tác và các sản phẩm đang được cung cấp.</p>
        </div>
        {canAdd && (
          <button type="button" className="supplier-btn primary" onClick={openCreateForm}>
            Thêm nhà phân phối
          </button>
        )}
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

        <SupplierTable
          canChange={canChange}
          canDelete={canDelete}
          formatDateTime={formatDateTime}
          loading={loading}
          onDelete={setDeleteTarget}
          onEdit={openEditForm}
          onPageChange={setPage}
          onViewProducts={openProductDetail}
          page={page}
          pageSize={PAGE_SIZE}
          suppliers={paginatedSuppliers}
          totalCount={visibleSuppliers.length}
        />
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

      <SupplierProductsModal
        formatCurrency={formatCurrency}
        loading={productsLoading}
        onClose={() => setSelectedSupplier(null)}
        products={supplierProducts}
        supplier={selectedSupplier}
      />

      <SupplierDeleteModal
        deleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onDelete={handleDelete}
        supplier={deleteTarget}
      />
    </div>
  )
}
