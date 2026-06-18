import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { getEndpointFromUrl } from '../utils/apiPagination'

export default function useLowStockReport(initialPath = '/reports/inventory/low-stock/') {
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [next, setNext] = useState('')
  const [previous, setPrevious] = useState('')
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = useCallback(async (path = initialPath, signal) => {
    setLoading(true)
    setError('')

    try {
      const requestPath = path || initialPath
      const response = await api.get(requestPath, { signal })
      const data = response.data
      const rows = Array.isArray(data) ? data : data.results || []

      setItems(rows)
      setCount(Array.isArray(data) ? rows.length : data.count || 0)
      setNext(getEndpointFromUrl(data.next))
      setPrevious(getEndpointFromUrl(data.previous))
      setCurrentPath(requestPath)
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
      const detail = err.response?.data?.detail
      setError(detail || 'Không thể tải báo cáo sản phẩm sắp hết hàng.')
      setItems([])
      setCount(0)
      setNext('')
      setPrevious('')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [initialPath])

  useEffect(() => {
    const controller = new AbortController()
    loadReport(initialPath, controller.signal)
    return () => controller.abort()
  }, [initialPath, loadReport])

  return { count, currentPath, error, items, loadReport, loading, next, previous }
}
