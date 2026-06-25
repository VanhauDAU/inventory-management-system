import { useState, useEffect } from 'react'
import { getCategories, getSuppliers } from '../../../services/productService'
import {
  ProductClassificationSection,
  ProductIdentitySection,
  ProductImageField,
  ProductPricingSection,
} from './ProductFormSections'
import './ProductForm.css'

const unitOptions = [
  { value: 'piece', label: 'Cái' },
  { value: 'box', label: 'Hộp' },
  { value: 'pack', label: 'Gói' },
  { value: 'set', label: 'Bộ' },
  { value: 'kg', label: 'Kg' },
  { value: 'meter', label: 'Mét' },
  { value: 'liter', label: 'Lít' },
]

const maxImageSize = 5 * 1024 * 1024
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '')

const formatMoneyInput = (value) => {
  const digits = onlyDigits(value)
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const formatMoneyFromApi = (value) => {
  if (value === '' || value === null || value === undefined) return ''
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return formatMoneyInput(value)
  return formatMoneyInput(String(Math.round(numberValue)))
}

const parseMoneyInput = (value) => {
  const digits = onlyDigits(value)
  return digits ? Number(digits) : 0
}

// initialData: truyền vào khi sửa, để trống khi thêm mới
function ProductForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    cost_price: '',
    selling_price: '',
    minimum_stock: '',
    unit: 'piece',
    status: 'active',
    category: '',
    supplier: '',
  })
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [catLoading, setCatLoading] = useState(true)
  const [supplierLoading, setSupplierLoading] = useState(true)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(initialData?.image || '')

  // Nếu sửa thì điền sẵn dữ liệu
  useEffect(() => {
    if (initialData) {
      setForm({
        sku: initialData.sku || '',
        barcode: initialData.barcode || '',
        name: initialData.name || '',
        description: initialData.description || '',
        cost_price: formatMoneyFromApi(initialData.cost_price),
        selling_price: formatMoneyFromApi(initialData.selling_price ?? initialData.price),
        minimum_stock: initialData.minimum_stock || '',
        unit: initialData.unit || 'piece',
        status: initialData.status || 'active',
        category: initialData.category || '',
        supplier: initialData.supplier || '',
      })
      setImageFile(null)
      setImagePreview(initialData.image || '')
    }
  }, [initialData])

  // Load danh mục
  useEffect(() => {
    getCategories()
      .then((res) => {
        const data = res.data?.results ?? res.data
        setCategories(Array.isArray(data) ? data : [])
      })
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false))
  }, [])

  // Load nhà cung cấp
  useEffect(() => {
    getSuppliers()
      .then((res) => {
        const data = res.data?.results ?? res.data
        setSuppliers(Array.isArray(data) ? data : [])
      })
      .catch(() => setSuppliers([]))
      .finally(() => setSupplierLoading(false))
  }, [])

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const validate = () => {
    const newErrors = {}
    const barcode = form.barcode.trim()
    const costPrice = parseMoneyInput(form.cost_price)
    const sellingPrice = parseMoneyInput(form.selling_price)
    const minimumStock = Number(form.minimum_stock || 0)

    if (barcode && !/^[A-Za-z0-9-]{6,100}$/.test(barcode)) {
      newErrors.barcode = 'Barcode chỉ gồm chữ, số, gạch ngang và dài 6-100 ký tự'
    }

    if (!form.name.trim()) newErrors.name = 'Tên sản phẩm không được để trống'
    else if (form.name.trim().length < 2) newErrors.name = 'Tên sản phẩm ít nhất 2 ký tự'
    else if (form.name.trim().length > 255) newErrors.name = 'Tên sản phẩm không được vượt quá 255 ký tự'

    if (form.description.trim().length > 2000) {
      newErrors.description = 'Mô tả không được vượt quá 2000 ký tự'
    }

    if (!imageFile && !imagePreview) {
      newErrors.image = 'Vui lòng chọn ảnh sản phẩm'
    } else if (imageFile && !allowedImageTypes.includes(imageFile.type)) {
      newErrors.image = 'Ảnh phải có định dạng JPG, PNG, WEBP hoặc GIF'
    } else if (imageFile && imageFile.size > maxImageSize) {
      newErrors.image = 'Ảnh không được vượt quá 5MB'
    }

    if (onlyDigits(form.selling_price) === '') {
      newErrors.selling_price = 'Vui lòng nhập giá bán'
    } else if (isNaN(sellingPrice) || sellingPrice < 0) {
      newErrors.selling_price = 'Giá bán phải là số không âm'
    } else if (sellingPrice > 9999999999.99) {
      newErrors.selling_price = 'Giá bán quá lớn'
    }

    if (form.cost_price !== '' && (isNaN(costPrice) || costPrice < 0)) {
      newErrors.cost_price = 'Giá nhập phải là số không âm'
    } else if (costPrice > 9999999999.99) {
      newErrors.cost_price = 'Giá nhập quá lớn'
    }

    if (!newErrors.cost_price && !newErrors.selling_price && sellingPrice < costPrice) {
      newErrors.selling_price = 'Giá bán không được nhỏ hơn giá nhập'
    }

    if (form.minimum_stock !== '' && (!Number.isInteger(minimumStock) || minimumStock < 0)) {
      newErrors.minimum_stock = 'Tồn tối thiểu phải là số nguyên không âm'
    }

    if (!form.unit.trim()) newErrors.unit = 'Vui lòng chọn hoặc nhập đơn vị tính'
    else if (form.unit.trim().length > 50) newErrors.unit = 'Đơn vị tính không được vượt quá 50 ký tự'

    if (!form.category) newErrors.category = 'Vui lòng chọn danh mục'
    if (form.supplier && !Number.isInteger(Number(form.supplier))) newErrors.supplier = 'Nhà cung cấp không hợp lệ'

    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleMoneyChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: formatMoneyInput(value) }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    if (errors.image) setErrors((prev) => ({ ...prev, image: '' }))

    if (!file) {
      setImagePreview(initialData?.image || '')
      return
    }

    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    onSubmit({
      barcode: form.barcode.trim() || null,
      name: form.name.trim(),
      description: form.description.trim(),
      ...(imageFile ? { image: imageFile } : {}),
      cost_price: form.cost_price === '' ? 0 : parseMoneyInput(form.cost_price),
      selling_price: parseMoneyInput(form.selling_price),
      price: parseMoneyInput(form.selling_price),
      minimum_stock: form.minimum_stock === '' ? 0 : Number(form.minimum_stock),
      unit: form.unit.trim(),
      status: form.status,
      category: Number(form.category),
      supplier: form.supplier ? Number(form.supplier) : null,
    })
  }

  const isEdit = !!initialData

  return (
    <form onSubmit={handleSubmit} noValidate className="product-form">
      <div className="form-layout">
        <ProductImageField
          error={errors.image}
          imageFile={imageFile}
          imagePreview={imagePreview}
          isEdit={isEdit}
          onImageChange={handleImageChange}
        />

        <div className="form-fields">
          <ProductIdentitySection errors={errors} form={form} isEdit={isEdit} onChange={handleChange} />

          <ProductPricingSection errors={errors} form={form} onChange={handleChange} onMoneyChange={handleMoneyChange} />

          <ProductClassificationSection
            catLoading={catLoading}
            categories={categories}
            errors={errors}
            form={form}
            onChange={handleChange}
            supplierLoading={supplierLoading}
            suppliers={suppliers}
            unitOptions={unitOptions}
          />
        </div>
      </div>

      {/* Nút hành động */}
      <div className="form-actions">
        <button type="button" className="btn btn-cancel" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
        </button>
      </div>
    </form>
  )
}

export default ProductForm
