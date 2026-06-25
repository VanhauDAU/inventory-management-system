import { useEffect, useMemo, useState } from 'react'
import PaginationControls from '../../components/common/PaginationControls'
import useToast from '../../hooks/useToast'
import { authJson, fetchPaginated } from '../../services/authApi'
import { formatDateTime } from '../../utils/formatters'
import { hasPermission } from '../../utils/permissions'
import './CategoryPage.css'

const initialForm = {
  name: '',
  description: '',
  parent: '',
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
    name: 'Tên danh mục',
    parent: 'Danh mục cha',
    description: 'Mô tả',
    is_active: 'Trạng thái',
  }

  if (firstField && rawMessage) return `${fieldMap[firstField] || firstField}: ${rawMessage}`
  return `Lỗi API: ${fallbackStatus}`
}

function buildCategoryTree(categories) {
  const map = new Map(categories.map((category) => [category.id, { ...category, children: [] }]))
  const roots = []

  map.forEach((category) => {
    if (category.parent && map.has(category.parent)) {
      map.get(category.parent).children.push(category)
    } else {
      roots.push(category)
    }
  })

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    nodes.forEach((node) => sortNodes(node.children))
    return nodes
  }

  return sortNodes(roots)
}

function flattenCategoryTree(nodes, level = 0, result = []) {
  nodes.forEach((node) => {
    result.push({ ...node, level })
    flattenCategoryTree(node.children, level + 1, result)
  })
  return result
}

function getDescendantIds(categories, categoryId) {
  const directChildren = categories.filter((category) => category.parent === categoryId)
  return directChildren.flatMap((child) => [child.id, ...getDescendantIds(categories, child.id)])
}

