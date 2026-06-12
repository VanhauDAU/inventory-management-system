import { useEffect, useMemo, useState } from 'react'
import './StockTransactionPage.css'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const transactionMeta = {
  import: {
    eyebrow: 'Nhập kho',
    title: 'Phiếu nhập kho',
    description: 'Tạo phiếu nhập hàng vào kho và cập nhật tồn kho theo từng sản phẩm.',
    submitLabel: 'Tạo phiếu nhập',
    successMessage: 'Đã tạo phiếu nhập kho.',
    emptyLabel: 'Chưa có phiếu nhập kho.',
  },
  export: {
    eyebrow: 'Xuất kho',
    title: 'Phiếu xuất kho',
    description: 'Tạo phiếu xuất hàng khỏi kho, hệ thống tự kiểm tra số lượng tồn hiện có.',
    submitLabel: 'Tạo phiếu xuất',
    successMessage: 'Đã tạo phiếu xuất kho.',
    emptyLabel: 'Chưa có phiếu xuất kho.',
  },
  all: {
    eyebrow: 'Giao dịch kho',
    title: 'Lịch sử giao dịch kho',
    description: 'Theo dõi toàn bộ phiếu nhập, xuất và điều chỉnh kho theo thời gian.',
    submitLabel: '',
    successMessage: '',
    emptyLabel: 'Chưa có giao dịch kho.',
  },
}

const typeLabelMap = {
  import: 'Nhập kho',
  export: 'Xuất kho',
  adjustment: 'Điều chỉnh',
}

