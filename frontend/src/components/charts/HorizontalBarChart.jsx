import ChartCard from './ChartCard'
import { clampPercent, formatChartValue, normalizeChartRows } from './chartUtils'

export default function HorizontalBarChart({
  eyebrow,
  title,
  subtitle,
  data,
  valueFormatter = formatChartValue,
  emptyLabel = 'Chưa có dữ liệu',
  maxValue,
}) {
  const rows = normalizeChartRows(data)
  const max = Number(maxValue || Math.max(...rows.map((item) => item.value), 0))

  return (
    <ChartCard eyebrow={eyebrow} title={title} subtitle={subtitle}>
      {rows.length === 0 ? (
        <div className="chart-empty">{emptyLabel}</div>
      ) : (
        <div className="bar-list">
          {rows.map((item) => {
            const width = max > 0 ? clampPercent((item.value / max) * 100) : 0
            return (
              <div className="bar-row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  {item.note && <span>{item.note}</span>}
                </div>
                <b>{valueFormatter(item.value)}</b>
                <i><em style={{ width: `${Math.max(width, 4)}%`, background: item.color }} /></i>
              </div>
            )
          })}
        </div>
      )}
    </ChartCard>
  )
}
