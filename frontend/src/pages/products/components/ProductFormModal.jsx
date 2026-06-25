import ProductForm from './ProductForm'

export default function ProductFormModal({
  error,
  initialData,
  loading,
  onCancel,
  onSubmit,
  title,
}) {
  return (
    <div className="plp-modal-backdrop" role="presentation" onClick={() => !loading && onCancel()}>
      <section className="plp-modal plp-form-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="plp-modal-header">
          <div>
            <span className="plp-modal-eyebrow">Quản lý sản phẩm</span>
            <h2>{title}</h2>
          </div>
          <button className="plp-modal-close" type="button" aria-label="Đóng" disabled={loading} onClick={onCancel}>×</button>
        </div>

        {error && <div className="plp-notice error">{error}</div>}

        <ProductForm initialData={initialData} onSubmit={onSubmit} onCancel={onCancel} loading={loading} />
      </section>
    </div>
  )
}
