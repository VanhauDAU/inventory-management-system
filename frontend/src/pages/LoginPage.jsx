import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import '../styles/LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!form.username.trim()) newErrors.username = 'Vui lòng nhập tên đăng nhập'
    if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu'
    else if (form.password.length < 6) newErrors.password = 'Mật khẩu ít nhất 6 ký tự'
    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Xóa lỗi khi user bắt đầu nhập lại
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (apiError) setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const authData = await login(form.username, form.password)
      console.log('Login success:', {
        username: form.username,
        hasAccessToken: Boolean(authData.access),
        hasRefreshToken: Boolean(authData.refresh),
      })
      navigate('/products')
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Đăng nhập thất bại. Vui lòng thử lại.'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">📦</div>
          <h1 className="login-title">Quản lý sản phẩm</h1>
          <p className="login-subtitle">Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {apiError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {apiError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Tên đăng nhập
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              placeholder="Nhập tên đăng nhập"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
            {errors.username && <p className="error-msg">{errors.username}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <p className="error-msg">{errors.password}</p>}
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
