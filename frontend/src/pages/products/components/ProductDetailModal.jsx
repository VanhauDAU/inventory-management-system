import { formatCurrency, formatDateTime } from '../../../utils/formatters'
import {
  getBusinessStatus,
  getCategoryName,
  getProductImage,
  getProductPrice,
  getStockStatus,
  getSupplierName,
  getUnitLabel,
} from '../../../utils/productDisplay'

export default function ProductDetailModal({ canChange, onClose, onEdit, product }) {
  if (!product) return null

  return (
    <div className="plp-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="plp-modal plp-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="plp-modal-header">
          <div>
            <span className="plp-modal-eyebrow">Chi tiết sản phẩm</span>
            <h2>{product.name}</h2>
          </div>
          <button className="plp-modal-close" type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>

        <div className="plp-detail-layout">
          <div className="plp-detail-media">
            <img src={getProductImage(product)} alt={product.name} />
          </div>

          <div className="plp-detail-summary">
            <div className="plp-detail-tags">
              <span className={`plp-business-pill ${getBusinessStatus(product).className}`}>{getBusinessStatus(product).label}</span>
              <span className={`plp-status-pill ${getStockStatus(product).className}`}>{getStockStatus(product).label}</span>
            </div>

            <p className="plp-modal-desc">{product.description || 'Sản phẩm chưa có mô tả.'}</p>

            <div className="plp-detail-price-row">
              <div>
                <span>Giá bán</span>
                <strong>{formatCurrency(getProductPrice(product))}</strong>
              </div>
              <div>
                <span>Giá nhập</span>
                <strong>{formatCurrency(product.cost_price)}</strong>
              </div>
            </div>

            {canChange && <button className="plp-detail-edit" type="button" onClick={() => onEdit(product)}>Sửa sản phẩm</button>}
          </div>
        </div>

        <div className="plp-modal-grid plp-detail-grid">
          <div className="plp-modal-item"><span>SKU</span><strong>{product.sku || `#${product.id}`}</strong></div>
          <div className="plp-modal-item"><span>Barcode</span><strong>{product.barcode || 'Chưa có'}</strong></div>
          <div className="plp-modal-item"><span>Danh mục</span><strong>{getCategoryName(product)}</strong></div>
          <div className="plp-modal-item"><span>Nhà cung cấp</span><strong>{getSupplierName(product)}</strong></div>
          <div className="plp-modal-item"><span>Tổng tồn</span><strong>{product.quantity ?? 0}</strong></div>
          <div className="plp-modal-item"><span>Tồn tối thiểu</span><strong>{product.minimum_stock ?? 0}</strong></div>
          <div className="plp-modal-item"><span>Đơn vị tính</span><strong>{getUnitLabel(product.unit)}</strong></div>
          <div className="plp-modal-item"><span>Mã sản phẩm</span><strong>#{product.id}</strong></div>
          <div className="plp-modal-item"><span>Ngày tạo</span><strong>{formatDateTime(product.created_at)}</strong></div>
          <div className="plp-modal-item"><span>Cập nhật</span><strong>{formatDateTime(product.updated_at)}</strong></div>
        </div>
      </section>
    </div>
  )
}
