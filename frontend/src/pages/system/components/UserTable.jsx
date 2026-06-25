import PaginationControls from '../../../components/common/PaginationControls'

export default function UserTable({
  canChange,
  canDelete,
  canManage,
  formatDate,
  loading,
  onDelete,
  onEdit,
  onPageChange,
  page,
  pageSize,
  totalCount,
  users,
}) {
  if (loading) return <div className="system-empty">Đang tải người dùng...</div>
  if (totalCount === 0) return <div className="system-empty">Không có người dùng phù hợp.</div>

  return (
    <div className="system-table-wrap">
      <table className="system-table">
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Nhóm quyền</th>
            <th>Trạng thái</th>
            <th>Lần đăng nhập cuối</th>
            {canManage && <th></th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <strong>{user.full_name || user.username}</strong>
                <small>{user.username} · {user.email || 'Chưa có email'}</small>
              </td>
              <td>
                <div className="system-badges">
                  {(user.group_names || []).length === 0 && <span className="system-badge">Chưa gán</span>}
                  {(user.group_names || []).map((name) => <span className="system-badge blue" key={name}>{name}</span>)}
                </div>
              </td>
              <td>
                <div className="system-badges">
                  <span className={`system-badge ${user.is_active ? 'green' : 'red'}`}>{user.is_active ? 'Hoạt động' : 'Đã khóa'}</span>
                  {user.is_staff && <span className="system-badge amber">Staff</span>}
                  {user.is_superuser && <span className="system-badge red">Superuser</span>}
                </div>
              </td>
              <td>{formatDate(user.last_login)}</td>
              {canManage && (
                <td>
                  <div className="system-actions">
                    {canChange && <button type="button" className="system-icon-btn" onClick={() => onEdit(user)}>Sửa</button>}
                    {canDelete && <button type="button" className="system-icon-btn danger" onClick={() => onDelete(user)}>Xóa</button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationControls
        itemLabel="người dùng"
        loading={loading}
        onPageChange={onPageChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  )
}
