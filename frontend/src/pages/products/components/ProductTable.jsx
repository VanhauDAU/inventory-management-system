import { formatCurrency } from '../../../utils/formatters'
import {
  getBusinessStatus,
  getCategoryName,
  getProductImage,
  getProductPrice,
  getStockStatus,
  getSupplierName,
} from '../../../utils/productDisplay'

export default function ProductTable({
  canAdd,
  canChange,
  canDelete,
  loading,
  onAdd,
  onDelete,
  onEdit,
  onPageChange,
  onSelect,
  page,
  products,
  totalCount,
  totalPages,
  nextPage,
  previousPage,
}) {
  return (
    <div className="plp-table-card">
      <div className="plp-table-head">
        <span className="plp-count">{totalCount} sản phẩm</span>
        <div className="plp-table-actions">
          <span className="plp-mode-dot api">API</span>
          {canAdd && (
            <button type="button" className="plp-add-btn" onClick={onAdd}>
              <span>+</span>
              Thêm sản phẩm
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="plp-state">
          <div className="plp-spinner" aria-label="Đang tải" />
          <span>Đang tải danh sách sản phẩm...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="plp-state">
          <span style={{ fontSize: '2rem' }}>🔍</span>
          <span>Không có sản phẩm phù hợp với bộ lọc hiện tại.</span>
        </div>
      ) : (
        <div className="plp-table-wrap">
          <table className="plp-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SKU</th>
                <th>Danh mục</th>
                <th>Nhà cung cấp</th>
                <th>Giá</th>
                <th>Tổng tồn</th>
                <th>Kinh doanh</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stock = getStockStatus(product)
                const business = getBusinessStatus(product)
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="plp-product-cell">
                        <div className="plp-avatar">
                          <img src={getProductImage(product)} alt={product.name} loading="lazy" />
                        </div>
                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.description || 'Chưa có mô tả'}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="plp-code">{product.sku || `#${product.id}`}</span></td>
                    <td><span className="plp-category-tag">{getCategoryName(product)}</span></td>
                    <td><span className="plp-supplier">{getSupplierName(product)}</span></td>
                    <td><strong className="plp-price">{formatCurrency(getProductPrice(product))}</strong></td>
                    <td><span className="plp-qty">{product.quantity}</span></td>
                    <td><span className={`plp-business-pill ${business.className}`}>{business.label}</span></td>
                    <td><span className={`plp-status-pill ${stock.className}`}>{stock.label}</span></td>
                    <td>
                      <div className="plp-row-actions">
                        <button className="plp-action-btn detail" type="button" onClick={() => onSelect(product)}>Chi tiết</button>
                        {canChange && <button className="plp-action-btn edit" type="button" onClick={() => onEdit(product)}>Sửa</button>}
                        {canDelete && <button className="plp-action-btn delete" type="button" onClick={() => onDelete(product)}>Xóa</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="plp-pagination">
        <span>Trang {page} / {totalPages} · Tổng {totalCount} sản phẩm</span>
        <div className="plp-pagination-btns">
          <button type="button" disabled={page === 1 || !previousPage} onClick={() => onPageChange(Math.max(1, page - 1))}>
            ← Trước
          </button>
          <button type="button" disabled={page >= totalPages || !nextPage} onClick={() => onPageChange(page + 1)}>
            Sau →
          </button>
        </div>
      </div>
    </div>
  )
}
