import { useMemo, useState } from 'react'
import { ComparisonBarChart, DonutChart, HorizontalBarChart } from '../../components/charts'
import MetricCard from '../../components/common/MetricCard'
import useInventoryValueReport from '../../hooks/useInventoryValueReport'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { buildInventoryValueView } from '../../utils/reportTransforms'
import './InventoryValueReportPage.css'

const tabs = [
  { key: 'by_category', label: 'Danh mục' },
  { key: 'by_supplier', label: 'Nhà cung cấp' },
  { key: 'by_warehouse', label: 'Kho' },
]

function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    wallet: (
      <>
        <path d="M20 12V8H6a3 3 0 0 1 0-6h12v4" />
        <path d="M4 6v14h16v-4" />
        <path d="M18 12h4v4h-4a2 2 0 0 1 0-4Z" />
      </>
    ),
    package: (
      <>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    warehouse: (
      <>
        <path d="M3 21V8l9-5 9 5v13" />
        <path d="M7 21v-8h10v8" />
        <path d="M7 10h10" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 0-15.6-6.2L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 15.6 6.2L21 16" />
        <path d="M16 16h5v5" />
      </>
    ),
  }

  return <svg {...common}>{paths[name]}</svg>
}

export default function InventoryValueReportPage() {
  const [activeTab, setActiveTab] = useState('by_category')
  const { error, loading, loadReport, report } = useInventoryValueReport()

  const valueView = useMemo(() => buildInventoryValueView(report, activeTab), [activeTab, report])
  const activeTabLabel = tabs.find((tab) => tab.key === activeTab)?.label || 'Nhóm'
  const { chartRows, comparisonRows, grossMarginValue, maxCostValue, rows, valueMix } = valueView

  return (
    <div className="inventory-value-page">
      <section className="iv-header">
        <div>
          <span className="iv-eyebrow">Báo cáo tồn kho</span>
          <h2>Giá trị tồn kho</h2>
          <p>Theo dõi tổng giá trị hàng tồn theo giá vốn, giá bán và phân bổ theo danh mục, nhà cung cấp, kho.</p>
        </div>
        <button type="button" className="iv-refresh" onClick={() => loadReport()} disabled={loading}>
          <Icon name="refresh" />
          <span>Làm mới</span>
        </button>
      </section>

      {error && <div className="iv-notice error">{error}</div>}

      <section className="iv-card-grid">
        <MetricCard icon={<Icon name="package" />} label="Tổng sản phẩm" value={formatNumber(report?.products_count)} tone="blue" loading={loading} />
        <MetricCard icon={<Icon name="warehouse" />} label="Tổng tồn kho" value={formatNumber(report?.total_quantity)} tone="teal" loading={loading} />
        <MetricCard icon={<Icon name="wallet" />} label="Giá trị vốn" value={formatCurrency(report?.total_cost_value)} tone="green" loading={loading} />
        <MetricCard icon={<Icon name="wallet" />} label="Giá trị bán" value={formatCurrency(report?.total_selling_value)} tone="indigo" loading={loading} />
      </section>

      <section className="iv-chart-grid">
        <DonutChart
          eyebrow="Biên giá trị"
          title="Vốn và chênh lệch bán"
          subtitle="Tỷ lệ giữa giá trị vốn tồn kho và phần chênh lệch theo giá bán."
          data={valueMix}
          totalLabel="Giá bán"
          totalValue={report?.total_selling_value}
          valueFormatter={formatCurrency}
        />
        <HorizontalBarChart
          eyebrow={activeTabLabel}
          title="Tỷ trọng giá trị vốn"
          subtitle="Top nhóm có giá trị vốn tồn kho lớn nhất trong tab đang chọn."
          data={chartRows}
          valueFormatter={formatCurrency}
        />
        <ComparisonBarChart
          eyebrow={activeTabLabel}
          title="So sánh vốn và giá bán"
          subtitle="Đối chiếu hai lớp giá trị để nhìn nhanh biên chênh lệch theo nhóm."
          data={comparisonRows}
          leftLabel="Giá trị vốn"
          rightLabel="Giá trị bán"
          valueFormatter={formatCurrency}
        />
      </section>

      <section className="iv-panel">
        <div className="iv-panel-head">
          <div>
            <span className="iv-eyebrow">Phân bổ</span>
            <h3>Giá trị theo nhóm</h3>
          </div>
          <div className="iv-margin">
            <span>Chênh lệch bán - vốn</span>
            <strong>{formatCurrency(grossMarginValue)}</strong>
          </div>
        </div>

        <div className="iv-tabs" role="tablist" aria-label="Nhóm báo cáo giá trị tồn kho">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="iv-state">Đang tải báo cáo...</div>
        ) : rows.length === 0 ? (
          <div className="iv-state">Chưa có dữ liệu giá trị tồn kho.</div>
        ) : (
          <div className="iv-table-wrap">
            <table className="iv-table">
              <thead>
                <tr>
                  <th>Nhóm</th>
                  <th>Số loại SP</th>
                  <th>Tổng tồn</th>
                  <th>Giá trị vốn</th>
                  <th>Giá trị bán</th>
                  <th>Tỷ trọng</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const costValue = Number(row.total_cost_value || 0)
                  const share = maxCostValue > 0 ? Math.round((costValue / maxCostValue) * 100) : 0
                  const productCount = row.products_count ?? row.product_kinds_count ?? 0

                  return (
                    <tr key={`${activeTab}-${row.id ?? row.name}`}>
                      <td>
                        <strong>{row.name}</strong>
                      </td>
                      <td>{formatNumber(productCount)}</td>
                      <td>{formatNumber(row.total_quantity)}</td>
                      <td>{formatCurrency(row.total_cost_value)}</td>
                      <td>{formatCurrency(row.total_selling_value)}</td>
                      <td>
                        <span className="iv-meter">
                          <i><em style={{ width: `${share}%` }} /></i>
                          <b>{share}%</b>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
