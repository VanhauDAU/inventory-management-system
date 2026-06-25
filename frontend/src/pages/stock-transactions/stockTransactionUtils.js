const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export const PAGE_SIZE = 10

export const transactionMeta = {
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

export const typeLabelMap = {
  import: 'Nhập kho',
  export: 'Xuất kho',
  adjustment: 'Điều chỉnh',
}

export const initialLine = {
  product: '',
  quantity: '1',
  unit_price: '',
  note: '',
}

export const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export const formatDateTime = (value) => {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export const formatDateInput = (date) => {
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

export const getProductPrice = (product) => product?.cost_price ?? product?.price ?? product?.selling_price ?? 0

export const getProductImage = (product) => product?.image || '/product-images/product-default.svg'

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

export function getTransactionTotals(transaction) {
  const items = transaction?.items || []
  return {
    quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    amount: items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
  }
}

export function buildQueryString(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  return query.toString()
}

export function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
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

export function csvCell(value) {
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

export function exportTransactionVoucher(transaction, existingWindow = null) {
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

export async function apiJson(path, { method = 'GET', body, signal } = {}) {
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

export async function fetchAllPages(path, signal) {
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

export function createTransactionCode(type) {
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
