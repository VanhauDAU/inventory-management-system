import './MetricCard.css'

export default function MetricCard({ icon, label, value, hint, tone = 'blue', loading = false }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <span className="metric-card-icon">{icon}</span>
      <div className="metric-card-body">
        <small>{label}</small>
        <strong>{loading ? '...' : value}</strong>
        {hint && <span>{hint}</span>}
      </div>
    </article>
  )
}
