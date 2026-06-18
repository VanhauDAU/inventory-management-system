import { useEffect, useMemo, useState } from 'react'
import { authFetch } from '../../../services/authApi'

const defaultFilters = {
  maxPrice: '',
  maxQuantity: '',
  minPrice: '',
  minQuantity: '',
  ordering: '-created_at',
  search: '',
  selectedCategory: 'all',
  selectedStatus: 'all',
  selectedSupplier: 'all',
  stockFilter: 'all',
}

const unwrapList = (data) => Array.isArray(data.results) ? data.results : data

function buildProductParams(filters, page) {
  const params = new URLSearchParams({ page: String(page), ordering: filters.ordering })
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.selectedCategory !== 'all') params.set('category', filters.selectedCategory)
  if (filters.selectedSupplier !== 'all') params.set('supplier', filters.selectedSupplier)
  if (filters.selectedStatus !== 'all') params.set('status', filters.selectedStatus)
  if (filters.minPrice !== '') params.set('min_price', filters.minPrice)
  if (filters.maxPrice !== '') params.set('max_price', filters.maxPrice)
  if (filters.minQuantity !== '') params.set('min_quantity', filters.minQuantity)
  if (filters.maxQuantity !== '') params.set('max_quantity', filters.maxQuantity)
  if (filters.stockFilter === 'low-stock') params.set('low_stock', 'true')
  if (filters.stockFilter === 'out-of-stock') params.set('max_quantity', '0')
  if (filters.stockFilter === 'in-stock' && filters.minQuantity === '') params.set('min_quantity', '1')
  return params
}

export default function useProductListData() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProducts() {
      setLoading(true)
      setError('')
      const params = buildProductParams(filters, page)

      try {
        const [productRes, categoryRes, supplierRes] = await Promise.all([
          authFetch(`/products/?${params}`, { signal: controller.signal }),
          authFetch('/categories/', { signal: controller.signal }),
          authFetch('/suppliers/', { signal: controller.signal }),
        ])

        if (!productRes.ok) throw new Error(`Không thể tải sản phẩm. Mã lỗi: ${productRes.status}`)

        const productData = await productRes.json()
        const categoryData = categoryRes.ok ? await categoryRes.json() : []
        const supplierData = supplierRes.ok ? await supplierRes.json() : []
        const apiProducts = unwrapList(productData)
        const apiCategories = unwrapList(categoryData)
        const apiSuppliers = unwrapList(supplierData)

        setProducts(apiProducts)
        setCategories(apiCategories)
        setSuppliers(apiSuppliers)
        setTotalCount(productData.count ?? apiProducts.length)
        setNextPage(productData.next || null)
        setPreviousPage(productData.previous || null)
      } catch (err) {
        if (err.name === 'AbortError') return
        setProducts([])
        setCategories([])
        setSuppliers([])
        setTotalCount(0)
        setNextPage(null)
        setPreviousPage(null)
        setError(err.message || 'Không thể tải danh sách sản phẩm từ API.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    return () => controller.abort()
  }, [filters, page, refreshKey])

  const filteredProducts = useMemo(() => [...products], [products])
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  function resetFilters() {
    setFilters(defaultFilters)
    setPage(1)
  }

  function refreshProducts() {
    setRefreshKey((value) => value + 1)
  }

  function showNewestFirst() {
    setFilters((current) => ({ ...current, ordering: '-created_at' }))
    setPage(1)
  }

  return {
    categories,
    error,
    filteredProducts,
    filters,
    loading,
    nextPage,
    page,
    previousPage,
    refreshProducts,
    resetFilters,
    setFilter,
    setPage,
    showNewestFirst,
    suppliers,
    totalCount,
    totalPages,
  }
}
