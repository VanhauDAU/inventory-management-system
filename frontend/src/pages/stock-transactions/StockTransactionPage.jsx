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
  adjustment: {
    eyebrow: 'Điều chỉnh kho',
    title: 'Phiếu điều chỉnh kho',
    description: 'Ghi nhận số lượng kiểm kê thực tế và cập nhật lại tồn kho theo từng sản phẩm.',
    submitLabel: 'Tạo phiếu điều chỉnh',
    successMessage: 'Đã tạo phiếu điều chỉnh kho.',
    emptyLabel: 'Chưa có phiếu điều chỉnh kho.',
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

const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatLongDateTime = (value) => {
  const date = value ? new Date(value) : new Date()
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const getProductPrice = (product) => product?.cost_price ?? product?.price ?? product?.selling_price ?? 0

const getProductImage = (product) => product?.image || '/product-images/product-default.svg'

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const getVoucherTitle = (transactionType) => ({
  import: 'PHIẾU NHẬP KHO',
  export: 'PHIẾU XUẤT KHO',
  adjustment: 'PHIẾU ĐIỀU CHỈNH KHO',
}[transactionType] || 'PHIẾU GIAO DỊCH KHO')

function getTransactionTotals(transaction) {
  const items = transaction?.items || []
  return {
    quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    amount: items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
  }
}

function buildQueryString(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  return query.toString()
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function buildVoucherHtml(transaction) {
  const items = transaction.items || []
  const totals = getTransactionTotals(transaction)
  const warehouse = transaction.warehouse_detail || {}
  const title = getVoucherTitle(transaction.transaction_type)
  const typeLabel = typeLabelMap[transaction.transaction_type] || transaction.transaction_type

  const itemRows = items.map((item, index) => {
    const product = item.product_detail || {}
    return `
      <tr>
        <td class="center">${index + 1}</td>
        <td>
          <strong>${escapeHtml(product.name || `Sản phẩm #${item.product}`)}</strong>
          <span>${escapeHtml(product.category_detail?.name || 'Chưa có danh mục')}</span>
        </td>
        <td>${escapeHtml(product.sku || `#${item.product}`)}</td>
        <td>${escapeHtml(product.unit || '')}</td>
        <td class="number">${escapeHtml(item.quantity)}</td>
        <td class="number">${escapeHtml(formatCurrency(item.unit_price))}</td>
        <td class="number">${escapeHtml(formatCurrency(item.total_amount))}</td>
        <td>${escapeHtml(item.note || '')}</td>
      </tr>
    `
  }).join('')

  return `<!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)} - ${escapeHtml(transaction.transaction_code)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111827;
            background: #e5e7eb;
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.45;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 18mm;
            background: #fff;
          }
          .topline {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 20px;
            padding-bottom: 14px;
            border-bottom: 2px solid #111827;
          }
          .brand h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 0;
            text-transform: uppercase;
          }
          .brand p, .doc-meta p {
            margin: 3px 0;
            color: #4b5563;
            font-size: 12px;
          }
          .doc-meta {
            text-align: right;
            white-space: nowrap;
          }
          .title {
            margin: 22px 0 18px;
            text-align: center;
          }
          .title h2 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 0;
          }
          .title p {
            margin: 6px 0 0;
            color: #374151;
            font-size: 13px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 18px;
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: #f9fafb;
          }
          .info-item span {
            display: block;
            color: #6b7280;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .info-item strong {
            display: block;
            margin-top: 2px;
            font-size: 13px;
          }
          .section-title {
            margin: 18px 0 8px;
            font-size: 14px;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            padding: 8px;
            border: 1px solid #d1d5db;
            vertical-align: top;
          }
          th {
            color: #111827;
            background: #f3f4f6;
            text-transform: uppercase;
            font-size: 11px;
          }
          td span {
            display: block;
            color: #6b7280;
            font-size: 11px;
          }
          .center { text-align: center; }
          .number { text-align: right; white-space: nowrap; }
          tfoot td {
            font-weight: 700;
            background: #f9fafb;
          }
          .notes {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 14px;
          }
          .note-box {
            min-height: 70px;
            padding: 10px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
          }
          .note-box span {
            display: block;
            margin-bottom: 5px;
            color: #6b7280;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .signatures {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-top: 28px;
            text-align: center;
          }
          .signature strong {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
          }
          .signature span {
            display: block;
            margin-top: 70px;
            border-top: 1px solid #9ca3af;
            padding-top: 6px;
            color: #6b7280;
            font-size: 11px;
          }
          .footer {
            margin-top: 20px;
            color: #6b7280;
            font-size: 11px;
            text-align: center;
          }
          .actions {
            position: fixed;
            top: 16px;
            right: 16px;
            display: flex;
            gap: 8px;
          }
          .actions button {
            height: 36px;
            padding: 0 14px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #fff;
            color: #111827;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
          }
          .actions .primary {
            border-color: #2563eb;
            background: #2563eb;
            color: #fff;
          }
          @media print {
            body { background: #fff; }
            .page { width: auto; min-height: auto; margin: 0; padding: 0; }
            .actions { display: none; }
            @page { size: A4; margin: 16mm; }
          }
        </style>
      </head>
      <body>
        <div class="actions">
          <button type="button" onclick="window.close()">Đóng</button>
          <button type="button" class="primary" onclick="window.print()">In / Lưu PDF</button>
        </div>
        <main class="page">
          <header class="topline">
            <div class="brand">
              <h1>ProductMS</h1>
              <p>Hệ thống quản lý sản phẩm và kho hàng</p>
              <p>Phiếu được xuất tự động từ dữ liệu giao dịch kho</p>
            </div>
            <div class="doc-meta">
              <p><strong>Mã phiếu:</strong> ${escapeHtml(transaction.transaction_code)}</p>
              <p><strong>Loại:</strong> ${escapeHtml(typeLabel)}</p>
              <p><strong>Ngày xuất:</strong> ${escapeHtml(formatLongDateTime(new Date()))}</p>
            </div>
          </header>

          <section class="title">
            <h2>${escapeHtml(title)}</h2>
            <p>Chứng từ ghi nhận nghiệp vụ kho, làm căn cứ đối chiếu hàng hóa và trách nhiệm bàn giao.</p>
          </section>

          <section class="info-grid">
            <div class="info-item"><span>Kho</span><strong>${escapeHtml(warehouse.name || `Kho #${transaction.warehouse}`)}</strong></div>
            <div class="info-item"><span>Địa chỉ kho</span><strong>${escapeHtml(warehouse.address || 'Chưa cập nhật')}</strong></div>
            <div class="info-item"><span>Người phụ trách kho</span><strong>${escapeHtml(warehouse.manager_name || 'Chưa cập nhật')}</strong></div>
            <div class="info-item"><span>Số điện thoại kho</span><strong>${escapeHtml(warehouse.phone || 'Chưa cập nhật')}</strong></div>
            <div class="info-item"><span>Người lập phiếu</span><strong>${escapeHtml(transaction.created_by_username || 'Hệ thống')}</strong></div>
            <div class="info-item"><span>Thời gian lập</span><strong>${escapeHtml(formatLongDateTime(transaction.created_at))}</strong></div>
          </section>

          <h3 class="section-title">Danh sách hàng hóa</h3>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th>SKU</th>
                <th>ĐVT</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="number">Tổng cộng</td>
                <td class="number">${escapeHtml(totals.quantity)}</td>
                <td></td>
                <td class="number">${escapeHtml(formatCurrency(totals.amount))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <section class="notes">
            <div class="note-box">
              <span>Lý do</span>
              ${escapeHtml(transaction.reason || 'Chưa có lý do')}
            </div>
            <div class="note-box">
              <span>Ghi chú</span>
              ${escapeHtml(transaction.note || 'Chưa có ghi chú')}
            </div>
          </section>

          <section class="signatures">
            <div class="signature"><strong>Người lập phiếu</strong><span>Ký, ghi rõ họ tên</span></div>
            <div class="signature"><strong>Thủ kho</strong><span>Ký, ghi rõ họ tên</span></div>
            <div class="signature"><strong>Người giao/nhận</strong><span>Ký, ghi rõ họ tên</span></div>
            <div class="signature"><strong>Kế toán/Quản lý</strong><span>Ký, ghi rõ họ tên</span></div>
          </section>

          <p class="footer">Chứng từ này được tạo bởi ProductMS. Vui lòng kiểm tra hàng hóa, số lượng và chữ ký trước khi lưu trữ.</p>
        </main>
      </body>
    </html>`
}

function exportTransactionVoucher(transaction, existingWindow = null) {
  const printWindow = existingWindow || window.open('', '_blank')
  if (!printWindow) return false
  printWindow.document.open()
  printWindow.document.write(buildVoucherHtml(transaction))
  printWindow.document.close()
  printWindow.focus()
  return true
}

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
  const prefixMap = {
    import: 'NK',
    export: 'XK',
    adjustment: 'DC',
  }
  const prefix = prefixMap[type] || 'PK'
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
            <button type="button" className="stock-btn secondary" disabled={saving || loading || stockLoading} onClick={() => createStockTransaction({ exportAfterCreate: true })}>
              Tạo & xuất phiếu
            </button>
            <button type="submit" className="stock-btn primary" disabled={saving || loading || stockLoading}>
              {saving ? 'Đang lưu...' : meta.submitLabel}
            </button>
          </div>
        </form>
      )}

      <section className="stock-history-card">
        {isFormMode ? (
          <div className="stock-card-head">
            <span>Lịch sử phiếu kho</span>
            <label className="stock-search">
              <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Tìm mã phiếu, kho, sản phẩm" />
            </label>
          </div>
        ) : (
          <div className="stock-history-dashboard">
            <div className="stock-history-toolbar">
              <div>
                <span className="stock-eyebrow">Báo cáo nâng cao</span>
                <h3>Lịch sử giao dịch kho</h3>
                <p>Lọc theo thời gian, kho, loại phiếu; xem nhanh giá trị và xuất dữ liệu để đối soát.</p>
              </div>
              <div className="stock-history-actions">
                <button type="button" className="stock-btn secondary" onClick={clearHistoryFilters}>Xóa lọc</button>
                <button type="button" className="stock-btn secondary" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>Làm mới</button>
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
        )}

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
                  <th>Thao tác</th>
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
                      <td>
                        <button type="button" className="stock-code" onClick={() => setSelectedTransaction(transaction)}>
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
                          <button type="button" className="stock-detail-btn" onClick={() => setSelectedTransaction(transaction)}>
                            Chi tiết
                          </button>
                          <button type="button" className="stock-export-btn" onClick={() => exportTransactionVoucher(transaction)}>
                            Xuất phiếu
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedTransaction && (
        <div className="stock-modal-backdrop" role="presentation" onClick={() => setSelectedTransaction(null)}>
          <section className="stock-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="stock-modal-header">
              <div>
                <span className="stock-eyebrow">Chi tiết phiếu kho</span>
                <h3>{selectedTransaction.transaction_code}</h3>
              </div>
              <div className="stock-modal-actions">
                <button type="button" className="stock-export-btn" onClick={() => exportTransactionVoucher(selectedTransaction)}>Xuất phiếu</button>
                <button type="button" aria-label="Đóng" onClick={() => setSelectedTransaction(null)}>×</button>
              </div>
            </div>

            <div className="stock-detail-summary">
              <article>
                <span>Loại phiếu</span>
                <strong>{typeLabelMap[selectedTransaction.transaction_type] || selectedTransaction.transaction_type}</strong>
              </article>
              <article>
                <span>Kho</span>
                <strong>{selectedTransaction.warehouse_detail?.name || `Kho #${selectedTransaction.warehouse}`}</strong>
              </article>
              <article>
                <span>Người tạo</span>
                <strong>{selectedTransaction.created_by_username || 'Hệ thống'}</strong>
              </article>
              <article>
                <span>Thời gian</span>
                <strong>{formatDateTime(selectedTransaction.created_at)}</strong>
              </article>
            </div>

            <div className="stock-detail-notes">
              <div>
                <span>Lý do</span>
                <p>{selectedTransaction.reason || 'Chưa có lý do'}</p>
              </div>
              <div>
                <span>Ghi chú</span>
                <p>{selectedTransaction.note || 'Chưa có ghi chú'}</p>
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
                  {(selectedTransaction.items || []).map((item) => (
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
                        {(selectedTransaction.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                      </strong>
                    </td>
                    <td />
                    <td>
                      <strong>
                        {formatCurrency((selectedTransaction.items || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0))}
                      </strong>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
