export const chartPalette = ['#2563eb', '#0f766e', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#16a34a']

export const clampPercent = (value) => Math.max(0, Math.min(100, Number(value || 0)))

export const formatChartValue = (value) =>
  new Intl.NumberFormat('vi-VN').format(Number(value || 0))

export const normalizeChartRows = (data) =>
  (data || [])
    .map((item, index) => ({
      ...item,
      color: item.color || chartPalette[index % chartPalette.length],
      value: Number(item.value || 0),
    }))
    .filter((item) => item.value > 0)
