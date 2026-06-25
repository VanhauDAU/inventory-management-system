import { getProductImage, getProductPrice } from '../../../utils/productDisplay'

export default function SupplierProductsModal({
  formatCurrency,
  loading,
  onClose,
  products,
  supplier,
}) {
  if (!supplier) return null

  return (
    <div className="supplier-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="supplier-modal products" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="supplier-modal-header">
          <div>
            <span className="supplier-eyebrow">Sản phẩm liên kết</span>
            <h3>{supplier.name}</h3>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="supplier-state">Đang tải sản phẩm...</div>
        ) : products.length === 0 ? (
          <div className="supplier-state">Nhà phân phối này chưa có sản phẩm.</div>
        ) : (
          <div className="supplier-product-list">
            {products.map((product) => (
              <article className="supplier-product-item" key={product.id}>
                <img src={getProductImage(product)} alt={product.name} />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku || `#${product.id}`} · {product.category_detail?.name || 'Chưa có danh mục'}</span>
                </div>
                <div className="supplier-product-numbers">
                  <strong>{formatCurrency(getProductPrice(product))}</strong>
                  <span>Tồn: {product.quantity ?? 0}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
