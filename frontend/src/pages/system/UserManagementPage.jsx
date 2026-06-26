import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { hasPermission } from '../../utils/permissions'
import SystemDeletePanel from './components/SystemDeletePanel'
import UserFormModal from './components/UserFormModal'
import UserTable from './components/UserTable'
import './SystemAdminPage.css'

const emptyForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  is_active: true,
  is_staff: false,
  is_superuser: false,
  groups: [],
}

const PAGE_SIZE = 10

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

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('current_user') || '{}')
  } catch {
    return {}
  }
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

function formatDate(value) {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function UserManagementPage({ currentUser }) {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const resolvedCurrentUser = currentUser || getCurrentUser()
  const canAdd = hasPermission(resolvedCurrentUser, 'auth.add_user')
  const canChange = hasPermission(resolvedCurrentUser, 'auth.change_user')
  const canDelete = hasPermission(resolvedCurrentUser, 'auth.delete_user')
  const canManageAdminFlags = !!resolvedCurrentUser?.is_superuser
  const canManage = canChange || canDelete

  async function loadData(signal) {
    setLoading(true)
    setError('')
    try {
      const [userList, roleList] = await Promise.all([
        fetchAllPages('/users/?ordering=username', signal),
        fetchAllPages('/roles/?ordering=name', signal),
      ])
      setUsers(userList)
      setRoles(roleList)
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

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return users.filter((user) => {
      const roleMatch = roleFilter === 'all' || (user.groups || []).map(String).includes(roleFilter)
      if (!roleMatch) return false
      if (!keyword) return true
      return [
        user.username,
        user.email,
        user.first_name,
        user.last_name,
        user.full_name,
        ...(user.group_names || []),
      ].filter(Boolean).join(' ').toLowerCase().includes(keyword)
    })
  }, [roleFilter, search, users])

  useEffect(() => {
    setPage(1)
  }, [roleFilter, search])

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredUsers, page])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.is_active).length,
    staff: users.filter((user) => user.is_staff).length,
    superuser: users.filter((user) => user.is_superuser).length,
  }), [users])

  function openCreateForm() {
    setEditingUser(null)
    setForm(emptyForm)
    setShowForm(true)
    setError('')
  }

  function openEditForm(user) {
    setEditingUser(user)
    setForm({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: '',
      is_active: !!user.is_active,
      is_staff: !!user.is_staff,
      is_superuser: !!user.is_superuser,
      groups: (user.groups || []).map(String),
    })
    setShowForm(true)
    setError('')
  }

  function closeForm() {
    if (saving) return
    setShowForm(false)
    setEditingUser(null)
    setForm(emptyForm)
    setError('')
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function toggleRole(roleId) {
    const id = String(roleId)
    setForm((current) => ({
      ...current,
      groups: current.groups.includes(id)
        ? current.groups.filter((item) => item !== id)
        : [...current.groups, id],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setToast('')

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      is_active: form.is_active,
      groups: form.groups.map(Number),
    }

    if (form.password.trim()) payload.password = form.password.trim()
    if (canManageAdminFlags) {
      payload.is_staff = form.is_staff
      payload.is_superuser = form.is_superuser
    }

    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}/`, payload)
        setToast('Đã cập nhật người dùng.')
      } else {
        await api.post('/users/', payload)
        setToast('Đã tạo người dùng mới.')
      }
      setShowForm(false)
      setEditingUser(null)
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
      await api.delete(`/users/${deleteTarget.id}/`)
      setToast('Đã xóa người dùng.')
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
          <h2>Quản lý người dùng</h2>
          <p>Tạo tài khoản, khóa/mở tài khoản và gán nhóm quyền cho nhân sự sử dụng hệ thống.</p>
        </div>
        {canAdd && <button type="button" className="system-btn primary" onClick={openCreateForm}>Thêm người dùng</button>}
      </section>

      {error && !showForm && <div className="system-notice error">{error}</div>}
      {toast && <div className="system-notice success">{toast}</div>}

      <section className="system-stats">
        <article><span>Tổng người dùng</span><strong>{stats.total}</strong></article>
        <article><span>Đang hoạt động</span><strong>{stats.active}</strong></article>
        <article><span>Nhân viên quản trị</span><strong>{stats.staff}</strong></article>
        <article><span>Superuser</span><strong>{stats.superuser}</strong></article>
      </section>

      {showForm && (
        <UserFormModal
          canManageAdminFlags={canManageAdminFlags}
          editingUser={editingUser}
          error={error}
          form={form}
          onCancel={closeForm}
          onChange={handleChange}
          onSubmit={handleSubmit}
          roles={roles}
          saving={saving}
          toggleRole={toggleRole}
        />
      )}

      <section className="system-toolbar">
        <label className="system-field">
          <span>Tìm kiếm</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên đăng nhập, email, nhóm quyền..." />
        </label>
        <label className="system-field">
          <span>Lọc nhóm quyền</span>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            {roles.map((role) => <option key={role.id} value={String(role.id)}>{role.name}</option>)}
          </select>
        </label>
      </section>

      <section className="system-card">
        <div className="system-card-head">
          <div>
            <h3>Danh sách tài khoản</h3>
            <small>{filteredUsers.length} người dùng phù hợp</small>
          </div>
        </div>

        <UserTable
          canChange={canChange}
          canDelete={canDelete}
          canManage={canManage}
          formatDate={formatDate}
          loading={loading}
          onDelete={setDeleteTarget}
          onEdit={openEditForm}
          onPageChange={setPage}
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={filteredUsers.length}
          users={paginatedUsers}
        />
      </section>

      <SystemDeletePanel
        description="Thao tác này không thể hoàn tác. Không thể xóa chính tài khoản đang đăng nhập."
        itemName={deleteTarget?.username}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        saving={saving}
        title={deleteTarget ? `Xóa người dùng ${deleteTarget.username}?` : ''}
      />
    </div>
  )
}
