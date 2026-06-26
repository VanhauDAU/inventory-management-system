export default function SystemDeletePanel({
  description,
  itemName,
  onCancel,
  onConfirm,
  saving,
  title,
}) {
  if (!itemName) return null

  return (
    <section className="system-form-panel">
      <div className="system-form-head">
        <div>
          <h3>{title}</h3>
          <small>{description}</small>
        </div>
        <div className="system-actions">
          <button type="button" className="system-btn secondary" onClick={onCancel} disabled={saving}>Hủy</button>
          <button type="button" className="system-btn danger" onClick={onConfirm} disabled={saving}>{saving ? 'Đang xóa...' : 'Xóa'}</button>
        </div>
      </div>
    </section>
  )
}
