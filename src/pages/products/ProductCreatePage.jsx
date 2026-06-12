import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProduct } from '../../services/productService'
import ProductForm from '../../components/ProductForm'
import './ProductCreatePage.css'

export default function ProductCreatePage() {
  const navigate = useNavigate()
  const onNavigate = (key) => {
    if (key === 'product-list') navigate('/products')
    else navigate('/' + key.replace(/-/g, '/'))
  }
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData) {
    setLoading(true)
    setError('')
    try {
      await createProduct(formData)
      setSuccess(true)
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const messages = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        setError(messages.join(' | '))
      } else {
        setError('Tạo sản phẩm thất bại. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="pcp-success">
        <div className="pcp-success-icon">✅</div>
        <h2>Tạo sản phẩm thành công!</h2>
        <p>Sản phẩm đã được thêm vào hệ thống.</p>
        <div className="pcp-success-actions">
          <button type="button" className="btn-primary" onClick={() => setSuccess(false)}>
            Thêm sản phẩm mới
          </button>
          <button type="button" className="btn-secondary" onClick={() => onNavigate('product-list')}>
            Xem danh sách sản phẩm
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pcp-page">
      <div className="pcp-header">
        <button type="button" className="pcp-back-btn" onClick={() => onNavigate('product-list')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Quay lại
        </button>
        <div>
          <h2>Thêm sản phẩm mới</h2>
          <p>Điền thông tin sản phẩm vào form bên dưới</p>
        </div>
      </div>

      {error && <div className="pcp-error">⚠ {error}</div>}

      <div className="pcp-form-card">
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => onNavigate('product-list')}
          loading={loading}
        />
      </div>
    </div>
  )
}
