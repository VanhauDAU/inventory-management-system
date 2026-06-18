import api from '../services/api'

export const unwrapList = (data) => Array.isArray(data) ? data : data?.results || []

export const getEndpointFromUrl = (url) => {
  if (!url) return ''
  return url.replace(api.defaults.baseURL, '').replace(/^\/api/, '')
}

export async function fetchAllPages(path, signal) {
  const items = []
  let nextPath = path

  while (nextPath) {
    const response = await api.get(nextPath, { signal })
    const data = response.data
    items.push(...unwrapList(data))

    if (!data?.next) break
    nextPath = getEndpointFromUrl(data.next)
  }

  return items
}
