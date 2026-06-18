import './StatCharts.css'

export default function ChartCard({ eyebrow, title, subtitle, children }) {
  return (
    <section className="chart-card">
      <div className="chart-head">
        <div>
          {eyebrow && <span>{eyebrow}</span>}
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
