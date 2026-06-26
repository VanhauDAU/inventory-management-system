export default function StockTransactionHeader({
  activeWarehouses,
  formatCurrency,
  historyStats,
  isFormMode,
  meta,
  products,
  transactions,
}) {
  return (
    <section className="stock-header">
      <div>
        <span className="stock-eyebrow">{meta.eyebrow}</span>
        <h2>{meta.title}</h2>
        <p>{meta.description}</p>
      </div>
      <div className={`stock-header-stats${!isFormMode ? ' history' : ''}`}>
        {isFormMode ? (
          <>
            <article><span>Phiếu</span><strong>{transactions.length}</strong></article>
            <article><span>Sản phẩm</span><strong>{products.length}</strong></article>
            <article><span>Kho</span><strong>{activeWarehouses.length}</strong></article>
          </>
        ) : (
          <>
            <article><span>Tổng phiếu</span><strong>{historyStats.total}</strong></article>
            <article><span>Nhập / Xuất</span><strong>{historyStats.import}/{historyStats.export}</strong></article>
            <article><span>SL giao dịch</span><strong>{historyStats.quantity}</strong></article>
            <article><span>Giá trị</span><strong>{formatCurrency(historyStats.amount)}</strong></article>
          </>
        )}
      </div>
    </section>
  )
}
