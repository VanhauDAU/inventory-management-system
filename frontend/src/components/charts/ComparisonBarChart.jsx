import ChartCard from './ChartCard'
import { formatChartValue } from './chartUtils'

export default function ComparisonBarChart({
  eyebrow,
  title,
  subtitle,
  data,
  leftLabel,
  rightLabel,
  valueFormatter = formatChartValue,
  emptyLabel = 'Chưa có dữ liệu',
}) {
  const rows = (data || [])
    .map((item) => ({
      ...item,
      leftValue: Number(item.leftValue || 0),
      rightValue: Number(item.rightValue || 0),
    }))
    .filter((item) => item.leftValue > 0 || item.rightValue > 0)
  const max = Math.max(...rows.flatMap((item) => [item.leftValue, item.rightValue]), 0)

  return (
    <ChartCard eyebrow={eyebrow} title={title} subtitle={subtitle}>
      {rows.length === 0 ? (
        <div className="chart-empty">{emptyLabel}</div>
      ) : (
        <div className="compare-list">
          <div className="compare-labels">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
          {rows.map((item) => (
            <div className="compare-row" key={item.label}>
              <strong>{item.label}</strong>
              <div>
                <i><em style={{ width: `${max > 0 ? Math.max((item.leftValue / max) * 100, 4) : 0}%` }} /></i>
                <b>{valueFormatter(item.leftValue)}</b>
              </div>
              <div>
                <i><em style={{ width: `${max > 0 ? Math.max((item.rightValue / max) * 100, 4) : 0}%` }} /></i>
                <b>{valueFormatter(item.rightValue)}</b>
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  )
}
