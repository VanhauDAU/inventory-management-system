import { useState, useEffect } from 'react'
import { getCategories, getSuppliers } from '../services/productService'
import '../styles/ProductForm.css'

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
    quantity: '',
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
        quantity: initialData.quantity || '',
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
    const quantity = Number(form.quantity)
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

    if (form.quantity === '' || form.quantity === null) {
      newErrors.quantity = 'Vui lòng nhập số lượng'
    } else if (!Number.isInteger(quantity) || quantity < 0) {
      newErrors.quantity = 'Số lượng phải là số nguyên không âm'
    }

    if (form.minimum_stock !== '' && (!Number.isInteger(minimumStock) || minimumStock < 0)) {
      newErrors.minimum_stock = 'Tồn tối thiểu phải là số nguyên không âm'
    }

    if (!newErrors.quantity && !newErrors.minimum_stock && minimumStock > quantity) {
      newErrors.minimum_stock = 'Tồn tối thiểu không được lớn hơn số lượng hiện có'
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
      quantity: Number(form.quantity),
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
        <aside className="form-image-panel">
          <div className="image-preview">
            {imagePreview ? (
              <img src={imagePreview} alt="Xem trước sản phẩm" />
            ) : (
              <span>Chưa chọn ảnh</span>
            )}
          </div>
          <label className="form-label">
            Ảnh sản phẩm {!isEdit && <span className="required">*</span>}
          </label>
          <label className={`image-file-picker ${errors.image ? 'input-error' : ''}`}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageChange}
            />
            <span>Chọn ảnh từ máy</span>
          </label>
          <small className="image-help">JPG, PNG, WEBP hoặc GIF. Tối đa 5MB.</small>
          {imageFile && <small className="image-filename">{imageFile.name}</small>}
          {errors.image && <p className="error-msg">{errors.image}</p>}
        </aside>

        <div className="form-fields">
          <div className="form-section">
            <h3>Thông tin nhận diện</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input
                  type="text"
                  className="form-input readonly-input"
                  value={isEdit ? (form.sku || 'Chưa có mã') : 'Tự sinh sau khi lưu'}
                  disabled
                  readOnly
                />
                <small className="field-help">SKU là mã nội bộ do hệ thống tự sinh, không nhập thủ công.</small>
              </div>

              <div className="form-group">
                <label className="form-label">Barcode</label>
                <input
                  name="barcode"
                  type="text"
                  className={`form-input ${errors.barcode ? 'input-error' : ''}`}
                  placeholder="Ví dụ: 893850597419"
                  value={form.barcode}
                  onChange={handleChange}
                  maxLength={100}
                />
                <small className="field-help">Barcode là mã vạch sản phẩm. Có thể để trống; nếu nhập thì không được trùng sản phẩm khác.</small>
                {errors.barcode && <p className="error-msg">{errors.barcode}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Tên sản phẩm <span className="required">*</span>
              </label>
              <input
                name="name"
                type="text"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="Nhập tên sản phẩm"
                value={form.name}
                onChange={handleChange}
                maxLength={255}
              />
              {errors.name && <p className="error-msg">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea
                name="description"
                className={`form-input form-textarea ${errors.description ? 'input-error' : ''}`}
                placeholder="Nhập mô tả sản phẩm"
                value={form.description}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
              />
              {errors.description && <p className="error-msg">{errors.description}</p>}
            </div>
          </div>

          <div className="form-section">
            <h3>Giá và tồn kho</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Giá nhập (VNĐ)</label>
                <input
                  name="cost_price"
                  type="text"
                  inputMode="numeric"
                  className={`form-input ${errors.cost_price ? 'input-error' : ''}`}
                  placeholder="0"
                  value={form.cost_price}
                  onChange={handleMoneyChange}
                />
                {errors.cost_price && <p className="error-msg">{errors.cost_price}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Giá bán (VNĐ) <span className="required">*</span>
                </label>
                <input
                  name="selling_price"
                  type="text"
                  inputMode="numeric"
                  className={`form-input ${errors.selling_price ? 'input-error' : ''}`}
                  placeholder="0"
                  value={form.selling_price}
                  onChange={handleMoneyChange}
                />
                {errors.selling_price && <p className="error-msg">{errors.selling_price}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Số lượng <span className="required">*</span>
                </label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  className={`form-input ${errors.quantity ? 'input-error' : ''}`}
                  placeholder="0"
                  value={form.quantity}
                  onChange={handleChange}
                />
                {errors.quantity && <p className="error-msg">{errors.quantity}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Tồn tối thiểu</label>
                <input
                  name="minimum_stock"
                  type="number"
                  min="0"
                  step="1"
                  className={`form-input ${errors.minimum_stock ? 'input-error' : ''}`}
                  placeholder="0"
                  value={form.minimum_stock}
                  onChange={handleChange}
                />
                {errors.minimum_stock && <p className="error-msg">{errors.minimum_stock}</p>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Phân loại</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Danh mục <span className="required">*</span>
                </label>
                <select
                  name="category"
                  className={`form-input form-select ${errors.category ? 'input-error' : ''}`}
                  value={form.category}
                  onChange={handleChange}
                  disabled={catLoading}
                >
                  <option value="">{catLoading ? 'Đang tải...' : '-- Chọn danh mục --'}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="error-msg">{errors.category}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Nhà cung cấp</label>
                <select
                  name="supplier"
                  className={`form-input form-select ${errors.supplier ? 'input-error' : ''}`}
                  value={form.supplier}
                  onChange={handleChange}
                  disabled={supplierLoading}
                >
                  <option value="">{supplierLoading ? 'Đang tải...' : '-- Chưa gán --'}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplier && <p className="error-msg">{errors.supplier}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Đơn vị tính <span className="required">*</span>
                </label>
                <select
                  name="unit"
                  className={`form-input form-select ${errors.unit ? 'input-error' : ''}`}
                  value={form.unit}
                  onChange={handleChange}
                >
                  {unitOptions.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
                {errors.unit && <p className="error-msg">{errors.unit}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái kinh doanh</label>
                <select
                  name="status"
                  className="form-input form-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Đang kinh doanh</option>
                  <option value="inactive">Tạm ngưng</option>
                  <option value="discontinued">Ngừng kinh doanh</option>
                </select>
              </div>
            </div>
          </div>
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
