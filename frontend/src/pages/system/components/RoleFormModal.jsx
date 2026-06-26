export default function RoleFormModal({
  actionOrder,
  editingRole,
  error,
  form,
  getModuleLabel,
  getPermissionAction,
  getPermissionLabel,
  onCancel,
  onPermissionSearchChange,
  onSubmit,
  permissionSearch,
  permissionsByModule,
  saving,
  setForm,
  toggleModule,
  togglePermission,
}) {
  function toggleVisiblePermissions() {
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
  }

  return (
    <div className="system-modal-backdrop" role="presentation" onClick={onCancel}>
      <section className="system-modal system-modal-wide" role="dialog" aria-modal="true" aria-labelledby="role-form-title" onClick={(event) => event.stopPropagation()}>
        <div className="system-form-head">
          <div>
            <h3 id="role-form-title">{editingRole ? 'Cập nhật nhóm quyền' : 'Thêm nhóm quyền mới'}</h3>
            <small>{form.permissions.length} permission đang được chọn</small>
          </div>
          <button type="button" className="system-modal-close" onClick={onCancel} disabled={saving} aria-label="Đóng popup">×</button>
        </div>

        <form className="system-form" onSubmit={onSubmit}>
          {error && <div className="system-notice error">{error}</div>}

          <div className="system-form-grid">
            <label className="system-field">
              <span>Tên nhóm quyền <b>*</b></span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required maxLength={150} />
            </label>
            <label className="system-field">
              <span>Tìm permission</span>
              <input value={permissionSearch} onChange={(event) => onPermissionSearchChange(event.target.value)} placeholder="Tìm theo module, sản phẩm, kho, view, add..." />
            </label>
            <div className="system-field system-field-wide">
              <div className="system-permission-head">
                <span>Danh sách permission</span>
                <button type="button" className="system-link-btn" onClick={toggleVisiblePermissions}>
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
            <button type="button" className="system-btn secondary" onClick={onCancel} disabled={saving}>Hủy</button>
            <button type="submit" className="system-btn primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu nhóm quyền'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
