import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { hasPermission } from '../../utils/permissions'
import './SystemAdminPage.css'

const emptyForm = {
  name: '',
  permissions: [],
}

const actionOrder = ['view', 'add', 'change', 'delete']

const unwrapList = (data) => Array.isArray(data) ? data : data?.results || []

async function fetchAllPages(path, signal) {
  const items = []
  let nextPath = path

  while (nextPath) {
    const response = await api.get(nextPath, { signal })
    const data = response.data
    items.push(...unwrapList(data))
    if (!data?.next) break
    nextPath = data.next.replace(api.defaults.baseURL, '').replace(/^\/api/, '')
  }

  return items
}

function getApiError(error) {
  const data = error.response?.data
  if (typeof data === 'string') return data
  if (data?.detail) return data.detail
  if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0]
  if (data && typeof data === 'object') {
    const field = Object.keys(data)[0]
    const value = data[field]
    const message = Array.isArray(value) ? value[0] : value
    if (message) return `${field}: ${message}`
  }
  return 'Không thể thực hiện thao tác. Vui lòng thử lại.'
}

function getPermissionLabel(permission) {
  const actionMap = {
    add: 'Thêm',
    change: 'Sửa',
    delete: 'Xóa',
    view: 'Xem',
  }
  const action = getPermissionAction(permission)
  return actionMap[action] || permission.name
}

function getPermissionAction(permission) {
  return permission.codename?.split('_')[0] || ''
}

function getModuleName(permission) {
  const model = permission.model || 'system'
  const app = permission.app_label || 'auth'
  return `${app}.${model}`
}

function getModuleLabel(moduleName) {
  return moduleName
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ')
}

