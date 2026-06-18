const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const getAccessToken = () => localStorage.getItem('access_token') || localStorage.getItem('accessToken')

const clearStoredTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('refreshToken')
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

export async function authFetch(path, { method = 'GET', body, signal, parseJson = false, errorResolver } = {}) {
  const token = getAccessToken()
  if (!token) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.')
  const isFormData = body instanceof FormData

  const request = (accessToken) => fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    signal,
  })

  let response = await request(token)
  if (response.status === 401) {
    const newToken = await refreshAccessToken(signal)
    if (!newToken) {
      clearStoredTokens()
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
    response = await request(newToken)
  }

  if (!parseJson) return response

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = errorResolver?.(data, response.status) || data?.detail || `Lỗi API: ${response.status}`
    throw new Error(message)
  }

  return data
}

export const authJson = (path, options = {}) => authFetch(path, { ...options, parseJson: true })

export async function fetchPaginated(path, options = {}) {
  const allItems = []
  let currentPage = 1
  let hasNextPage = true
  const separator = path.includes('?') ? '&' : '?'

  while (hasNextPage) {
    const data = await authJson(`${path}${separator}page=${currentPage}`, options)
    const list = Array.isArray(data.results) ? data.results : data
    allItems.push(...(Array.isArray(list) ? list : []))
    hasNextPage = Boolean(data.next)
    currentPage += 1
  }

  return allItems
}
