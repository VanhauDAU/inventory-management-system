import { useState, useEffect } from 'react'
import { getCategories } from '../services/productService'
import '../styles/ProductForm.css'

// initialData: truyền vào khi sửa, để trống khi thêm mới
function ProductForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    cost_price: '',
    price: '',
    quantity: '',
    minimum_stock: '',
    status: 'active',
    category: '',
  })
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [catLoading, setCatLoading] = useState(true)

  // Nếu sửa thì điền sẵn dữ liệu
  useEffect(() => {
    if (initialData) {
      setForm({
        sku: initialData.sku || '',
        name: initialData.name || '',
        description: initialData.description || '',
        cost_price: initialData.cost_price || '',
        price: initialData.price || '',
        quantity: initialData.quantity || '',
        minimum_stock: initialData.minimum_stock || '',
        status: initialData.status || 'active',
        category: initialData.category || '',
      })
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

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Tên sản phẩm không được để trống'
    else if (form.name.trim().length < 2) newErrors.name = 'Tên sản phẩm ít nhất 2 ký tự'

    if (form.price === '' || form.price === null) {
      newErrors.price = 'Vui lòng nhập giá bán'
    } else if (isNaN(Number(form.price)) || Number(form.price) < 0) {
      newErrors.price = 'Giá bán phải là số không âm'
    }

    if (form.cost_price !== '' && (isNaN(Number(form.cost_price)) || Number(form.cost_price) < 0)) {
      newErrors.cost_price = 'Giá nhập phải là số không âm'
    }

    if (form.quantity === '' || form.quantity === null) {
      newErrors.quantity = 'Vui lòng nhập số lượng'
    } else if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) {
      newErrors.quantity = 'Số lượng phải là số nguyên không âm'
    }

    if (form.minimum_stock !== '' && (!Number.isInteger(Number(form.minimum_stock)) || Number(form.minimum_stock) < 0)) {
      newErrors.minimum_stock = 'Tồn tối thiểu phải là số nguyên không âm'
    }

    if (!form.category) newErrors.category = 'Vui lòng chọn danh mục'

    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    onSubmit({
      ...(form.sku.trim() ? { sku: form.sku.trim() } : {}),
      name: form.name.trim(),
      description: form.description.trim(),
      cost_price: form.cost_price === '' ? 0 : Number(form.cost_price),
      price: Number(form.price),
      quantity: Number(form.quantity),
      minimum_stock: form.minimum_stock === '' ? 0 : Number(form.minimum_stock),
      status: form.status,
      category: Number(form.category),
    })
  }

  const isEdit = !!initialData

  return (
    <form onSubmit={handleSubmit} noValidate className="product-form">
      <div className="form-group">
        <label className="form-label">SKU</label>
        <input
          name="sku"
          type="text"
          className="form-input"
          placeholder="Để trống để hệ thống tự sinh mã"
          value={form.sku}
          onChange={handleChange}
        />
      </div>

      {/* Tên sản phẩm */}
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
        />
        {errors.name && <p className="error-msg">{errors.name}</p>}
      </div>

      {/* Mô tả */}
      <div className="form-group">
        <label className="form-label">Mô tả</label>
        <textarea
          name="description"
          className="form-input form-textarea"
          placeholder="Nhập mô tả sản phẩm (tùy chọn)"
          value={form.description}
          onChange={handleChange}
          rows={3}
        />
      </div>

      {/* Giá và Số lượng cùng hàng */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Giá nhập (VNĐ)</label>
          <input
            name="cost_price"
            type="number"
            min="0"
            step="1000"
            className={`form-input ${errors.cost_price ? 'input-error' : ''}`}
            placeholder="0"
            value={form.cost_price}
            onChange={handleChange}
          />
          {errors.cost_price && <p className="error-msg">{errors.cost_price}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Giá bán (VNĐ) <span className="required">*</span>
          </label>
          <input
            name="price"
            type="number"
            min="0"
            step="1000"
            className={`form-input ${errors.price ? 'input-error' : ''}`}
            placeholder="0"
            value={form.price}
            onChange={handleChange}
          />
          {errors.price && <p className="error-msg">{errors.price}</p>}
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

      {/* Danh mục */}
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
