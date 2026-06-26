export default function StockTransactionDetailModal({
  formatCurrency,
  formatDateTime,
  getProductImage,
  onClose,
  onExportVoucher,
  transaction,
  typeLabelMap,
}) {
  if (!transaction) return null

  return (
    <div className="stock-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="stock-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="stock-modal-header">
          <div>
            <span className="stock-eyebrow">Chi tiết phiếu kho</span>
            <h3>{transaction.transaction_code}</h3>
          </div>
          <div className="stock-modal-actions">
            <button type="button" className="stock-export-btn" onClick={() => onExportVoucher(transaction)}>Xuất phiếu</button>
            <button type="button" aria-label="Đóng" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="stock-detail-summary">
          <article>
            <span>Loại phiếu</span>
            <strong>{typeLabelMap[transaction.transaction_type] || transaction.transaction_type}</strong>
          </article>
          <article>
            <span>Kho</span>
            <strong>{transaction.warehouse_detail?.name || `Kho #${transaction.warehouse}`}</strong>
          </article>
          <article>
            <span>Người tạo</span>
            <strong>{transaction.created_by_username || 'Hệ thống'}</strong>
          </article>
          <article>
            <span>Thời gian</span>
            <strong>{formatDateTime(transaction.created_at)}</strong>
          </article>
        </div>

        <div className="stock-detail-notes">
          <div>
            <span>Lý do</span>
            <p>{transaction.reason || 'Chưa có lý do'}</p>
          </div>
          <div>
            <span>Ghi chú</span>
            <p>{transaction.note || 'Chưa có ghi chú'}</p>
          </div>
        </div>

        <div className="stock-detail-table-wrap">
          <table className="stock-detail-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SKU</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {(transaction.items || []).map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="stock-detail-product">
                      <img src={getProductImage(item.product_detail)} alt={item.product_detail?.name || 'Sản phẩm'} />
                      <div>
                        <strong>{item.product_detail?.name || `Sản phẩm #${item.product}`}</strong>
                        <span>{item.product_detail?.category_detail?.name || 'Chưa có danh mục'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{item.product_detail?.sku || `#${item.product}`}</td>
                  <td><strong>{item.quantity}</strong></td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td><strong>{formatCurrency(item.total_amount)}</strong></td>
                  <td>{item.note || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2">Tổng cộng</td>
                <td>
                  <strong>
                    {(transaction.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                  </strong>
                </td>
                <td />
                <td>
                  <strong>
                    {formatCurrency((transaction.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0))}
                  </strong>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  )
}
