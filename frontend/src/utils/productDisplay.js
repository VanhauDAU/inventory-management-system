export const getProductPrice = (product) => product?.price ?? product?.selling_price ?? 0

export const getCategoryName = (product) =>
  product?.category_detail?.name || product?.category_name || `Danh mục #${product?.category || 'N/A'}`

export const getSupplierName = (product) =>
  product?.supplier_detail?.name || product?.supplier_name || (product?.supplier ? `NCC #${product.supplier}` : 'Chưa gán')

export const getProductImages = (product) => {
  const galleryImages = Array.isArray(product?.images)
    ? product.images.map((item) => item?.image).filter(Boolean)
    : []
  const legacyImages = [product?.image, product?.image_url, product?.thumbnail].filter(Boolean)
  return Array.from(new Set([...galleryImages, ...legacyImages]))
}

const productImageMap = {
  1: '/product-images/laptop.svg',
  2: '/product-images/keyboard.svg',
  3: '/product-images/mouse.svg',
  4: '/product-images/ssd.svg',
  5: '/product-images/notebook.svg',
  6: '/product-images/hub.svg',
  default: '/product-images/product-default.svg',
}

const categoryImageMap = {
  'Thiết bị công nghệ': '/product-images/laptop.svg',
  'Phụ kiện máy tính': '/product-images/keyboard.svg',
  'Văn phòng phẩm': '/product-images/notebook.svg',
  'Thiết bị lưu trữ': '/product-images/ssd.svg',
}

export const getProductImage = (product) => {
  const categoryName = getCategoryName(product)
  return (
    getProductImages(product)[0] ||
    productImageMap[Number(product?.id)] ||
    categoryImageMap[categoryName] ||
    productImageMap.default
  )
}

export const getStockStatus = (product) => {
  const minimumStock = Number(product?.minimum_stock ?? 5)
  const quantity = Number(product?.quantity || 0)
  if (quantity === 0) return { label: 'Hết hàng', className: 'danger' }
  if (quantity <= minimumStock) return { label: 'Sắp hết', className: 'warning' }
  return { label: 'Còn hàng', className: 'success' }
}

const businessStatusMap = {
  active: { label: 'Đang kinh doanh', className: 'active' },
  inactive: { label: 'Tạm ngưng', className: 'inactive' },
  discontinued: { label: 'Ngừng kinh doanh', className: 'discontinued' },
}

export const getBusinessStatus = (product) =>
  businessStatusMap[product?.status] || businessStatusMap.active

const unitLabelMap = {
  piece: 'Cái',
  box: 'Hộp',
  pack: 'Gói',
  set: 'Bộ',
  kg: 'Kg',
  meter: 'Mét',
  liter: 'Lít',
}

export const getUnitLabel = (unit) => unitLabelMap[unit] || unit || 'Chưa có'
