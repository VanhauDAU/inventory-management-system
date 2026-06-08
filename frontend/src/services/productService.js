import api from './api'

export const getProducts = (params = {}) => {
  return api.get('/products/', { params })
}

export const createProduct = (data) => {
  return api.post('/products/', data)
}

export const updateProduct = (id, data) => {
  return api.patch(`/products/${id}/`, data)
}

export const deleteProduct = (id) => {
  return api.delete(`/products/${id}/`)
}

export const getCategories = () => {
  return api.get('/categories/')
}
