import { useEffect, useState } from 'react'
import api from '../services/api'
import { fetchAllPages } from '../utils/apiPagination'

export default function useDashboardData({ canViewProducts, canViewWarehouses, canViewTransactions, canViewSummary }) {
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const [summaryResponse, productList, warehouseList, transactionList] = await Promise.all([
          canViewSummary
            ? api.get('/reports/inventory/summary/', { signal: controller.signal })
            : Promise.resolve({ data: null }),
          canViewProducts
            ? fetchAllPages('/products/?ordering=name', controller.signal)
            : Promise.resolve([]),
          canViewWarehouses
            ? fetchAllPages('/warehouses/?ordering=name', controller.signal)
            : Promise.resolve([]),
          canViewTransactions
            ? fetchAllPages('/stock-transactions/?ordering=-created_at', controller.signal)
            : Promise.resolve([]),
        ])

        setSummary(summaryResponse.data)
        setProducts(productList)
        setWarehouses(warehouseList)
        setTransactions(transactionList)
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          setError('Không thể tải dữ liệu dashboard. Vui lòng kiểm tra kết nối API hoặc đăng nhập lại.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadDashboard()
    return () => controller.abort()
  }, [canViewProducts, canViewSummary, canViewTransactions, canViewWarehouses])

  return { error, loading, products, summary, transactions, warehouses }
}
