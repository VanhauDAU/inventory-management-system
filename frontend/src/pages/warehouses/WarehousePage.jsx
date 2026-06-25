import { useEffect, useMemo, useState } from 'react'
import PaginationControls from '../../components/common/PaginationControls'
import useToast from '../../hooks/useToast'
import { authJson, fetchPaginated } from '../../services/authApi'
import { formatCurrency } from '../../utils/formatters'
import { hasPermission } from '../../utils/permissions'
import './WarehousePage.css'

const initialForm = {
  name: '',
  address: '',
  phone: '',
  manager_name: '',
  is_active: true,
}

const PAGE_SIZE = 10

const getProductPrice = (product) => product?.price ?? product?.selling_price ?? 0

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

function getProductImage(product) {
  return product?.image || '/product-images/product-default.svg'
}

function WarehouseForm({ form, errors, editingWarehouse, onChange, onSubmit, onCancel, loading }) {
  return (
    <form className="warehouse-form" onSubmit={onSubmit} noValidate>
      <div className="warehouse-form-grid">
        <label className="warehouse-field">
          <span>Tên kho <b>*</b></span>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className={errors.name ? 'input-error' : ''}
            placeholder="Ví dụ: Kho trung tâm"
            maxLength={255}
          />
          {errors.name && <small className="warehouse-error">{errors.name}</small>}
        </label>

        <label className="warehouse-field">
          <span>Người phụ trách</span>
          <input
            name="manager_name"
            value={form.manager_name}
            onChange={onChange}
            className={errors.manager_name ? 'input-error' : ''}
            placeholder="Tên quản lý kho"
            maxLength={255}
          />
          {errors.manager_name && <small className="warehouse-error">{errors.manager_name}</small>}
        </label>

        <label className="warehouse-field">
          <span>Số điện thoại</span>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            className={errors.phone ? 'input-error' : ''}
            placeholder="Ví dụ: 0901234567"
            maxLength={30}
          />
          {errors.phone && <small className="warehouse-error">{errors.phone}</small>}
        </label>

        <label className="warehouse-toggle">
          <input
            name="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={onChange}
          />
          <span>Kho đang hoạt động</span>
        </label>

        <label className="warehouse-field warehouse-field-wide">
          <span>Địa chỉ</span>
          <textarea
            name="address"
            value={form.address}
            onChange={onChange}
            className={errors.address ? 'input-error' : ''}
            placeholder="Nhập địa chỉ kho"
            rows={4}
            maxLength={1000}
          />
          {errors.address && <small className="warehouse-error">{errors.address}</small>}
        </label>
      </div>

      <div className="warehouse-form-actions">
        <button type="button" className="warehouse-btn secondary" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button type="submit" className="warehouse-btn primary" disabled={loading}>
          {loading ? 'Đang lưu...' : editingWarehouse ? 'Lưu thay đổi' : 'Thêm kho'}
        </button>
      </div>
    </form>
  )
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

        {loading ? (
          <div className="warehouse-state">Đang tải danh sách kho...</div>
        ) : visibleWarehouses.length === 0 ? (
          <div className="warehouse-state">Không có kho phù hợp.</div>
        ) : (
          <div className="warehouse-table-wrap">
            <table className="warehouse-table">
              <thead>
                <tr>
                  <th>Kho</th>
                  <th>Quản lý</th>
                  <th>SĐT</th>
                  <th>Loại SP</th>
                  <th>Số lượng tồn</th>
                  <th>Phiếu kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedWarehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td>
                      <div className="warehouse-name-cell">
                        <strong>{warehouse.name}</strong>
                        <small>{warehouse.address || 'Chưa có địa chỉ'}</small>
                      </div>
                    </td>
                    <td>{warehouse.manager_name || 'Chưa gán'}</td>
                    <td>{warehouse.phone || 'Chưa có'}</td>
                    <td><span className="warehouse-count">{warehouse.product_kinds_count || 0}</span></td>
                    <td><span className="warehouse-count">{warehouse.total_quantity || 0}</span></td>
                    <td><span className="warehouse-count">{warehouse.stock_transactions_count || 0}</span></td>
                    <td>
                      <span className={`warehouse-status ${warehouse.is_active ? 'active' : 'inactive'}`}>
                        {warehouse.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td>
                      <div className="warehouse-row-actions">
                        <button type="button" className="warehouse-action detail" onClick={() => openStockDetail(warehouse)}>Tồn kho</button>
                        {canChange && <button type="button" className="warehouse-action edit" onClick={() => openEditForm(warehouse)}>Sửa</button>}
                        {canDelete && <button type="button" className="warehouse-action delete" onClick={() => setDeleteTarget(warehouse)}>Xóa</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls
              itemLabel="kho"
              loading={loading}
              onPageChange={setPage}
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={visibleWarehouses.length}
            />
          </div>
        )}
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

      {selectedWarehouse && (
        <div className="warehouse-modal-backdrop" role="presentation" onClick={() => setSelectedWarehouse(null)}>
          <section className="warehouse-modal stock-detail" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="warehouse-modal-header">
              <div>
                <span className="warehouse-eyebrow">Tồn kho theo kho</span>
                <h3>{selectedWarehouse.name}</h3>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setSelectedWarehouse(null)}>×</button>
            </div>

            {stockLoading ? (
              <div className="warehouse-state">Đang tải tồn kho...</div>
            ) : warehouseStocks.length === 0 ? (
              <div className="warehouse-state">Kho này chưa có sản phẩm tồn.</div>
            ) : (
              <div className="warehouse-stock-list">
                {warehouseStocks.map((stock) => {
                  const product = stock.product_detail
                  return (
                    <article className="warehouse-stock-item" key={stock.id}>
                      <img src={getProductImage(product)} alt={product?.name || 'Sản phẩm'} />
                      <div>
                        <strong>{product?.name || `Sản phẩm #${stock.product}`}</strong>
                        <span>{product?.sku || 'Chưa có SKU'} · {product?.category_detail?.name || 'Chưa có danh mục'}</span>
                      </div>
                      <div className="warehouse-stock-numbers">
                        <strong>{stock.quantity}</strong>
                        <span>{formatCurrency(Number(stock.quantity) * Number(getProductPrice(product)))}</span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="warehouse-modal-backdrop" role="presentation" onClick={() => !deleting && setDeleteTarget(null)}>
          <section className="warehouse-modal delete" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="warehouse-modal-header">
              <div>
                <span className="warehouse-eyebrow">Xác nhận xóa</span>
                <h3>{deleteTarget.name}</h3>
              </div>
              <button type="button" aria-label="Đóng" disabled={deleting} onClick={() => setDeleteTarget(null)}>×</button>
            </div>

            {(Number(deleteTarget.total_quantity || 0) > 0 || Number(deleteTarget.stock_transactions_count || 0) > 0) ? (
              <div className="warehouse-notice error">
                Không thể xóa kho này vì {Number(deleteTarget.total_quantity || 0) > 0
                  ? `vẫn còn ${deleteTarget.total_quantity} sản phẩm tồn`
                  : 'đã có phiếu kho'}.
                Hãy tắt trạng thái kho nếu không còn sử dụng.
              </div>
            ) : (
              <p className="warehouse-delete-text">Bạn muốn xóa kho này khỏi hệ thống?</p>
            )}

            <div className="warehouse-delete-actions">
              <button type="button" className="warehouse-btn secondary" disabled={deleting} onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button
                type="button"
                className="warehouse-btn danger"
                disabled={deleting || Number(deleteTarget.total_quantity || 0) > 0 || Number(deleteTarget.stock_transactions_count || 0) > 0}
                onClick={handleDelete}
              >
                {deleting ? 'Đang xóa...' : 'Xóa kho'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
