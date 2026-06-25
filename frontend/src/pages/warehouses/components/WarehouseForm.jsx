export default function WarehouseForm({ form, errors, editingWarehouse, onChange, onSubmit, onCancel, loading }) {
  return (
    <form className="warehouse-form" onSubmit={onSubmit} noValidate>
      <div className="warehouse-form-grid">
        <label className="warehouse-field">
          <span>Tên kho <b>*</b></span>
          <input name="name" value={form.name} onChange={onChange} className={errors.name ? 'input-error' : ''} placeholder="Ví dụ: Kho trung tâm" maxLength={255} />
          {errors.name && <small className="warehouse-error">{errors.name}</small>}
        </label>

        <label className="warehouse-field">
          <span>Người phụ trách</span>
          <input name="manager_name" value={form.manager_name} onChange={onChange} className={errors.manager_name ? 'input-error' : ''} placeholder="Tên quản lý kho" maxLength={255} />
          {errors.manager_name && <small className="warehouse-error">{errors.manager_name}</small>}
        </label>

        <label className="warehouse-field">
          <span>Số điện thoại</span>
          <input name="phone" value={form.phone} onChange={onChange} className={errors.phone ? 'input-error' : ''} placeholder="Ví dụ: 0901234567" maxLength={30} />
          {errors.phone && <small className="warehouse-error">{errors.phone}</small>}
        </label>

        <label className="warehouse-toggle">
          <input name="is_active" type="checkbox" checked={form.is_active} onChange={onChange} />
          <span>Kho đang hoạt động</span>
        </label>

        <label className="warehouse-field warehouse-field-wide">
          <span>Địa chỉ</span>
          <textarea name="address" value={form.address} onChange={onChange} className={errors.address ? 'input-error' : ''} placeholder="Nhập địa chỉ kho" rows={4} maxLength={1000} />
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
