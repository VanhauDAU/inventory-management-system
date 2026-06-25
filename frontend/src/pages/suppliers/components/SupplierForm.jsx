export default function SupplierForm({ form, errors, editingSupplier, onChange, onSubmit, onCancel, loading }) {
  return (
    <form className="supplier-form" onSubmit={onSubmit} noValidate>
      <div className="supplier-form-grid">
        <label className="supplier-field">
          <span>Tên nhà phân phối <b>*</b></span>
          <input name="name" value={form.name} onChange={onChange} className={errors.name ? 'input-error' : ''} placeholder="Ví dụ: Công ty TNHH ABC" maxLength={255} />
          {errors.name && <small className="supplier-error">{errors.name}</small>}
        </label>

        <label className="supplier-field">
          <span>Người liên hệ</span>
          <input name="contact_name" value={form.contact_name} onChange={onChange} className={errors.contact_name ? 'input-error' : ''} placeholder="Tên người phụ trách" maxLength={255} />
          {errors.contact_name && <small className="supplier-error">{errors.contact_name}</small>}
        </label>

        <label className="supplier-field">
          <span>Số điện thoại</span>
          <input name="phone" value={form.phone} onChange={onChange} className={errors.phone ? 'input-error' : ''} placeholder="Ví dụ: 0901234567" maxLength={30} />
          {errors.phone && <small className="supplier-error">{errors.phone}</small>}
        </label>

        <label className="supplier-field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={onChange} className={errors.email ? 'input-error' : ''} placeholder="contact@example.com" maxLength={254} />
          {errors.email && <small className="supplier-error">{errors.email}</small>}
        </label>

        <label className="supplier-field">
          <span>Mã số thuế</span>
          <input name="tax_code" value={form.tax_code} onChange={onChange} className={errors.tax_code ? 'input-error' : ''} placeholder="MST hoặc mã nhà phân phối" maxLength={100} />
          {errors.tax_code && <small className="supplier-error">{errors.tax_code}</small>}
        </label>

        <label className="supplier-toggle">
          <input name="is_active" type="checkbox" checked={form.is_active} onChange={onChange} />
          <span>Đang hợp tác</span>
        </label>

        <label className="supplier-field supplier-field-wide">
          <span>Địa chỉ</span>
          <textarea name="address" value={form.address} onChange={onChange} className={errors.address ? 'input-error' : ''} placeholder="Nhập địa chỉ nhà phân phối" rows={3} maxLength={1000} />
          {errors.address && <small className="supplier-error">{errors.address}</small>}
        </label>

        <label className="supplier-field supplier-field-wide">
          <span>Ghi chú</span>
          <textarea name="note" value={form.note} onChange={onChange} className={errors.note ? 'input-error' : ''} placeholder="Điều khoản, công nợ, lịch giao hàng, ghi chú nội bộ..." rows={4} maxLength={1000} />
          {errors.note && <small className="supplier-error">{errors.note}</small>}
        </label>
      </div>

      <div className="supplier-form-actions">
        <button type="button" className="supplier-btn secondary" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button type="submit" className="supplier-btn primary" disabled={loading}>
          {loading ? 'Đang lưu...' : editingSupplier ? 'Lưu thay đổi' : 'Thêm nhà phân phối'}
        </button>
      </div>
    </form>
  )
}
