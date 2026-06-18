export const formatNumber = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value || 0))

export const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export const formatDays = (value) => {
  if (value === null || value === undefined) return 'Chưa đủ dữ liệu'
  return `${formatNumber(value)} ngày`
}
