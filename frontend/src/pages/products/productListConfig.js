export const orderingOptions = [
  { value: '-created_at', label: 'Mới nhất' },
  { value: 'name', label: 'Tên A-Z' },
  { value: 'price', label: 'Giá tăng dần' },
  { value: '-price', label: 'Giá giảm dần' },
  { value: '-quantity', label: 'Tổng tồn cao' },
]

export const createProductFormData = (payload) => {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return
    formData.append(key, value === null ? '' : value)
  })

  return formData
}

export function getProductApiErrorMessage(data, fallbackStatus) {
  if (data?.detail) return data.detail

  const firstField = data && typeof data === 'object' ? Object.keys(data)[0] : ''
  const firstError = firstField ? data[firstField] : null
  const rawMessage =
    (Array.isArray(firstError) ? firstError[0] : '') ||
    (typeof firstError === 'string' ? firstError : '') ||
    ''

  if (firstField === 'image' && rawMessage.toLowerCase().includes('valid url')) {
    return 'Ảnh sản phẩm chưa được upload đúng kiểu file. Cần chạy migration ImageField và restart backend trước khi thêm sản phẩm.'
  }

  if (firstField === 'image') return `Ảnh sản phẩm: ${rawMessage || 'Không hợp lệ.'}`
  if (firstField === 'barcode') return `Barcode: ${rawMessage || 'Không hợp lệ hoặc đã tồn tại.'}`
  if (firstField && rawMessage) return `${firstField}: ${rawMessage}`
  return `Lỗi API: ${fallbackStatus}`
}
