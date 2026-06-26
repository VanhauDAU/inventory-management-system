export default function UserFormModal({
  canManageAdminFlags,
  editingUser,
  error,
  form,
  onCancel,
  onChange,
  onSubmit,
  roles,
  saving,
  toggleRole,
}) {
  return (
    <div className="system-modal-backdrop" role="presentation" onClick={onCancel}>
      <section className="system-modal" role="dialog" aria-modal="true" aria-labelledby="user-form-title" onClick={(event) => event.stopPropagation()}>
        <div className="system-form-head">
          <div>
            <h3 id="user-form-title">{editingUser ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}</h3>
            <small>{canManageAdminFlags ? 'Bạn có thể gán quyền staff/superuser.' : 'Bạn chỉ có thể quản lý người dùng thường và nhóm quyền.'}</small>
          </div>
          <button type="button" className="system-modal-close" onClick={onCancel} disabled={saving} aria-label="Đóng popup">×</button>
        </div>

        <form className="system-form" onSubmit={onSubmit}>
          {error && <div className="system-notice error">{error}</div>}

          <div className="system-form-grid three">
            <label className="system-field">
              <span>Tên đăng nhập <b>*</b></span>
              <input name="username" value={form.username} onChange={onChange} required maxLength={150} />
            </label>
            <label className="system-field">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={onChange} maxLength={254} />
            </label>
            <label className="system-field">
              <span>Mật khẩu {editingUser ? '' : <b>*</b>}</span>
              <input name="password" type="password" value={form.password} onChange={onChange} required={!editingUser} minLength={8} placeholder={editingUser ? 'Để trống nếu không đổi' : ''} />
            </label>
            <label className="system-field">
              <span>Họ</span>
              <input name="first_name" value={form.first_name} onChange={onChange} maxLength={150} />
            </label>
            <label className="system-field">
              <span>Tên</span>
              <input name="last_name" value={form.last_name} onChange={onChange} maxLength={150} />
            </label>
            <div className="system-check">
              <span>Trạng thái</span>
              <label><input name="is_active" type="checkbox" checked={form.is_active} onChange={onChange} /> Đang hoạt động</label>
            </div>
            {canManageAdminFlags && (
              <>
                <div className="system-check">
                  <span>Quản trị</span>
                  <label><input name="is_staff" type="checkbox" checked={form.is_staff} onChange={onChange} /> Staff</label>
                </div>
                <div className="system-check">
                  <span>Toàn quyền</span>
                  <label><input name="is_superuser" type="checkbox" checked={form.is_superuser} onChange={onChange} /> Superuser</label>
                </div>
              </>
            )}
            <div className="system-field system-field-wide">
              <span>Nhóm quyền</span>
              <div className="system-role-grid">
                {roles.length === 0 && <div className="system-empty">Chưa có nhóm quyền.</div>}
                {roles.map((role) => (
                  <label className="system-role-option" key={role.id}>
                    <input type="checkbox" checked={form.groups.includes(String(role.id))} onChange={() => toggleRole(role.id)} />
                    <span>{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="system-form-actions">
            <button type="button" className="system-btn secondary" onClick={onCancel} disabled={saving}>Hủy</button>
            <button type="submit" className="system-btn primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu người dùng'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
