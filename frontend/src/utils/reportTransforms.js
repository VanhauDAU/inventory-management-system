import { formatCurrency, formatNumber } from './formatters'

const getProductStockValue = (product) => Number(product.quantity || 0) * Number(product.cost_price || 0)

export function buildInventorySnapshot({
  summary,
  stats,
  products = [],
  warehouses = [],
  transactions = [],
  categoryLimit = 6,
  warehouseLimit = 6,
  transactionLimit = 8,
  lowStockSort = 'ratio',
}) {
  const totalProducts = Number(summary?.total_products ?? stats?.totalProducts ?? products.length)
  const totalQuantity = Number(
    summary?.total_quantity ?? stats?.totalQuantity ?? products.reduce((sum, product) => sum + Number(product.quantity || 0), 0)
  )
  const totalValue = Number(
    summary?.total_stock_value ?? stats?.totalValue ?? products.reduce((sum, product) => sum + getProductStockValue(product), 0)
  )
  const lowStockProducts = products
    .filter((product) => Number(product.quantity || 0) <= Number(product.minimum_stock || 0))
    .sort((a, b) => {
      if (lowStockSort === 'quantity') return Number(a.quantity || 0) - Number(b.quantity || 0)
      const ratioA = Number(a.minimum_stock || 0) > 0 ? Number(a.quantity || 0) / Number(a.minimum_stock || 1) : 0
      const ratioB = Number(b.minimum_stock || 0) > 0 ? Number(b.quantity || 0) / Number(b.minimum_stock || 1) : 0
      return ratioA - ratioB
    })

  const categoryMap = products.reduce((map, product) => {
    const name = product.category_detail?.name || 'Chưa phân loại'
    const current = map.get(name) || { name, count: 0, quantity: 0, value: 0 }
    current.count += 1
    current.quantity += Number(product.quantity || 0)
    current.value += getProductStockValue(product)
    map.set(name, current)
    return map
  }, new Map())

  const topCategories = Array.from(categoryMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, categoryLimit)
  const topWarehouses = [...warehouses]
    .sort((a, b) => Number(b.total_quantity || 0) - Number(a.total_quantity || 0))
    .slice(0, warehouseLimit)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, transactionLimit)

  const importCount = Number(summary?.import_transactions || 0)
  const exportCount = Number(summary?.export_transactions || 0)
  const adjustmentCount = Number(summary?.adjustment_transactions || 0)
  const transactionTotal = importCount + exportCount + adjustmentCount || transactions.length

  return {
    totalProducts,
    totalQuantity,
    totalValue,
    lowStockProducts,
    lowStockCount: Number(summary?.low_stock_products ?? lowStockProducts.length),
    warehousesCount: Number(summary?.warehouses_count ?? warehouses.length),
    importCount,
    exportCount,
    adjustmentCount,
    transactionTotal,
    exportRatio: totalQuantity + exportCount > 0 ? Math.min(100, Math.round((exportCount / Math.max(transactionTotal, 1)) * 100)) : 0,
    topCategories,
    topWarehouses,
    recentTransactions,
    averageValue: totalProducts > 0 ? totalValue / totalProducts : 0,
    stockHealth: totalProducts > 0 ? Math.round(((totalProducts - lowStockProducts.length) / totalProducts) * 100) : 100,
    stockStatusMix: [
      { label: 'Ổn định', value: Math.max(totalProducts - lowStockProducts.length, 0), color: '#0f766e' },
      { label: 'Dưới ngưỡng', value: lowStockProducts.length, color: '#dc2626' },
    ],
    transactionMix: [
      { label: 'Nhập kho', value: importCount, color: '#16a34a' },
      { label: 'Xuất kho', value: exportCount, color: '#dc2626' },
      { label: 'Điều chỉnh', value: adjustmentCount, color: '#f59e0b' },
    ],
  }
}

export function buildInventoryValueView(report, activeTab) {
  const rows = report?.[activeTab] || []
  const maxCostValue = Math.max(...rows.map((row) => Number(row.total_cost_value || 0)), 0)
  const grossMarginValue = Number(report?.total_selling_value || 0) - Number(report?.total_cost_value || 0)

  return {
    rows,
    maxCostValue,
    grossMarginValue,
    valueMix: [
      { label: 'Giá trị vốn', value: Number(report?.total_cost_value || 0), color: '#0f766e' },
      { label: 'Chênh lệch bán - vốn', value: Math.max(grossMarginValue, 0), color: '#2563eb' },
    ],
    chartRows: rows.slice(0, 6).map((row) => {
      const productCount = row.products_count ?? row.product_kinds_count ?? 0
      return {
        label: row.name,
        value: Number(row.total_cost_value || 0),
        note: `${formatNumber(productCount)} loại · ${formatNumber(row.total_quantity)} tồn`,
      }
    }),
    comparisonRows: rows.slice(0, 6).map((row) => ({
      label: row.name,
      leftValue: Number(row.total_cost_value || 0),
      rightValue: Number(row.total_selling_value || 0),
    })),
  }
}

export function buildLowStockSummary(items = []) {
  const totalMissing = items.reduce((sum, item) => sum + Number(item.missing_quantity || 0), 0)
  const totalCurrent = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const totalMinimum = items.reduce((sum, item) => sum + Number(item.minimum_stock || 0), 0)
  const estimatedCost = items.reduce(
    (sum, item) => sum + Number(item.missing_quantity || 0) * Number(item.cost_price || 0),
    0,
  )
  const categoryMap = items.reduce((map, item) => {
    const name = item.category_name || 'Chưa phân loại'
    const current = map.get(name) || { label: name, value: 0, cost: 0, count: 0 }
    current.value += Number(item.missing_quantity || 0)
    current.cost += Number(item.missing_quantity || 0) * Number(item.cost_price || 0)
    current.count += 1
    map.set(name, current)
    return map
  }, new Map())
  const categoryShortage = Array.from(categoryMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((item) => ({
      ...item,
      note: `${formatNumber(item.count)} sản phẩm · ${formatCurrency(item.cost)}`,
    }))
  const topMissing = [...items]
    .sort((a, b) => Number(b.missing_quantity || 0) - Number(a.missing_quantity || 0))
    .slice(0, 6)
    .map((item) => ({
      label: item.name,
      value: Number(item.missing_quantity || 0),
      note: `${item.sku} · tối thiểu ${formatNumber(item.minimum_stock)}`,
    }))

  return {
    totalMissing,
    totalCurrent,
    totalMinimum,
    estimatedCost,
    categoryShortage,
    topMissing,
    stockGapMix: [
      { label: 'Tồn hiện tại', value: totalCurrent, color: '#2563eb' },
      { label: 'Cần bổ sung', value: totalMissing, color: '#dc2626' },
    ],
  }
}
