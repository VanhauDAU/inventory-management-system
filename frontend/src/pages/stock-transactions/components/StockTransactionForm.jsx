import { getProductImage, getProductPrice } from '../stockTransactionUtils'

export default function StockTransactionForm({
  activeWarehouses,
  addProductToLines,
  adjustLineQuantity,
  createStockTransaction,
  defaultReasonPlaceholder,
  formError,
  formatCurrency,
  getAvailableQuantity,
  getSelectedQuantity,
  handleSubmit,
  isAdjustment,
  lines,
  loading,
  meta,
  note,
  pickerHelpText,
  productMap,
  productPickerItems,
  productSearch,
  quantityLabel,
  reason,
  removeLine,
  resetForm,
  saving,
  selectedEmptyText,
  selectedPanelTitle,
  selectedWarehouse,
  setNote,
  setProductSearch,
  setReason,
  setSelectedWarehouse,
  setTransactionCode,
  stockLoading,
  stockMap,
  totals,
  transactionCode,
  transactionType,
  updateLine,
  warehouseStocks,
}) {
  return (
    <form className="stock-form-card" onSubmit={handleSubmit} noValidate>
      <div className="stock-card-head">
        <span>Thông tin phiếu</span>
        <small>{stockLoading ? 'Đang kiểm tra tồn kho...' : `${warehouseStocks.length} sản phẩm đang có trong kho đã chọn`}</small>
      </div>

      {formError && <div className="stock-notice error inline">{formError}</div>}

      <div className="stock-form-grid">
        <label className="stock-field">
          <span>Kho <b>*</b></span>
          <select value={selectedWarehouse} onChange={(event) => setSelectedWarehouse(event.target.value)}>
            <option value="">Chọn kho</option>
            {activeWarehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </label>

        <label className="stock-field">
          <span>Mã phiếu <b>*</b></span>
          <input value={transactionCode} onChange={(event) => setTransactionCode(event.target.value)} maxLength={100} />
        </label>

        <label className="stock-field">
          <span>Lý do</span>
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder={defaultReasonPlaceholder} maxLength={255} />
        </label>

        <label className="stock-field">
          <span>Ghi chú</span>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú chung cho phiếu" />
        </label>
      </div>

      <div className="stock-lines">
        <div className="stock-lines-head">
          <div>
            <span>Chọn sản phẩm</span>
            <small>{pickerHelpText}</small>
          </div>
          <div className="stock-lines-summary">
            <strong>{lines.length}</strong>
            <span>dòng hàng</span>
          </div>
        </div>

        <div className="stock-entry-layout">
          <div className="stock-product-picker">
            <label className="stock-picker-search">
              <span>Tìm sản phẩm</span>
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Nhập tên, SKU, barcode, danh mục"
              />
            </label>

            <div className="stock-product-grid">
              {productPickerItems.length === 0 ? (
                <div className="stock-picker-empty">
                  {transactionType === 'export' ? 'Không có sản phẩm còn tồn trong kho đã chọn.' : 'Không tìm thấy sản phẩm phù hợp.'}
                </div>
              ) : productPickerItems.map((product) => {
                const selectedQuantity = getSelectedQuantity(product.id)
                const availableQuantity = getAvailableQuantity(product.id)
                const isSelected = selectedQuantity > 0
                const isMaxed = transactionType === 'export' && selectedQuantity >= availableQuantity

                return (
                  <button
                    key={product.id}
                    type="button"
                    className={`stock-product-card${isSelected ? ' selected' : ''}`}
                    onClick={() => addProductToLines(product)}
                    disabled={isMaxed}
                  >
                    <img src={getProductImage(product)} alt={product.name} />
                    <span className="stock-product-info">
                      <strong>{product.name}</strong>
                      <small>{product.sku || `#${product.id}`} · {product.category_detail?.name || 'Chưa có danh mục'}</small>
                    </span>
                    <span className="stock-product-meta">
                      <strong>{formatCurrency(getProductPrice(product))}</strong>
                      <small>{transactionType === 'export' || isAdjustment ? `Tồn kho này ${availableQuantity}` : `Tồn tổng ${product.quantity || 0}`}</small>
                    </span>
                    {isSelected && <span className="stock-selected-badge">x{selectedQuantity}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="stock-selected-panel">
            <div className="stock-selected-head">
              <span>{selectedPanelTitle}</span>
              <strong>{formatCurrency(totals)}</strong>
            </div>

            {lines.length === 0 ? (
              <div className="stock-selected-empty">
                {selectedEmptyText}
              </div>
            ) : (
              <div className="stock-selected-scroll">
                {lines.map((line, index) => {
                  const product = productMap.get(String(line.product))
                  const availableQuantity = Number(stockMap.get(String(line.product))?.quantity || 0)
                  const lineTotal = Number(line.quantity || 0) * Number(line.unit_price || 0)

                  return (
                    <div className="stock-line stock-line-dense" key={line.product}>
                      <div className="stock-line-selected selected">
                        <img src={getProductImage(product)} alt={product?.name || 'Sản phẩm'} />
                        <div>
                          <strong>{product?.name || `Sản phẩm #${line.product}`}</strong>
                          <span>{product?.sku || `#${line.product}`} · {product?.category_detail?.name || 'Chưa có danh mục'}</span>
                          {(transactionType === 'export' || isAdjustment) && (
                            <small>{isAdjustment ? 'Tồn hiện tại' : 'Còn trong kho'}: {availableQuantity}</small>
                          )}
                        </div>
                      </div>

                      <label className="stock-field">
                        <span>{quantityLabel}</span>
                        <div className="stock-stepper">
                          <button type="button" onClick={() => adjustLineQuantity(index, -1)} aria-label="Giảm số lượng">-</button>
                          <input type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} />
                          <button type="button" onClick={() => adjustLineQuantity(index, 1)} aria-label="Tăng số lượng">+</button>
                        </div>
                      </label>

                      <label className="stock-field">
                        <span>Giá</span>
                        <input type="number" min="0" step="1000" value={line.unit_price} onChange={(event) => updateLine(index, 'unit_price', event.target.value)} />
                      </label>

                      <div className="stock-line-total">
                        <span>Tổng</span>
                        <strong>{formatCurrency(lineTotal)}</strong>
                      </div>

                      <button type="button" className="stock-line-remove" aria-label="Xóa dòng" onClick={() => removeLine(index)}>
                        x
                      </button>

                      <label className="stock-field note stock-note-compact">
                        <span>Ghi chú</span>
                        <input value={line.note} onChange={(event) => updateLine(index, 'note', event.target.value)} placeholder="Ghi chú dòng" />
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stock-form-actions">
        <div>
          <span>Tổng giá trị</span>
          <strong>{formatCurrency(totals)}</strong>
        </div>
        <button type="button" className="stock-btn secondary" disabled={saving} onClick={resetForm}>Làm mới</button>
        <button type="button" className="stock-btn secondary" disabled={saving || loading || stockLoading} onClick={() => createStockTransaction({ exportAfterCreate: true })}>
          Tạo & xuất phiếu
        </button>
        <button type="submit" className="stock-btn primary" disabled={saving || loading || stockLoading}>
          {saving ? 'Đang lưu...' : meta.submitLabel}
        </button>
      </div>
    </form>
  )
}
