import { useEffect, useState } from 'react'

export default function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = (type, message) => {
    setToast({ id: Date.now(), type, message })
  }

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, toast.type === 'error' ? 6000 : 3500)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  return { clearToast: () => setToast(null), showToast, toast }
}
