import ChartCard from './ChartCard'
import { formatChartValue, normalizeChartRows } from './chartUtils'

export default function DonutChart({
  eyebrow,
  title,
  subtitle,
  data,
  totalLabel = 'Tổng',
  totalValue,
  valueFormatter = formatChartValue,
  emptyLabel = 'Chưa có dữ liệu',
}) {
  const rows = normalizeChartRows(data)
  const total = rows.reduce((sum, item) => sum + item.value, 0)
  let offset = 25

  return (
    <ChartCard eyebrow={eyebrow} title={title} subtitle={subtitle}>
      {total <= 0 ? (
        <div className="chart-empty">{emptyLabel}</div>
      ) : (
        <div className="donut-layout">
          <div className="donut-wrap" aria-hidden="true">
            <svg viewBox="0 0 42 42" className="donut-svg">
              <circle className="donut-track" cx="21" cy="21" r="15.9155" />
              {rows.map((item) => {
                const percent = (item.value / total) * 100
                const circle = (
                  <circle
                    key={item.label}
                    className="donut-segment"
                    cx="21"
                    cy="21"
                    r="15.9155"
                    stroke={item.color}
                    strokeDasharray={`${percent} ${100 - percent}`}
                    strokeDashoffset={offset}
                  />
                )
                offset -= percent
                return circle
              })}
            </svg>
            <div className="donut-center">
              <strong>{valueFormatter(totalValue ?? total)}</strong>
              <span>{totalLabel}</span>
            </div>
          </div>
          <div className="chart-legend">
            {rows.map((item) => (
              <div key={item.label}>
                <i style={{ background: item.color }} />
                <span>{item.label}</span>
                <b>{valueFormatter(item.value)}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  )
}
