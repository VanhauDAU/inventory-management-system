import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { hasPermission } from '../../utils/permissions'
import RoleFormModal from './components/RoleFormModal'
import RoleTable from './components/RoleTable'
import SystemDeletePanel from './components/SystemDeletePanel'
import './SystemAdminPage.css'

const emptyForm = {
  name: '',
  permissions: [],
}

const PAGE_SIZE = 10

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
  const [page, setPage] = useState(1)
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

  useEffect(() => {
    setPage(1)
  }, [search])

  const paginatedRoles = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    return filteredRoles.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredRoles, page])

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
        <RoleFormModal
          actionOrder={actionOrder}
          editingRole={editingRole}
          error={error}
          form={form}
          getModuleLabel={getModuleLabel}
          getPermissionAction={getPermissionAction}
          getPermissionLabel={getPermissionLabel}
          onCancel={closeForm}
          onPermissionSearchChange={setPermissionSearch}
          onSubmit={handleSubmit}
          permissionSearch={permissionSearch}
          permissionsByModule={permissionsByModule}
          saving={saving}
          setForm={setForm}
          toggleModule={toggleModule}
          togglePermission={togglePermission}
        />
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

        <RoleTable
          canChange={canChange}
          canDelete={canDelete}
          canManage={canManage}
          getPermissionLabel={getPermissionLabel}
          loading={loading}
          onDelete={setDeleteTarget}
          onEdit={openEditForm}
          onPageChange={setPage}
          page={page}
          pageSize={PAGE_SIZE}
          roles={paginatedRoles}
          totalCount={filteredRoles.length}
        />
      </section>

      <SystemDeletePanel
        description="Không thể xóa nhóm quyền đang có người dùng."
        itemName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        saving={saving}
        title={deleteTarget ? `Xóa nhóm quyền ${deleteTarget.name}?` : ''}
      />
    </div>
  )
}
