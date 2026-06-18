import { useEffect, useState } from 'react'
import api from '../services/api'
import { fetchAllPages } from '../utils/apiPagination'

export default function useInventoryOverviewData() {
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [aiAdvice, setAiAdvice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(true)
  const [error, setError] = useState('')
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadReport() {
      setLoading(true)
      setAiLoading(true)
      setError('')
      setAiError('')

      try {
        const [summaryResponse, productList, warehouseList, transactionList, adviceResponse] = await Promise.all([
          api.get('/reports/inventory/summary/', { signal: controller.signal }),
          fetchAllPages('/products/?ordering=name', controller.signal),
          fetchAllPages('/warehouses/?ordering=name', controller.signal),
          fetchAllPages('/stock-transactions/?ordering=-created_at', controller.signal),
          api.get('/ai/inventory-advice/', { signal: controller.signal }).catch((err) => ({ error: err })),
        ])

        setSummary(summaryResponse.data)
        setProducts(productList)
        setWarehouses(warehouseList)
        setTransactions(transactionList)
        if (adviceResponse.error) {
          const detail = adviceResponse.error.response?.data?.detail
          setAiError(detail || 'Không thể tải gợi ý AI nhập hàng.')
          setAiAdvice(null)
        } else {
          setAiAdvice(adviceResponse.data)
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          const detail = err.response?.data?.detail
          setError(detail || 'Không thể tải tổng quan tồn kho. Vui lòng kiểm tra quyền truy cập hoặc kết nối API.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setAiLoading(false)
        }
      }
    }

    loadReport()
    return () => controller.abort()
  }, [])

  return { aiAdvice, aiError, aiLoading, error, loading, products, summary, transactions, warehouses }
}