export default function RoleManagementPage({ currentUser }) {
  const canAdd = hasPermission(currentUser, 'auth.add_group')
  const canChange = hasPermission(currentUser, 'auth.change_group')
  const canDelete = hasPermission(currentUser, 'auth.delete_group')
  const canManage = canChange || canDelete
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)

  async function loadData(signal) {
    setLoading(true)
    setError('')
    try {
      const [roleList, permissionList] = await Promise.all([
        fetchAllPages('/roles/?ordering=name', signal),
        fetchAllPages('/permissions/?ordering=content_type__app_label,content_type__model,codename', signal),
      ])
      setRoles(roleList)
      setPermissions(permissionList)
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(getApiError(err))
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [])

  const filteredRoles = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return roles
    return roles.filter((role) => [
      role.name,
      ...(role.permission_details || []).map((permission) => `${permission.name} ${permission.codename} ${permission.app_label} ${permission.model}`),
    ].join(' ').toLowerCase().includes(keyword))
  }, [roles, search])

  const filteredPermissions = useMemo(() => {
    const keyword = permissionSearch.trim().toLowerCase()
    if (!keyword) return permissions
    return permissions.filter((permission) => [
      permission.name,
      permission.codename,
      permission.app_label,
      permission.model,
      getPermissionLabel(permission),
    ].join(' ').toLowerCase().includes(keyword))
  }, [permissionSearch, permissions])

  const permissionsByModule = useMemo(() => {
    const map = filteredPermissions.reduce((currentMap, permission) => {
      const moduleName = getModuleName(permission)
      if (!currentMap.has(moduleName)) currentMap.set(moduleName, [])
      currentMap.get(moduleName).push(permission)
      return currentMap
    }, new Map())

    return Array.from(map.entries())
      .map(([moduleName, modulePermissions]) => ({
        moduleName,
        permissions: modulePermissions.sort((a, b) => {
          const actionA = actionOrder.indexOf(getPermissionAction(a))
          const actionB = actionOrder.indexOf(getPermissionAction(b))
          return (actionA === -1 ? 99 : actionA) - (actionB === -1 ? 99 : actionB)
        }),
      }))
      .sort((a, b) => a.moduleName.localeCompare(b.moduleName))
  }, [filteredPermissions])

  const stats = useMemo(() => ({
    roles: roles.length,
    permissions: permissions.length,
    assigned: roles.reduce((sum, role) => sum + (role.permissions?.length || 0), 0),
    users: roles.reduce((sum, role) => sum + Number(role.users_count || 0), 0),
  }), [permissions.length, roles])

  function openCreateForm() {
    setEditingRole(null)
    setForm(emptyForm)
    setPermissionSearch('')
    setShowForm(true)
    setError('')
  }

  function openEditForm(role) {
    setEditingRole(role)
    setForm({
      name: role.name || '',
      permissions: (role.permissions || []).map(String),
    })
    setPermissionSearch('')
    setShowForm(true)
    setError('')
  }

  function closeForm() {
    if (saving) return
    setShowForm(false)
    setEditingRole(null)
    setForm(emptyForm)
    setPermissionSearch('')
    setError('')
  }

  function togglePermission(permissionId) {
    const id = String(permissionId)
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(id)
        ? current.permissions.filter((item) => item !== id)
        : [...current.permissions, id],
    }))
  }

  function toggleModule(modulePermissions, checked) {
    const moduleIds = modulePermissions.map((permission) => String(permission.id))
    setForm((current) => {
      const currentSet = new Set(current.permissions)
      moduleIds.forEach((id) => {
        if (checked) currentSet.add(id)
        else currentSet.delete(id)
      })
      return { ...current, permissions: Array.from(currentSet) }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setToast('')
    const payload = {
      name: form.name.trim(),
      permissions: form.permissions.map(Number),
    }

    try {
      if (editingRole) {
        await api.patch(`/roles/${editingRole.id}/`, payload)
        setToast('Đã cập nhật nhóm quyền.')
      } else {
        await api.post('/roles/', payload)
        setToast('Đã tạo nhóm quyền mới.')
      }
      setShowForm(false)
      setEditingRole(null)
      setForm(emptyForm)
      await loadData(new AbortController().signal)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    setError('')
    setToast('')
    try {
      await api.delete(`/roles/${deleteTarget.id}/`)
      setToast('Đã xóa nhóm quyền.')
      setDeleteTarget(null)
      await loadData(new AbortController().signal)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="system-page">
      <section className="system-header">
        <div>
          <span className="system-eyebrow">Hệ thống</span>
          <h2>Nhóm quyền</h2>
          <p>Tạo vai trò theo nghiệp vụ và gán các quyền Django tương ứng để quản lý truy cập theo nhóm.</p>
        </div>
        {canAdd && <button type="button" className="system-btn primary" onClick={openCreateForm}>Thêm nhóm quyền</button>}
      </section>

      {error && !showForm && <div className="system-notice error">{error}</div>}
      {toast && <div className="system-notice success">{toast}</div>}

      <section className="system-stats">
        <article><span>Nhóm quyền</span><strong>{stats.roles}</strong></article>
        <article><span>Permission hệ thống</span><strong>{stats.permissions}</strong></article>
        <article><span>Lượt gán permission</span><strong>{stats.assigned}</strong></article>
        <article><span>Người dùng trong nhóm</span><strong>{stats.users}</strong></article>
      </section>

      {showForm && (
        <div className="system-modal-backdrop" role="presentation" onClick={closeForm}>
          <section className="system-modal system-modal-wide" role="dialog" aria-modal="true" aria-labelledby="role-form-title" onClick={(event) => event.stopPropagation()}>
            <div className="system-form-head">
              <div>
                <h3 id="role-form-title">{editingRole ? 'Cập nhật nhóm quyền' : 'Thêm nhóm quyền mới'}</h3>
                <small>{form.permissions.length} permission đang được chọn</small>
              </div>
              <button type="button" className="system-modal-close" onClick={closeForm} disabled={saving} aria-label="Đóng popup">×</button>
            </div>

            <form className="system-form" onSubmit={handleSubmit}>
              {error && <div className="system-notice error">{error}</div>}

              <div className="system-form-grid">
                <label className="system-field">
                  <span>Tên nhóm quyền <b>*</b></span>
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required maxLength={150} />
                </label>
                <label className="system-field">
                  <span>Tìm permission</span>
                  <input value={permissionSearch} onChange={(event) => setPermissionSearch(event.target.value)} placeholder="Tìm theo module, sản phẩm, kho, view, add..." />
                </label>
                <div className="system-field system-field-wide">
                  <div className="system-permission-head">
                    <span>Danh sách permission</span>
                    <button
                      type="button"
                      className="system-link-btn"
                      onClick={() => {
                        const visibleIds = permissionsByModule.flatMap((module) => module.permissions.map((permission) => String(permission.id)))
                        const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => form.permissions.includes(id))
                        setForm((current) => {
                          const currentSet = new Set(current.permissions)
                          visibleIds.forEach((id) => {
                            if (allVisibleSelected) currentSet.delete(id)
                            else currentSet.add(id)
                          })
                          return { ...current, permissions: Array.from(currentSet) }
                        })
                      }}
                    >
                      Chọn/Bỏ chọn kết quả đang lọc
                    </button>
                  </div>

                  <div className="system-permission-table-wrap">
                    {permissionsByModule.length === 0 && <div className="system-empty">Không tìm thấy permission phù hợp.</div>}
                    {permissionsByModule.length > 0 && (
                      <table className="system-permission-table">
                        <thead>
                          <tr>
                            <th>Module</th>
                            <th>Tất cả</th>
                            {actionOrder.map((action) => (
                              <th key={action}>{getPermissionLabel({ codename: action })}</th>
                            ))}
                            <th>Khác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {permissionsByModule.map(({ moduleName, permissions: modulePermissions }) => {
                            const moduleIds = modulePermissions.map((permission) => String(permission.id))
                            const selectedCount = moduleIds.filter((id) => form.permissions.includes(id)).length
                            const allChecked = moduleIds.length > 0 && selectedCount === moduleIds.length
                            const byAction = modulePermissions.reduce((map, permission) => {
                              map[getPermissionAction(permission)] = permission
                              return map
                            }, {})
                            const otherPermissions = modulePermissions.filter((permission) => !actionOrder.includes(getPermissionAction(permission)))

                            return (
                              <tr key={moduleName}>
                                <td>
                                  <strong>{getModuleLabel(moduleName)}</strong>
                                  <small>{selectedCount}/{moduleIds.length} quyền được chọn · {moduleName}</small>
                                </td>
                                <td>
                                  <input type="checkbox" checked={allChecked} onChange={(event) => toggleModule(modulePermissions, event.target.checked)} aria-label={`Chọn tất cả quyền ${moduleName}`} />
                                </td>
                                {actionOrder.map((action) => {
                                  const permission = byAction[action]
                                  return (
                                    <td key={action}>
                                      {permission ? (
                                        <input
                                          type="checkbox"
                                          checked={form.permissions.includes(String(permission.id))}
                                          onChange={() => togglePermission(permission.id)}
                                          aria-label={`${getPermissionLabel(permission)} ${moduleName}`}
                                        />
                                      ) : (
                                        <span className="system-permission-missing">-</span>
                                      )}
                                    </td>
                                  )
                                })}
                                <td>
                                  <div className="system-permission-extra">
                                    {otherPermissions.length === 0 && <span className="system-permission-missing">-</span>}
                                    {otherPermissions.map((permission) => (
                                      <label key={permission.id}>
                                        <input type="checkbox" checked={form.permissions.includes(String(permission.id))} onChange={() => togglePermission(permission.id)} />
                                        {permission.name}
                                      </label>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              <div className="system-form-actions">
                <button type="button" className="system-btn secondary" onClick={closeForm} disabled={saving}>Hủy</button>
                <button type="submit" className="system-btn primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu nhóm quyền'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="system-toolbar">
        <label className="system-field">
          <span>Tìm kiếm nhóm quyền</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên nhóm, permission, module..." />
        </label>
        <div className="system-check">
          <span>Gợi ý</span>
          <label>Gán nhóm quyền cho user tại trang Người dùng</label>
        </div>
      </section>

      <section className="system-card">
        <div className="system-card-head">
          <div>
            <h3>Danh sách nhóm quyền</h3>
            <small>{filteredRoles.length} nhóm quyền phù hợp</small>
          </div>
        </div>

        {loading ? (
          <div className="system-empty">Đang tải nhóm quyền...</div>
        ) : filteredRoles.length === 0 ? (
          <div className="system-empty">Không có nhóm quyền phù hợp.</div>
        ) : (
          <div className="system-table-wrap">
            <table className="system-table">
              <thead>
                <tr>
                  <th>Nhóm quyền</th>
                  <th>Permission</th>
                  <th>Người dùng</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <strong>{role.name}</strong>
                      <small>ID #{role.id}</small>
                    </td>
                    <td>
                      <div className="system-badges">
                        {(role.permission_details || []).length === 0 && <span className="system-badge">Chưa gán permission</span>}
                        {(role.permission_details || []).slice(0, 8).map((permission) => (
                          <span className="system-badge blue" key={permission.id}>{getPermissionLabel(permission)}</span>
                        ))}
                        {(role.permission_details || []).length > 8 && (
                          <span className="system-badge">+{role.permission_details.length - 8}</span>
                        )}
                      </div>
                    </td>
                    <td><span className="system-badge green">{role.users_count || 0} người dùng</span></td>
                    {canManage && <td>
                      <div className="system-actions">
                        {canChange && <button type="button" className="system-icon-btn" onClick={() => openEditForm(role)}>Sửa</button>}
                        {canDelete && <button type="button" className="system-icon-btn danger" onClick={() => setDeleteTarget(role)}>Xóa</button>}
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deleteTarget && (
        <section className="system-form-panel">
          <div className="system-form-head">
            <div>
              <h3>Xóa nhóm quyền {deleteTarget.name}?</h3>
              <small>Không thể xóa nhóm quyền đang có người dùng.</small>
            </div>
            <div className="system-actions">
              <button type="button" className="system-btn secondary" onClick={() => setDeleteTarget(null)} disabled={saving}>Hủy</button>
              <button type="button" className="system-btn danger" onClick={handleDelete} disabled={saving}>{saving ? 'Đang xóa...' : 'Xóa'}</button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
