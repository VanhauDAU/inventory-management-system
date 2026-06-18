import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'

export default function useInventoryValueReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = useCallback(async (signal) => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/reports/inventory/value/', { signal })
      setReport(response.data)
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
      const detail = err.response?.data?.detail
      setError(detail || 'Không thể tải báo cáo giá trị tồn kho.')
      setReport(null)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadReport(controller.signal)
    return () => controller.abort()
  }, [loadReport])

  return { error, loading, loadReport, report }
}
