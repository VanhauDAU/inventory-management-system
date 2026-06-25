import { useEffect, useMemo, useState } from 'react'
import useToast from '../../hooks/useToast'
import { authJson, fetchPaginated } from '../../services/authApi'
import { formatCurrency } from '../../utils/formatters'
import { hasPermission } from '../../utils/permissions'
import WarehouseDeleteModal from './components/WarehouseDeleteModal'
import WarehouseForm from './components/WarehouseForm'
import WarehouseStockModal from './components/WarehouseStockModal'
import WarehouseTable from './components/WarehouseTable'
import './WarehousePage.css'

const initialForm = {
  name: '',
  address: '',
  phone: '',
  manager_name: '',
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
    name: 'Tên kho',
    address: 'Địa chỉ',
    phone: 'Số điện thoại',
    manager_name: 'Người phụ trách',
    is_active: 'Trạng thái',
  }

  if (firstField && rawMessage) return `${fieldMap[firstField] || firstField}: ${rawMessage}`
  return `Lỗi API: ${fallbackStatus}`
}

export default function WarehousePage({ currentUser }) {
  const canAdd = hasPermission(currentUser, 'inventory.add_warehouse')
  const canChange = hasPermission(currentUser, 'inventory.change_warehouse')
  const canDelete = hasPermission(currentUser, 'inventory.delete_warehouse')
  const [warehouses, setWarehouses] = useState([])
  const [warehouseStocks, setWarehouseStocks] = useState([])
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stockLoading, setStockLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)
  const { clearToast, showToast, toast } = useToast()

  useEffect(() => {
    const controller = new AbortController()

    async function fetchWarehouses() {
      setLoading(true)
      setError('')
      try {
        const allWarehouses = await fetchPaginated('/warehouses/', {
          signal: controller.signal,
          errorResolver: getApiErrorMessage,
        })
        setWarehouses(allWarehouses)
      } catch (requestError) {
        if (requestError.name === 'AbortError') return
        const message = requestError.message || 'Không thể tải danh sách kho.'
        setError(message)
        showToast('error', message)
      } finally {
        setLoading(false)
      }
    }

    fetchWarehouses()
    return () => controller.abort()
  }, [refreshKey])

  const visibleWarehouses = useMemo(() => {
    return warehouses.filter((warehouse) => {
      const keyword = search.trim().toLowerCase()
      const matchesSearch = !keyword ||
        warehouse.name.toLowerCase().includes(keyword) ||
        (warehouse.address || '').toLowerCase().includes(keyword) ||
        (warehouse.manager_name || '').toLowerCase().includes(keyword) ||
        (warehouse.phone || '').toLowerCase().includes(keyword)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && warehouse.is_active) ||
        (statusFilter === 'inactive' && !warehouse.is_active)

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, warehouses])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const paginatedWarehouses = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    return visibleWarehouses.slice(startIndex, startIndex + PAGE_SIZE)
  }, [page, visibleWarehouses])

  const stats = useMemo(() => {
    return {
      total: warehouses.length,
      active: warehouses.filter((warehouse) => warehouse.is_active).length,
      productKinds: warehouses.reduce((sum, warehouse) => sum + Number(warehouse.product_kinds_count || 0), 0),
      totalQuantity: warehouses.reduce((sum, warehouse) => sum + Number(warehouse.total_quantity || 0), 0),
      transactions: warehouses.reduce((sum, warehouse) => sum + Number(warehouse.stock_transactions_count || 0), 0),
    }
  }, [warehouses])

  function openCreateForm() {
    setEditingWarehouse(null)
    setForm(initialForm)
    setErrors({})
    setFormError('')
    setShowForm(true)
  }

  function openEditForm(warehouse) {
    setEditingWarehouse(warehouse)
    setForm({
      name: warehouse.name || '',
      address: warehouse.address || '',
      phone: warehouse.phone || '',
      manager_name: warehouse.manager_name || '',
      is_active: Boolean(warehouse.is_active),
    })
    setErrors({})
    setFormError('')
    setShowForm(true)
  }

  function closeForm(force = false) {
    if (saving && !force) return
    setShowForm(false)
    setEditingWarehouse(null)
    setForm(initialForm)
    setErrors({})
    setFormError('')
  }

  function validateForm() {
    const nextErrors = {}
    const name = form.name.trim()
    const phone = form.phone.trim()

    if (!name) nextErrors.name = 'Vui lòng nhập tên kho'
    else if (name.length < 2) nextErrors.name = 'Tên kho phải có ít nhất 2 ký tự'
    else if (name.length > 255) nextErrors.name = 'Tên kho không được vượt quá 255 ký tự'

    if (phone && !/^[0-9+\-\s()]{8,30}$/.test(phone)) {
      nextErrors.phone = 'Số điện thoại không hợp lệ'
    }

    if (form.manager_name.trim().length > 255) {
      nextErrors.manager_name = 'Người phụ trách không được vượt quá 255 ký tự'
    }

    if (form.address.trim().length > 1000) {
      nextErrors.address = 'Địa chỉ không được vượt quá 1000 ký tự'
    }

    const duplicate = warehouses.find((warehouse) => (
      warehouse.id !== editingWarehouse?.id &&
      warehouse.name.trim().toLowerCase() === name.toLowerCase()
    ))
    if (duplicate) nextErrors.name = 'Tên kho đã tồn tại'

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
      setFormError('Vui lòng kiểm tra lại thông tin kho.')
      showToast('error', 'Vui lòng kiểm tra lại thông tin kho.')
      return
    }

    setSaving(true)
    setFormError('')
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      manager_name: form.manager_name.trim(),
      is_active: form.is_active,
    }

    try {
      if (editingWarehouse) {
        await authJson(`/warehouses/${editingWarehouse.id}/`, {
          method: 'PATCH',
          body: payload,
          errorResolver: getApiErrorMessage,
        })
        showToast('success', 'Đã cập nhật kho thành công.')
      } else {
        await authJson('/warehouses/', {
          method: 'POST',
          body: payload,
          errorResolver: getApiErrorMessage,
        })
        showToast('success', 'Đã thêm kho thành công.')
      }

      closeForm(true)
      setRefreshKey((value) => value + 1)
    } catch (requestError) {
      const message = requestError.message || 'Không thể lưu kho. Vui lòng thử lại.'
      setFormError(message)
      showToast('error', message)
    } finally {
      setSaving(false)
    }
  }

  async function openStockDetail(warehouse) {
    setSelectedWarehouse(warehouse)
    setWarehouseStocks([])
    setStockLoading(true)
    try {
      const allStocks = await fetchPaginated(`/warehouses/${warehouse.id}/stocks/`, {
        errorResolver: getApiErrorMessage,
      })
      setWarehouseStocks(allStocks)
    } catch (requestError) {
      showToast('error', requestError.message || 'Không thể tải tồn kho.')
    } finally {
      setStockLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    const hasStock = Number(deleteTarget.total_quantity || 0) > 0
    const hasTransactions = Number(deleteTarget.stock_transactions_count || 0) > 0
    if (hasStock || hasTransactions) {
      const message = hasStock
        ? 'Không thể xóa kho đang còn sản phẩm tồn. Hãy xuất/chuyển/điều chỉnh hết tồn kho hoặc tắt trạng thái kho.'
        : 'Không thể xóa kho đã có phiếu nhập/xuất/điều chỉnh. Hãy tắt trạng thái kho nếu không còn sử dụng.'
      showToast('error', message)
      return
    }

    setDeleting(true)
    try {
      await authJson(`/warehouses/${deleteTarget.id}/`, { method: 'DELETE', errorResolver: getApiErrorMessage })
      setDeleteTarget(null)
      setRefreshKey((value) => value + 1)
      showToast('success', 'Đã xóa kho thành công.')
    } catch (requestError) {
      showToast('error', requestError.message || 'Không thể xóa kho.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="warehouse-page">
      {toast && (
        <div className={`warehouse-toast ${toast.type}`} role="status" aria-live="polite">
          <div className="warehouse-toast-icon" aria-hidden="true">{toast.type === 'success' ? '✓' : '!'}</div>
          <p>{toast.message}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={clearToast}>×</button>
        </div>
      )}

      <section className="warehouse-header">
        <div>
          <span className="warehouse-eyebrow">Quản lý kho hàng</span>
          <h2>Danh sách kho</h2>
          <p>Xem mỗi kho đang có bao nhiêu loại sản phẩm, tổng số lượng tồn và lịch sử phiếu kho.</p>
        </div>
        {canAdd && (
          <button type="button" className="warehouse-btn primary" onClick={openCreateForm}>
            Thêm kho
          </button>
        )}
      </section>

      <section className="warehouse-stats">
        <article><span>Tổng kho</span><strong>{stats.total}</strong></article>
        <article><span>Đang hoạt động</span><strong>{stats.active}</strong></article>
        <article><span>Loại sản phẩm</span><strong>{stats.productKinds}</strong></article>
        <article><span>Số lượng tồn</span><strong>{stats.totalQuantity}</strong></article>
        <article><span>Phiếu kho</span><strong>{stats.transactions}</strong></article>
      </section>

      <section className="warehouse-filters">
        <label>
          <span>Tìm kiếm</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên kho, địa chỉ, quản lý, SĐT" />
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </label>
      </section>

      {error && <div className="warehouse-notice error">{error}</div>}

      <section className="warehouse-card">
        <div className="warehouse-card-head">
          <span>{visibleWarehouses.length} kho</span>
          <small>Kho đã có phiếu hoặc còn tồn kho thì không xóa trực tiếp; hãy tắt trạng thái kho.</small>
        </div>

        <WarehouseTable
          canChange={canChange}
          canDelete={canDelete}
          loading={loading}
          onDelete={setDeleteTarget}
          onEdit={openEditForm}
          onPageChange={setPage}
          onViewStock={openStockDetail}
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={visibleWarehouses.length}
          warehouses={paginatedWarehouses}
        />
      </section>

      {showForm && (
        <div className="warehouse-modal-backdrop" role="presentation" onClick={closeForm}>
          <section className="warehouse-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="warehouse-modal-header">
              <div>
                <span className="warehouse-eyebrow">Kho hàng</span>
                <h3>{editingWarehouse ? 'Sửa kho' : 'Thêm kho'}</h3>
              </div>
              <button type="button" aria-label="Đóng" disabled={saving} onClick={closeForm}>×</button>
            </div>
            {formError && <div className="warehouse-notice error sticky">{formError}</div>}
            <WarehouseForm
              form={form}
              errors={errors}
              editingWarehouse={editingWarehouse}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              loading={saving}
            />
          </section>
        </div>
      )}

      <WarehouseStockModal
        formatCurrency={formatCurrency}
        loading={stockLoading}
        onClose={() => setSelectedWarehouse(null)}
        stocks={warehouseStocks}
        warehouse={selectedWarehouse}
      />

      <WarehouseDeleteModal
        deleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onDelete={handleDelete}
        warehouse={deleteTarget}
      />
    </div>
  )
}