const initialLine = {
  product: '',
  quantity: '1',
  unit_price: '',
  note: '',
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const formatDateTime = (value) => {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

const getProductPrice = (product) => product?.cost_price ?? product?.price ?? product?.selling_price ?? 0

const getProductImage = (product) => product?.image || '/product-images/product-default.svg'

async function refreshAccessToken(signal) {
  const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken')
  if (!refreshToken) return null

  const response = await fetch(`${apiUrl}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
    signal,
  })

  if (!response.ok) return null

  const data = await response.json()
  if (!data.access) return null

  localStorage.setItem('access_token', data.access)
  localStorage.setItem('accessToken', data.access)
  return data.access
}

function getApiErrorMessage(data, fallbackStatus) {
  if (data?.detail) return data.detail

  const firstField = data && typeof data === 'object' ? Object.keys(data)[0] : ''
  const firstError = firstField ? data[firstField] : null
  const rawMessage =
    (Array.isArray(firstError) ? firstError[0] : '') ||
    (typeof firstError === 'string' ? firstError : '') ||
    ''

  if (firstField === 'items') {
    return Array.isArray(firstError)
      ? firstError.join(', ')
      : rawMessage || 'Dòng sản phẩm không hợp lệ.'
  }

  if (firstField && rawMessage) return `${firstField}: ${rawMessage}`
  return `Lỗi API: ${fallbackStatus}`
}

async function apiJson(path, { method = 'GET', body, signal } = {}) {
  let token = localStorage.getItem('access_token') || localStorage.getItem('accessToken')
  if (!token) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.')

  const request = (accessToken) => fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  let response = await request(token)
  if (response.status === 401) {
    const newToken = await refreshAccessToken(signal)
    if (!newToken) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    response = await request(newToken)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(getApiErrorMessage(data, response.status))
  return data
}

async function fetchAllPages(path, signal) {
  const records = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const separator = path.includes('?') ? '&' : '?'
    const data = await apiJson(`${path}${separator}page=${page}`, { signal })
    const list = Array.isArray(data.results) ? data.results : data
    records.push(...(Array.isArray(list) ? list : []))
    hasNextPage = Boolean(data.next)
    page += 1
  }

  return records
}

function createTransactionCode(type) {
  const prefix = type === 'import' ? 'NK' : 'XK'
  const now = new Date()
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const timePart = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  const suffix = String(now.getMilliseconds()).padStart(3, '0')

  return `${prefix}-${datePart}-${timePart}${suffix}`
}

export default function StockTransactionPage({ transactionType = 'all' }) {
  const meta = transactionMeta[transactionType] || transactionMeta.all
  const isFormMode = transactionType === 'import' || transactionType === 'export'
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
  const [productSearch, setProductSearch] = useState('')

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
        const transactionPath = transactionType === 'all'
          ? '/stock-transactions/?ordering=-created_at'
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
  }, [isFormMode, refreshKey, selectedWarehouse, transactionType])

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
    if (transactionType !== 'export') return products
    return products.filter((product) => Number(stockMap.get(String(product.id))?.quantity || 0) > 0)
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
      if (!Number.isInteger(quantity) || quantity <= 0) return 'Số lượng phải là số nguyên lớn hơn 0.'
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

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      showToast('error', validationError)
      return
    }

    setSaving(true)
    setFormError('')
    try {
      await apiJson('/stock-transactions/', {
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

      resetForm()
      setRefreshKey((value) => value + 1)
      showToast('success', meta.successMessage)
    } catch (requestError) {
      const message = requestError.message || 'Không thể tạo phiếu kho.'
      setFormError(message)
      showToast('error', message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stock-page">
      {toast && (
        <div className={`stock-toast ${toast.type}`} role="status" aria-live="polite">
          <div className="stock-toast-icon" aria-hidden="true">{toast.type === 'success' ? '✓' : '!'}</div>
          <p>{toast.message}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <section className="stock-header">
        <div>
          <span className="stock-eyebrow">{meta.eyebrow}</span>
          <h2>{meta.title}</h2>
          <p>{meta.description}</p>
        </div>
        <div className="stock-header-stats">
          <article><span>Phiếu</span><strong>{transactions.length}</strong></article>
          <article><span>Sản phẩm</span><strong>{products.length}</strong></article>
          <article><span>Kho</span><strong>{activeWarehouses.length}</strong></article>
        </div>
      </section>

      {error && <div className="stock-notice error">{error}</div>}

      {isFormMode && (
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
              <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder={transactionType === 'import' ? 'Nhập hàng từ nhà cung cấp' : 'Xuất bán / xuất dùng'} maxLength={255} />
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
                <small>Bấm sản phẩm để thêm vào phiếu; bấm lại để tăng số lượng.</small>
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
                          <small>{transactionType === 'export' ? `Còn ${availableQuantity}` : `Tồn ${product.quantity || 0}`}</small>
                        </span>
                        {isSelected && <span className="stock-selected-badge">x{selectedQuantity}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="stock-selected-panel">
                <div className="stock-selected-head">
                  <span>Phiếu hiện tại</span>
                  <strong>{formatCurrency(totals)}</strong>
                </div>

                {lines.length === 0 ? (
                  <div className="stock-selected-empty">
                    Chọn sản phẩm từ danh sách bên trái để bắt đầu tạo phiếu.
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
                              {transactionType === 'export' && <small>Còn trong kho: {availableQuantity}</small>}
                            </div>
                          </div>

                          <label className="stock-field">
                            <span>Số lượng</span>
                            <div className="stock-stepper">
                              <button type="button" onClick={() => adjustLineQuantity(index, -1)} aria-label="Giảm số lượng">−</button>
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
                            ×
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
            <button type="submit" className="stock-btn primary" disabled={saving || loading || stockLoading}>
              {saving ? 'Đang lưu...' : meta.submitLabel}
            </button>
          </div>
        </form>
      )}

      <section className="stock-history-card">
        <div className="stock-card-head">
          <span>Lịch sử phiếu kho</span>
          <label className="stock-search">
            <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Tìm mã phiếu, kho, sản phẩm" />
          </label>
        </div>

        {loading ? (
          <div className="stock-state">Đang tải giao dịch kho...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="stock-state">{meta.emptyLabel}</div>
        ) : (
          <div className="stock-table-wrap">
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
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => {
                  const quantity = (transaction.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                  const amount = (transaction.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
                  const itemNames = (transaction.items || [])
                    .map((item) => item.product_detail?.name || `Sản phẩm #${item.product}`)
                    .join(', ')

                  return (
                    <tr key={transaction.id}>
                      <td><span className="stock-code">{transaction.transaction_code}</span></td>
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
