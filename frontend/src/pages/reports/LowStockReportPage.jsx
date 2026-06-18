import { useMemo } from 'react'
import { DonutChart, HorizontalBarChart } from '../../components/charts'
import MetricCard from '../../components/common/MetricCard'
import useLowStockReport from '../../hooks/useLowStockReport'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { canAccessPage } from '../../utils/permissions'
import { buildLowStockSummary } from '../../utils/reportTransforms'
import './LowStockReportPage.css'

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
    alert: (
      <>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    package: (
      <>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
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

export default function LowStockReportPage({ onNavigate, currentUser }) {
  const { count, currentPath, error, items, loadReport, loading, next, previous } = useLowStockReport()

  const summary = useMemo(() => buildLowStockSummary(items), [items])

  const handleReload = () => {
    loadReport(currentPath)
  }

  const goToImportOrders = () => {
    onNavigate?.('import-orders')
  }

  return (
    <div className="low-stock-page">
      <section className="ls-header">
        <div>
          <span className="ls-eyebrow">Báo cáo tồn kho</span>
          <h2>Sản phẩm sắp hết hàng</h2>
          <p>Theo dõi các sản phẩm có tồn hiện tại thấp hơn hoặc bằng tồn tối thiểu để bổ sung kịp thời.</p>
        </div>
        <div className="ls-actions">
          <button type="button" className="ls-secondary" onClick={handleReload} disabled={loading}>
            <Icon name="refresh" />
            <span>Làm mới</span>
          </button>
          {canAccessPage(currentUser, 'import-orders') && (
            <button type="button" className="ls-primary" onClick={goToImportOrders}>
              <Icon name="plus" />
              <span>Lập phiếu nhập</span>
            </button>
          )}
        </div>
      </section>

      {error && <div className="ls-notice error">{error}</div>}

      <section className="ls-card-grid">
        <MetricCard icon={<Icon name="alert" />} label="Sản phẩm cảnh báo" value={formatNumber(count)} tone="red" loading={loading} />
        <MetricCard icon={<Icon name="package" />} label="Tồn hiện tại" value={formatNumber(summary.totalCurrent)} tone="blue" loading={loading} />
        <MetricCard icon={<Icon name="package" />} label="Tồn tối thiểu" value={formatNumber(summary.totalMinimum)} tone="amber" loading={loading} />
        <MetricCard icon={<Icon name="plus" />} label="Cần bổ sung" value={formatNumber(summary.totalMissing)} tone="green" loading={loading} />
      </section>

      <section className="ls-chart-grid">
        <DonutChart
          eyebrow="Thiếu hụt"
          title="Tồn hiện tại và lượng cần bổ sung"
          subtitle="So sánh số lượng đang có với phần còn thiếu để đạt ngưỡng tối thiểu."
          data={summary.stockGapMix}
          totalLabel="Tối thiểu"
          totalValue={summary.totalMinimum}
          valueFormatter={formatNumber}
        />
        <HorizontalBarChart
          eyebrow="Ưu tiên"
          title="Sản phẩm thiếu nhiều nhất"
          subtitle="Những mặt hàng cần bổ sung số lượng lớn nhất trong danh sách hiện tại."
          data={summary.topMissing}
          valueFormatter={formatNumber}
        />
        <HorizontalBarChart
          eyebrow="Danh mục"
          title="Nhu cầu nhập theo nhóm"
          subtitle="Tổng lượng cần bổ sung được gom theo danh mục sản phẩm."
          data={summary.categoryShortage}
          valueFormatter={formatNumber}
        />
        <HorizontalBarChart
          eyebrow="Ngân sách"
          title="Chi phí bổ sung ước tính"
          subtitle="Các nhóm danh mục có chi phí nhập dự kiến cao nhất."
          data={summary.categoryShortage.map((item) => ({
            label: item.label,
            value: item.cost,
            note: `${formatNumber(item.value)} cần bổ sung`,
          }))}
          valueFormatter={formatCurrency}
        />
      </section>

      <section className="ls-panel">
        <div className="ls-panel-head">
          <div>
            <span className="ls-eyebrow">Danh sách</span>
            <h3>Chi tiết sản phẩm</h3>
          </div>
          <strong>{formatCurrency(summary.estimatedCost)}</strong>
        </div>

        {loading ? (
          <div className="ls-state">Đang tải báo cáo...</div>
        ) : items.length === 0 ? (
          <div className="ls-empty">
            <span><Icon name="package" /></span>
            <strong>Không có sản phẩm sắp hết hàng</strong>
            <p>Tất cả sản phẩm hiện đang cao hơn ngưỡng tồn tối thiểu.</p>
          </div>
        ) : (
          <>
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Tên sản phẩm</th>
                    <th>Tồn hiện tại</th>
                    <th>Tồn tối thiểu</th>
                    <th>Cần bổ sung</th>
                    <th>Chi phí dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><code>{item.sku}</code></td>
                      <td>
                        <strong>{item.name}</strong>
                        <small>{item.category_name || 'Chưa phân loại'}</small>
                      </td>
                      <td>{formatNumber(item.quantity)}</td>
                      <td>{formatNumber(item.minimum_stock)}</td>
                      <td><b>{formatNumber(item.missing_quantity)}</b></td>
                      <td>{formatCurrency(Number(item.missing_quantity || 0) * Number(item.cost_price || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ls-pagination">
              <span>{formatNumber(items.length)} / {formatNumber(count)} sản phẩm</span>
              <div>
                <button type="button" disabled={!previous || loading} onClick={() => loadReport(previous)}>
                  Trước
                </button>
                <button type="button" disabled={!next || loading} onClick={() => loadReport(next)}>
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