function CategoryForm({ form, errors, categories, editingCategory, onChange, onSubmit, onCancel, loading }) {
  const blockedParentIds = editingCategory
    ? new Set([editingCategory.id, ...getDescendantIds(categories, editingCategory.id)])
    : new Set()

  const treeOptions = flattenCategoryTree(buildCategoryTree(categories))

  return (
    <form className="category-form" onSubmit={onSubmit} noValidate>
      <div className="category-form-grid">
        <label className="category-field">
          <span>Tên danh mục <b>*</b></span>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className={errors.name ? 'input-error' : ''}
            placeholder="Ví dụ: Phụ kiện máy tính"
            maxLength={100}
          />
          {errors.name && <small className="category-error">{errors.name}</small>}
        </label>

        <label className="category-field">
          <span>Danh mục cha</span>
          <select
            name="parent"
            value={form.parent}
            onChange={onChange}
            className={errors.parent ? 'input-error' : ''}
          >
            <option value="">Không có danh mục cha</option>
            {treeOptions.map((category) => (
              <option key={category.id} value={category.id} disabled={blockedParentIds.has(category.id)}>
                {'— '.repeat(category.level)}{category.name}
              </option>
            ))}
          </select>
          {errors.parent && <small className="category-error">{errors.parent}</small>}
        </label>

        <label className="category-field category-field-wide">
          <span>Mô tả</span>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className={errors.description ? 'input-error' : ''}
            placeholder="Nhập mô tả ngắn cho nhóm sản phẩm"
            rows={4}
            maxLength={1000}
          />
          {errors.description && <small className="category-error">{errors.description}</small>}
        </label>

        <label className="category-toggle">
          <input
            name="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={onChange}
          />
          <span>Đang sử dụng danh mục này</span>
        </label>
      </div>

      <div className="category-form-actions">
        <button type="button" className="category-btn secondary" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button type="submit" className="category-btn primary" disabled={loading}>
          {loading ? 'Đang lưu...' : editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
        </button>
      </div>
    </form>
  )
}

export default function CategoryPage({ currentUser }) {
  const canAdd = hasPermission(currentUser, 'categories.add_category')
  const canChange = hasPermission(currentUser, 'categories.change_category')
  const canDelete = hasPermission(currentUser, 'categories.delete_category')
  const canManage = canChange || canDelete
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [parentFilter, setParentFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)
  const { clearToast, showToast, toast } = useToast()

  useEffect(() => {
    const controller = new AbortController()

    async function fetchCategories() {
      setLoading(true)
      setError('')
      try {
        const allCategories = await fetchPaginated('/categories/', {
          signal: controller.signal,
          errorResolver: getApiErrorMessage,
        })
        setCategories(allCategories)
      } catch (requestError) {
        if (requestError.name === 'AbortError') return
        const message = requestError.message || 'Không thể tải danh mục sản phẩm.'
        setError(message)
        showToast('error', message)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
    return () => controller.abort()
  }, [refreshKey])

  const tree = useMemo(() => buildCategoryTree(categories), [categories])
  const flatCategories = useMemo(() => flattenCategoryTree(tree), [tree])

  const visibleCategories = useMemo(() => {
    return flatCategories.filter((category) => {
      const keyword = search.trim().toLowerCase()
      const matchesSearch = !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        (category.description || '').toLowerCase().includes(keyword)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && category.is_active) ||
        (statusFilter === 'inactive' && !category.is_active)
      const matchesParent =
        parentFilter === 'all' ||
        (parentFilter === 'root' && !category.parent) ||
        String(category.parent || '') === parentFilter

      return matchesSearch && matchesStatus && matchesParent
    })
  }, [flatCategories, parentFilter, search, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [parentFilter, search, statusFilter])

  const paginatedCategories = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    return visibleCategories.slice(startIndex, startIndex + PAGE_SIZE)
  }, [page, visibleCategories])

  const stats = useMemo(() => {
    const rootCount = categories.filter((category) => !category.parent).length
    const childCount = categories.length - rootCount
    const productsCount = categories.reduce((sum, category) => sum + Number(category.products_count || 0), 0)
    return {
      total: categories.length,
      active: categories.filter((category) => category.is_active).length,
      rootCount,
      childCount,
      productsCount,
    }
  }, [categories])

  function openCreateForm() {
    setEditingCategory(null)
    setForm(initialForm)
    setErrors({})
    setFormError('')
    setShowForm(true)
  }

  function openEditForm(category) {
    setEditingCategory(category)
    setForm({
      name: category.name || '',
      description: category.description || '',
      parent: category.parent || '',
      is_active: Boolean(category.is_active),
    })
    setErrors({})
    setFormError('')
    setShowForm(true)
  }

  function closeForm(force = false) {
    if (saving && !force) return
    setShowForm(false)
    setEditingCategory(null)
    setForm(initialForm)
    setErrors({})
    setFormError('')
  }

  function validateForm() {
    const nextErrors = {}
    const name = form.name.trim()

    if (!name) nextErrors.name = 'Vui lòng nhập tên danh mục'
    else if (name.length < 2) nextErrors.name = 'Tên danh mục phải có ít nhất 2 ký tự'
    else if (name.length > 100) nextErrors.name = 'Tên danh mục không được vượt quá 100 ký tự'

    if (form.description.trim().length > 1000) {
      nextErrors.description = 'Mô tả không được vượt quá 1000 ký tự'
    }

    if (form.parent) {
      const parentId = Number(form.parent)
      const parent = categories.find((category) => category.id === parentId)
      if (!parent) nextErrors.parent = 'Danh mục cha không hợp lệ'
      if (editingCategory && parentId === editingCategory.id) {
        nextErrors.parent = 'Danh mục không thể là cha của chính nó'
      }
      if (editingCategory && getDescendantIds(categories, editingCategory.id).includes(parentId)) {
        nextErrors.parent = 'Không thể chọn danh mục con làm danh mục cha'
      }
    }

    const duplicate = categories.find((category) => (
      category.id !== editingCategory?.id &&
      category.name.trim().toLowerCase() === name.toLowerCase() &&
      String(category.parent || '') === String(form.parent || '')
    ))
    if (duplicate) nextErrors.name = 'Tên danh mục đã tồn tại trong cùng danh mục cha'

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
      setFormError('Vui lòng kiểm tra lại thông tin danh mục.')
      showToast('error', 'Vui lòng kiểm tra lại thông tin danh mục.')
      return
    }

    setSaving(true)
    setFormError('')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      parent: form.parent ? Number(form.parent) : null,
      is_active: form.is_active,
    }

    try {
      if (editingCategory) {
        await authJson(`/categories/${editingCategory.id}/`, {
          method: 'PATCH',
          body: payload,
          errorResolver: getApiErrorMessage,
        })
        showToast('success', 'Đã cập nhật danh mục thành công.')
      } else {
        await authJson('/categories/', {
          method: 'POST',
          body: payload,
          errorResolver: getApiErrorMessage,
        })
        showToast('success', 'Đã thêm danh mục thành công.')
      }

      closeForm(true)
      setRefreshKey((value) => value + 1)
    } catch (requestError) {
      const message = requestError.message || 'Không thể lưu danh mục. Vui lòng thử lại.'
      setFormError(message)
      showToast('error', message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    if (Number(deleteTarget.products_count || 0) > 0) {
      const message = 'Không thể xóa danh mục đang có sản phẩm. Hãy chuyển sản phẩm sang danh mục khác hoặc tắt trạng thái danh mục.'
      showToast('error', message)
      return
    }

    setDeleting(true)
    try {
      await authJson(`/categories/${deleteTarget.id}/`, { method: 'DELETE', errorResolver: getApiErrorMessage })
      setDeleteTarget(null)
      setRefreshKey((value) => value + 1)
      showToast('success', 'Đã xóa danh mục thành công.')
    } catch (requestError) {
      showToast('error', requestError.message || 'Không thể xóa danh mục.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="category-page">
      {toast && (
        <div className={`category-toast ${toast.type}`} role="status" aria-live="polite">
          <div className="category-toast-icon" aria-hidden="true">{toast.type === 'success' ? '✓' : '!'}</div>
          <p>{toast.message}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={clearToast}>×</button>
        </div>
      )}

      <section className="category-header">
        <div>
          <span className="category-eyebrow">Quản lý sản phẩm</span>
          <h2>Danh mục sản phẩm</h2>
          <p>Quản lý danh mục cha, danh mục con, trạng thái sử dụng và số sản phẩm trong từng danh mục.</p>
        </div>
        {canAdd && (
          <button type="button" className="category-btn primary" onClick={openCreateForm}>
            Thêm danh mục
          </button>
        )}
      </section>

      <section className="category-stats">
        <article><span>Tổng danh mục</span><strong>{stats.total}</strong></article>
        <article><span>Đang sử dụng</span><strong>{stats.active}</strong></article>
        <article><span>Danh mục cha</span><strong>{stats.rootCount}</strong></article>
        <article><span>Danh mục con</span><strong>{stats.childCount}</strong></article>
        <article><span>Sản phẩm liên kết</span><strong>{stats.productsCount}</strong></article>
      </section>

      <section className="category-filters">
        <label>
          <span>Tìm kiếm</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên hoặc mô tả danh mục" />
        </label>
        <label>
          <span>Danh mục cha</span>
          <select value={parentFilter} onChange={(event) => setParentFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="root">Chỉ danh mục cha</option>
            {flatCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {'— '.repeat(category.level)}{category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="active">Đang sử dụng</option>
            <option value="inactive">Tạm ẩn</option>
          </select>
        </label>
      </section>

      {error && <div className="category-notice error">{error}</div>}

      <section className="category-card">
        <div className="category-card-head">
          <span>{visibleCategories.length} danh mục</span>
          <small>Không xóa được danh mục đang có sản phẩm; hãy chuyển sản phẩm hoặc tạm ẩn danh mục.</small>
        </div>

        {loading ? (
          <div className="category-state">Đang tải danh mục...</div>
        ) : visibleCategories.length === 0 ? (
          <div className="category-state">Không có danh mục phù hợp.</div>
        ) : (
          <div className="category-table-wrap">
            <table className="category-table">
              <thead>
                <tr>
                  <th>Danh mục</th>
                  <th>Danh mục cha</th>
                  <th>Sản phẩm</th>
                  <th>Danh mục con</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật</th>
                  {canManage && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="category-name-cell" style={{ paddingLeft: `${category.level * 1.25}rem` }}>
                        <span className="category-level-dot" />
                        <div>
                          <strong>{category.name}</strong>
                          <small>{category.description || 'Chưa có mô tả'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{category.parent_name || 'Danh mục gốc'}</td>
                    <td><span className="category-count">{category.products_count || 0}</span></td>
                    <td><span className="category-count">{category.children_count || 0}</span></td>
                    <td>
                      <span className={`category-status ${category.is_active ? 'active' : 'inactive'}`}>
                        {category.is_active ? 'Đang sử dụng' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td>{formatDateTime(category.updated_at)}</td>
                    {canManage && <td>
                      <div className="category-row-actions">
                        {canChange && <button type="button" className="category-action edit" onClick={() => openEditForm(category)}>Sửa</button>}
                        {canDelete && <button type="button" className="category-action delete" onClick={() => setDeleteTarget(category)}>Xóa</button>}
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls
              itemLabel="danh mục"
              loading={loading}
              onPageChange={setPage}
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={visibleCategories.length}
            />
          </div>
        )}
      </section>

      {showForm && (
        <div className="category-modal-backdrop" role="presentation" onClick={closeForm}>
          <section className="category-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="category-modal-header">
              <div>
                <span className="category-eyebrow">Danh mục sản phẩm</span>
                <h3>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              </div>
              <button type="button" aria-label="Đóng" disabled={saving} onClick={closeForm}>×</button>
            </div>
            {formError && <div className="category-notice error sticky">{formError}</div>}
            <CategoryForm
              form={form}
              errors={errors}
              categories={categories}
              editingCategory={editingCategory}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              loading={saving}
            />
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="category-modal-backdrop" role="presentation" onClick={() => !deleting && setDeleteTarget(null)}>
          <section className="category-modal delete" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="category-modal-header">
              <div>
                <span className="category-eyebrow">Xác nhận xóa</span>
                <h3>{deleteTarget.name}</h3>
              </div>
              <button type="button" aria-label="Đóng" disabled={deleting} onClick={() => setDeleteTarget(null)}>×</button>
            </div>

            {Number(deleteTarget.products_count || 0) > 0 ? (
              <div className="category-notice error">
                Danh mục này đang có {deleteTarget.products_count} sản phẩm nên không thể xóa.
                Hãy chuyển các sản phẩm sang danh mục khác hoặc tắt trạng thái danh mục.
              </div>
            ) : (
              <p className="category-delete-text">
                Bạn muốn xóa danh mục này? Nếu danh mục có danh mục con, các danh mục con sẽ được chuyển về không có danh mục cha.
              </p>
            )}

            <div className="category-delete-actions">
              <button type="button" className="category-btn secondary" disabled={deleting} onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button
                type="button"
                className="category-btn danger"
                disabled={deleting || Number(deleteTarget.products_count || 0) > 0}
                onClick={handleDelete}
              >
                {deleting ? 'Đang xóa...' : 'Xóa danh mục'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
