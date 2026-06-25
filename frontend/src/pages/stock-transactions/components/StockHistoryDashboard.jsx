export default function StockHistoryDashboard({
  clearHistoryFilters,
  filteredTransactions,
  formatCurrency,
  historyFilters,
  historySearch,
  historyStats,
  isFormMode,
  loading,
  onRefresh,
  setHistorySearch,
  topHistoryProducts,
  updateHistoryFilter,
  warehouses,
  exportHistoryCsv,
}) {
  if (isFormMode) {
    return (
      <div className="stock-card-head">
        <span>Lịch sử phiếu kho</span>
        <label className="stock-search">
          <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Tìm mã phiếu, kho, sản phẩm" />
        </label>
      </div>
    )
  }

  return (
    <div className="stock-history-dashboard">
      <div className="stock-history-toolbar">
        <div>
          <span className="stock-eyebrow">Báo cáo nâng cao</span>
          <h3>Lịch sử giao dịch kho</h3>
          <p>Lọc theo thời gian, kho, loại phiếu; xem nhanh giá trị và xuất dữ liệu để đối soát.</p>
        </div>
        <div className="stock-history-actions">
          <button type="button" className="stock-btn secondary" onClick={clearHistoryFilters}>Xóa lọc</button>
          <button type="button" className="stock-btn secondary" onClick={onRefresh} disabled={loading}>Làm mới</button>
          <button type="button" className="stock-btn primary" onClick={exportHistoryCsv} disabled={loading || filteredTransactions.length === 0}>Xuất CSV</button>
        </div>
      </div>

      <div className="stock-advanced-filters">
        <label className="stock-field">
          <span>Từ ngày</span>
          <input type="date" value={historyFilters.date_from} onChange={(event) => updateHistoryFilter('date_from', event.target.value)} />
        </label>
        <label className="stock-field">
          <span>Đến ngày</span>
          <input type="date" value={historyFilters.date_to} onChange={(event) => updateHistoryFilter('date_to', event.target.value)} />
        </label>
        <label className="stock-field">
          <span>Kho</span>
          <select value={historyFilters.warehouse} onChange={(event) => updateHistoryFilter('warehouse', event.target.value)}>
            <option value="">Tất cả kho</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </label>
        <label className="stock-field">
          <span>Loại phiếu</span>
          <select value={historyFilters.transaction_type} onChange={(event) => updateHistoryFilter('transaction_type', event.target.value)}>
            <option value="">Tất cả loại phiếu</option>
            <option value="import">Nhập kho</option>
            <option value="export">Xuất kho</option>
            <option value="adjustment">Điều chỉnh</option>
          </select>
        </label>
        <label className="stock-field stock-filter-search">
          <span>Tìm kiếm</span>
          <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Mã phiếu, kho, sản phẩm, lý do" />
        </label>
      </div>

      <div className="stock-insight-grid">
        <article className="import"><span>Phiếu nhập</span><strong>{historyStats.import}</strong></article>
        <article className="export"><span>Phiếu xuất</span><strong>{historyStats.export}</strong></article>
        <article className="adjustment"><span>Điều chỉnh</span><strong>{historyStats.adjustment}</strong></article>
        <article><span>Dòng hàng</span><strong>{filteredTransactions.reduce((sum, transaction) => sum + (transaction.items || []).length, 0)}</strong></article>
      </div>

      {topHistoryProducts.length > 0 && (
        <div className="stock-top-products">
          <span>Sản phẩm nổi bật theo giá trị giao dịch</span>
          <div>
            {topHistoryProducts.map((product) => (
              <button key={product.id} type="button" onClick={() => setHistorySearch(product.sku)}>
                <strong>{product.name}</strong>
                <small>{product.sku} · {product.quantity} SP · {formatCurrency(product.amount)}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
