export default function StockTransactionHistoryTable({
  formatCurrency,
  formatDateTime,
  getTransactionTotals,
  onExportVoucher,
  onSelectTransaction,
  transactions,
  typeLabelMap,
}) {
  return (
    <table className="stock-table">
      <thead>
        <tr>
          <th>Mã phiếu</th>
          <th>Loại</th>
          <th>Kho</th>
          <th>Sản phẩm</th>
          <th>Số lượng</th>
          <th>Giá trị</th>
          <th>Người tạo</th>
          <th>Thời gian</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => {
          const { amount, quantity } = getTransactionTotals(transaction)
          const itemNames = (transaction.items || [])
            .map((item) => item.product_detail?.name || `Sản phẩm #${item.product}`)
            .join(', ')

          return (
            <tr key={transaction.id}>
              <td>
                <button type="button" className="stock-code" onClick={() => onSelectTransaction(transaction)}>
                  {transaction.transaction_code}
                </button>
              </td>
              <td>
                <span className={`stock-type ${transaction.transaction_type}`}>
                  {typeLabelMap[transaction.transaction_type] || transaction.transaction_type}
                </span>
              </td>
              <td>{transaction.warehouse_detail?.name || `Kho #${transaction.warehouse}`}</td>
              <td className="stock-products-cell">{itemNames || 'Chưa có sản phẩm'}</td>
              <td><strong>{quantity}</strong></td>
              <td><strong>{formatCurrency(amount)}</strong></td>
              <td>{transaction.created_by_username || 'Hệ thống'}</td>
              <td>{formatDateTime(transaction.created_at)}</td>
              <td>
                <div className="stock-row-actions">
                  <button type="button" className="stock-detail-btn" onClick={() => onSelectTransaction(transaction)}>
                    Chi tiết
                  </button>
                  <button type="button" className="stock-export-btn" onClick={() => onExportVoucher(transaction)}>
                    Xuất phiếu
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
