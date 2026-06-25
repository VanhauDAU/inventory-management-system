import { getProductImage, getProductPrice } from '../../../utils/productDisplay'

export default function WarehouseStockModal({
  formatCurrency,
  loading,
  onClose,
  stocks,
  warehouse,
}) {
  if (!warehouse) return null

  return (
    <div className="warehouse-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="warehouse-modal stock-detail" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="warehouse-modal-header">
          <div>
            <span className="warehouse-eyebrow">Tồn kho theo kho</span>
            <h3>{warehouse.name}</h3>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="warehouse-state">Đang tải tồn kho...</div>
        ) : stocks.length === 0 ? (
          <div className="warehouse-state">Kho này chưa có sản phẩm tồn.</div>
        ) : (
          <div className="warehouse-stock-list">
            {stocks.map((stock) => {
              const product = stock.product_detail
              return (
                <article className="warehouse-stock-item" key={stock.id}>
                  <img src={getProductImage(product)} alt={product?.name || 'Sản phẩm'} />
                  <div>
                    <strong>{product?.name || `Sản phẩm #${stock.product}`}</strong>
                    <span>{product?.sku || 'Chưa có SKU'} · {product?.category_detail?.name || 'Chưa có danh mục'}</span>
                  </div>
                  <div className="warehouse-stock-numbers">
                    <strong>{stock.quantity}</strong>
                    <span>{formatCurrency(Number(stock.quantity) * Number(getProductPrice(product)))}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
