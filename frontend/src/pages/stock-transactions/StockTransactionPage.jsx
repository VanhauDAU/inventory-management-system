import { useEffect, useMemo, useState } from 'react'
import PaginationControls from '../../components/common/PaginationControls'
import StockHistoryDashboard from './components/StockHistoryDashboard'
import StockTransactionDetailModal from './components/StockTransactionDetailModal'
import StockTransactionForm from './components/StockTransactionForm'
import StockTransactionHeader from './components/StockTransactionHeader'
import StockTransactionHistoryTable from './components/StockTransactionHistoryTable'
import './StockTransactionPage.css'

import {
  PAGE_SIZE,
  apiJson,
  buildQueryString,
  createTransactionCode,
  csvCell,
  downloadTextFile,
  exportTransactionVoucher,
  fetchAllPages,
  formatCurrency,
  formatDateInput,
  formatDateTime,
  getProductImage,
  getProductPrice,
  getTransactionTotals,
  initialLine,
  transactionMeta,
  typeLabelMap,
} from './stockTransactionUtils'

export default function StockTransactionPage({ transactionType = 'all' }) {
  const meta = transactionMeta[transactionType] || transactionMeta.all
  const isFormMode = transactionType === 'import' || transactionType === 'export' || transactionType === 'adjustment'
  const isAdjustment = transactionType === 'adjustment'
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [warehouseStocks, setWarehouseStocks] = useState([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [transactionCode, setTransactionCode] = useState(() => isFormMode ? createTransactionCode(transactionType) : '')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [stockLoading, setStockLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [historySearch, setHistorySearch] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyFilters, setHistoryFilters] = useState(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    return {
      date_from: formatDateInput(thirtyDaysAgo),
      date_to: formatDateInput(today),
      warehouse: '',
      transaction_type: '',
    }
  })
  const [productSearch, setProductSearch] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  function showToast(type, message) {
    setToast({ id: Date.now(), type, message })
  }

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, toast.type === 'error' ? 6000 : 3500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    setTransactionCode(isFormMode ? createTransactionCode(transactionType) : '')
    setReason('')
    setNote('')
    setLines([])
    setFormError('')
  }, [isFormMode, transactionType])

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const reportQuery = buildQueryString(historyFilters)
        const transactionPath = transactionType === 'all'
          ? `/reports/inventory/transactions/${reportQuery ? `?${reportQuery}` : ''}`
          : `/stock-transactions/?transaction_type=${transactionType}&ordering=-created_at`
        const [warehouseList, productList, transactionList] = await Promise.all([
          fetchAllPages('/warehouses/', controller.signal),
          fetchAllPages('/products/?ordering=name', controller.signal),
          fetchAllPages(transactionPath, controller.signal),
        ])

        setWarehouses(warehouseList)
        setProducts(productList)
        setTransactions(transactionList)

        if (isFormMode && !selectedWarehouse) {
          const firstActiveWarehouse = warehouseList.find((warehouse) => warehouse.is_active) || warehouseList[0]
          if (firstActiveWarehouse) setSelectedWarehouse(String(firstActiveWarehouse.id))
        }
      } catch (requestError) {
        if (requestError.name === 'AbortError') return
        const message = requestError.message || 'Không thể tải dữ liệu phiếu kho.'
        setError(message)
        showToast('error', message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [historyFilters, isFormMode, refreshKey, selectedWarehouse, transactionType])

  useEffect(() => {
    if (!selectedWarehouse) {
      setWarehouseStocks([])
      return undefined
    }

    const controller = new AbortController()

    async function loadWarehouseStocks() {
      setStockLoading(true)
      try {
        const stockList = await fetchAllPages(`/warehouses/${selectedWarehouse}/stocks/`, controller.signal)
        setWarehouseStocks(stockList)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') showToast('error', requestError.message || 'Không thể tải tồn kho.')
      } finally {
        setStockLoading(false)
      }
    }

    loadWarehouseStocks()
    return () => controller.abort()
  }, [selectedWarehouse, refreshKey])

  const activeWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.is_active),
    [warehouses],
  )

  const productMap = useMemo(() => {
    return products.reduce((map, product) => {
      map.set(String(product.id), product)
      return map
    }, new Map())
  }, [products])

  const stockMap = useMemo(() => {
    return warehouseStocks.reduce((map, stock) => {
      map.set(String(stock.product), stock)
      return map
    }, new Map())
  }, [warehouseStocks])

  const availableProducts = useMemo(() => {
    const activeProducts = products.filter((product) => product.status === 'active')
    if (transactionType !== 'export') return activeProducts
    return activeProducts.filter((product) => Number(stockMap.get(String(product.id))?.quantity || 0) > 0)
  }, [products, stockMap, transactionType])

  const selectedProductIds = useMemo(() => {
    return new Set(lines.map((line) => String(line.product)).filter(Boolean))
  }, [lines])

  const productPickerItems = useMemo(() => {
    const keyword = productSearch.trim().toLowerCase()
    return availableProducts
      .filter((product) => {
        if (!keyword) return true
        return [
          product.name,
          product.sku,
          product.barcode,
          product.category_detail?.name,
          product.supplier_detail?.name,
          product.supplier_name,
        ].join(' ').toLowerCase().includes(keyword)
      })
      .sort((a, b) => {
        const aSelected = selectedProductIds.has(String(a.id))
        const bSelected = selectedProductIds.has(String(b.id))
        if (aSelected !== bSelected) return aSelected ? -1 : 1
        return String(a.name || '').localeCompare(String(b.name || ''), 'vi')
      })
      .slice(0, 12)
  }, [availableProducts, productSearch, selectedProductIds])

  const totals = useMemo(() => {
    return lines.reduce((sum, line) => {
      return sum + Number(line.quantity || 0) * Number(line.unit_price || 0)
    }, 0)
  }, [lines])

  const filteredTransactions = useMemo(() => {
    const keyword = historySearch.trim().toLowerCase()
    if (!keyword) return transactions

    return transactions.filter((transaction) => {
      const warehouseName = transaction.warehouse_detail?.name || ''
      const itemText = (transaction.items || [])
        .map((item) => `${item.product_detail?.name || ''} ${item.product_detail?.sku || ''}`)
        .join(' ')
      return [
        transaction.transaction_code,
        transaction.reason,
        transaction.note,
        warehouseName,
        itemText,
        typeLabelMap[transaction.transaction_type],
      ].join(' ').toLowerCase().includes(keyword)
    })
  }, [historySearch, transactions])

  useEffect(() => {
    setHistoryPage(1)
  }, [historyFilters, historySearch, transactionType])

  const paginatedTransactions = useMemo(() => {
    const startIndex = (historyPage - 1) * PAGE_SIZE
    return filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredTransactions, historyPage])

  const historyStats = useMemo(() => {
    return filteredTransactions.reduce((stats, transaction) => {
      const transactionTotals = getTransactionTotals(transaction)
      stats.total += 1
      stats.quantity += transactionTotals.quantity
      stats.amount += transactionTotals.amount
      stats[transaction.transaction_type] = (stats[transaction.transaction_type] || 0) + 1
      return stats
    }, {
      total: 0,
      quantity: 0,
      amount: 0,
      import: 0,
      export: 0,
      adjustment: 0,
    })
  }, [filteredTransactions])

  const topHistoryProducts = useMemo(() => {
    const productStats = new Map()

    filteredTransactions.forEach((transaction) => {
      ;(transaction.items || []).forEach((item) => {
        const product = item.product_detail || {}
        const key = String(item.product)
        const current = productStats.get(key) || {
          id: key,
          name: product.name || `Sản phẩm #${item.product}`,
          sku: product.sku || `#${item.product}`,
          quantity: 0,
          amount: 0,
        }
        current.quantity += Number(item.quantity || 0)
        current.amount += Number(item.total_amount || 0)
        productStats.set(key, current)
      })
    })

    return Array.from(productStats.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [filteredTransactions])

  const quantityLabel = isAdjustment ? 'SL thực tế' : 'Số lượng'
  const selectedPanelTitle = isAdjustment ? 'Kiểm kê hiện tại' : 'Phiếu hiện tại'
  const selectedEmptyText = isAdjustment
    ? 'Chọn sản phẩm cần điều chỉnh tồn kho từ danh sách bên trái.'
    : 'Chọn sản phẩm từ danh sách bên trái để bắt đầu tạo phiếu.'
  const pickerHelpText = isAdjustment
    ? 'Bấm sản phẩm cần kiểm kê; số lượng mặc định là tồn hiện tại trong kho.'
    : 'Bấm sản phẩm để thêm vào phiếu; bấm lại để tăng số lượng.'
  const defaultReasonPlaceholder = {
    import: 'Nhập hàng từ nhà cung cấp',
    export: 'Xuất bán / xuất dùng',
    adjustment: 'Kiểm kê kho / điều chỉnh chênh lệch',
  }[transactionType] || 'Lý do lập phiếu'

  function updateHistoryFilter(field, value) {
    setHistoryFilters((current) => ({ ...current, [field]: value }))
  }

  function clearHistoryFilters() {
    setHistorySearch('')
    setHistoryFilters({
      date_from: '',
      date_to: '',
      warehouse: '',
      transaction_type: '',
    })
  }

  function exportHistoryCsv() {
    if (filteredTransactions.length === 0) {
      showToast('error', 'Không có dữ liệu giao dịch để xuất CSV.')
      return
    }

    const headers = [
      'Mã phiếu',
      'Loại phiếu',
      'Kho',
      'Số dòng hàng',
      'Tổng số lượng',
      'Tổng giá trị',
      'Người tạo',
      'Thời gian',
      'Lý do',
    ]
    const rows = filteredTransactions.map((transaction) => {
      const transactionTotals = getTransactionTotals(transaction)
      return [
        transaction.transaction_code,
        typeLabelMap[transaction.transaction_type] || transaction.transaction_type,
        transaction.warehouse_detail?.name || `Kho #${transaction.warehouse}`,
        (transaction.items || []).length,
        transactionTotals.quantity,
        transactionTotals.amount,
        transaction.created_by_username || 'Hệ thống',
        formatDateTime(transaction.created_at),
        transaction.reason || '',
      ].map(csvCell).join(',')
    })

    const csv = ['\uFEFF' + headers.map(csvCell).join(','), ...rows].join('\n')
    downloadTextFile(`lich-su-giao-dich-kho-${formatDateInput(new Date())}.csv`, csv, 'text/csv;charset=utf-8')
    showToast('success', 'Đã xuất CSV lịch sử giao dịch kho.')
  }

  function resetForm() {
    setTransactionCode(createTransactionCode(transactionType))
    setReason('')
    setNote('')
    setLines([])
    setProductSearch('')
    setFormError('')
  }

  function updateLine(index, field, value) {
    setLines((current) => current.map((line, lineIndex) => {
      if (lineIndex !== index) return line

      const nextLine = { ...line, [field]: value }
      if (field === 'product') {
        const product = productMap.get(String(value))
        nextLine.unit_price = product ? String(getProductPrice(product)) : ''
      }
      return nextLine
    }))
  }

  function removeLine(index) {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
  }

  function getAvailableQuantity(productId) {
    return Number(stockMap.get(String(productId))?.quantity || 0)
  }

  function getSelectedQuantity(productId) {
    return lines.reduce((sum, line) => (
      String(line.product) === String(productId) ? sum + Number(line.quantity || 0) : sum
    ), 0)
  }

  function addProductToLines(product) {
    if (!product) return

    const productId = String(product.id)
    const availableQuantity = getAvailableQuantity(productId)
    const currentQuantity = getSelectedQuantity(productId)
    if (transactionType === 'export' && currentQuantity >= availableQuantity) {
      showToast('error', `${product.name} chỉ còn ${availableQuantity} sản phẩm trong kho đã chọn.`)
      return
    }

    setLines((current) => {
      const existingIndex = current.findIndex((line) => String(line.product) === productId)
      if (existingIndex >= 0) {
        return current.map((line, index) => {
          if (index !== existingIndex) return line
          return { ...line, quantity: String(Number(line.quantity || 0) + 1) }
        })
      }

      const nextLine = {
        ...initialLine,
        product: productId,
        quantity: isAdjustment ? String(Math.max(availableQuantity, 1)) : initialLine.quantity,
        unit_price: String(getProductPrice(product)),
      }
      return [...current, nextLine]
    })
  }

  function adjustLineQuantity(index, delta) {
    setLines((current) => current.map((line, lineIndex) => {
      if (lineIndex !== index) return line
      const nextQuantity = Math.max(1, Number(line.quantity || 1) + delta)
      if (transactionType === 'export') {
        const availableQuantity = getAvailableQuantity(line.product)
        return { ...line, quantity: String(Math.min(nextQuantity, Math.max(availableQuantity, 1))) }
      }
      return { ...line, quantity: String(nextQuantity) }
    }))
  }

  function validateForm() {
    if (!selectedWarehouse) return 'Vui lòng chọn kho.'
    if (!transactionCode.trim()) return 'Vui lòng nhập mã phiếu.'
    if (lines.length === 0) return 'Vui lòng chọn ít nhất một sản phẩm.'

    const selectedProducts = new Set()
    for (const line of lines) {
      if (!line.product) return 'Vui lòng chọn sản phẩm cho tất cả dòng.'
      if (selectedProducts.has(line.product)) return 'Mỗi sản phẩm chỉ được xuất hiện một lần trong phiếu.'
      selectedProducts.add(line.product)

      const quantity = Number(line.quantity)
      const unitPrice = Number(line.unit_price)
      if (!Number.isInteger(quantity) || quantity <= 0) return `${quantityLabel} phải là số nguyên lớn hơn 0.`
      if (Number.isNaN(unitPrice) || unitPrice < 0) return 'Đơn giá phải lớn hơn hoặc bằng 0.'

      if (transactionType === 'export') {
        const availableQuantity = Number(stockMap.get(String(line.product))?.quantity || 0)
        if (quantity > availableQuantity) {
          const productName = productMap.get(String(line.product))?.name || 'Sản phẩm'
          return `${productName} chỉ còn ${availableQuantity} sản phẩm trong kho đã chọn.`
        }
      }
    }

    return ''
  }

  async function createStockTransaction({ exportAfterCreate = false } = {}) {
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      showToast('error', validationError)
      return
    }

    const printWindow = exportAfterCreate ? window.open('', '_blank') : null
    if (exportAfterCreate && !printWindow) {
      showToast('error', 'Trình duyệt đã chặn cửa sổ xuất phiếu. Vui lòng cho phép popup rồi thử lại.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const createdTransaction = await apiJson('/stock-transactions/', {
        method: 'POST',
        body: {
          warehouse: Number(selectedWarehouse),
          transaction_type: transactionType,
          transaction_code: transactionCode.trim(),
          reason: reason.trim(),
          note: note.trim(),
          items: lines.map((line) => ({
            product: Number(line.product),
            quantity: Number(line.quantity),
            unit_price: Number(line.unit_price || 0),
            note: line.note.trim(),
          })),
        },
      })

      if (exportAfterCreate) {
        exportTransactionVoucher(createdTransaction, printWindow)
      }
      resetForm()
      setRefreshKey((value) => value + 1)
      showToast('success', exportAfterCreate ? `${meta.successMessage} Đã mở phiếu để in hoặc lưu PDF.` : meta.successMessage)
    } catch (requestError) {
      if (printWindow && !printWindow.closed) printWindow.close()
      const message = requestError.message || 'Không thể tạo phiếu kho.'
      setFormError(message)
      showToast('error', message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await createStockTransaction()
  }

  return (
    <div className={`stock-page${isFormMode ? ' has-fixed-actions' : ''}`}>
      {toast && (
        <div className={`stock-toast ${toast.type}`} role="status" aria-live="polite">
          <div className="stock-toast-icon" aria-hidden="true">{toast.type === 'success' ? '✓' : '!'}</div>
          <p>{toast.message}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <StockTransactionHeader
        activeWarehouses={activeWarehouses}
        formatCurrency={formatCurrency}
        historyStats={historyStats}
        isFormMode={isFormMode}
        meta={meta}
        products={products}
        transactions={transactions}
      />

      {error && <div className="stock-notice error">{error}</div>}

      {isFormMode && (
        <StockTransactionForm
          activeWarehouses={activeWarehouses}
          addProductToLines={addProductToLines}
          adjustLineQuantity={adjustLineQuantity}
          createStockTransaction={createStockTransaction}
          defaultReasonPlaceholder={defaultReasonPlaceholder}
          formError={formError}
          formatCurrency={formatCurrency}
          getAvailableQuantity={getAvailableQuantity}
          getSelectedQuantity={getSelectedQuantity}
          handleSubmit={handleSubmit}
          isAdjustment={isAdjustment}
          lines={lines}
          loading={loading}
          meta={meta}
          note={note}
          pickerHelpText={pickerHelpText}
          productMap={productMap}
          productPickerItems={productPickerItems}
          productSearch={productSearch}
          quantityLabel={quantityLabel}
          reason={reason}
          removeLine={removeLine}
          resetForm={resetForm}
          saving={saving}
          selectedEmptyText={selectedEmptyText}
          selectedPanelTitle={selectedPanelTitle}
          selectedWarehouse={selectedWarehouse}
          setNote={setNote}
          setProductSearch={setProductSearch}
          setReason={setReason}
          setSelectedWarehouse={setSelectedWarehouse}
          setTransactionCode={setTransactionCode}
          stockLoading={stockLoading}
          stockMap={stockMap}
          totals={totals}
          transactionCode={transactionCode}
          transactionType={transactionType}
          updateLine={updateLine}
          warehouseStocks={warehouseStocks}
        />
      )}

      <section className="stock-history-card">
        <StockHistoryDashboard
          clearHistoryFilters={clearHistoryFilters}
          exportHistoryCsv={exportHistoryCsv}
          filteredTransactions={filteredTransactions}
          formatCurrency={formatCurrency}
          historyFilters={historyFilters}
          historySearch={historySearch}
          historyStats={historyStats}
          isFormMode={isFormMode}
          loading={loading}
          onRefresh={() => setRefreshKey((value) => value + 1)}
          setHistorySearch={setHistorySearch}
          topHistoryProducts={topHistoryProducts}
          updateHistoryFilter={updateHistoryFilter}
          warehouses={warehouses}
        />

        {loading ? (
          <div className="stock-state">Đang tải giao dịch kho...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="stock-state">{meta.emptyLabel}</div>
        ) : (
          <div className="stock-table-wrap">
            <StockTransactionHistoryTable
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
              getTransactionTotals={getTransactionTotals}
              onExportVoucher={exportTransactionVoucher}
              onSelectTransaction={setSelectedTransaction}
              transactions={paginatedTransactions}
              typeLabelMap={typeLabelMap}
            />
            <PaginationControls
              itemLabel="phiếu"
              loading={loading}
              onPageChange={setHistoryPage}
              page={historyPage}
              pageSize={PAGE_SIZE}
              totalCount={filteredTransactions.length}
            />
          </div>
        )}
      </section>

      <StockTransactionDetailModal
        formatCurrency={formatCurrency}
        formatDateTime={formatDateTime}
        getProductImage={getProductImage}
        onClose={() => setSelectedTransaction(null)}
        onExportVoucher={exportTransactionVoucher}
        transaction={selectedTransaction}
        typeLabelMap={typeLabelMap}
      />
    </div>
  )
}
