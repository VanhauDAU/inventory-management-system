import PaginationControls from '../../../components/common/PaginationControls'

export default function RoleTable({
  canChange,
  canDelete,
  canManage,
  getPermissionLabel,
  loading,
  onDelete,
  onEdit,
  onPageChange,
  page,
  pageSize,
  roles,
  totalCount,
}) {
  if (loading) return <div className="system-empty">Đang tải nhóm quyền...</div>
  if (totalCount === 0) return <div className="system-empty">Không có nhóm quyền phù hợp.</div>

  return (
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
          {roles.map((role) => (
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
              {canManage && (
                <td>
                  <div className="system-actions">
                    {canChange && <button type="button" className="system-icon-btn" onClick={() => onEdit(role)}>Sửa</button>}
                    {canDelete && <button type="button" className="system-icon-btn danger" onClick={() => onDelete(role)}>Xóa</button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationControls
        itemLabel="nhóm quyền"
        loading={loading}
        onPageChange={onPageChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  )
}
