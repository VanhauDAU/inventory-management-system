import { orderingOptions } from '../productListConfig'

export default function ProductFilters({
  categories,
  filters,
  onChange,
  onReset,
  suppliers,
}) {
  const update = (key, value) => onChange(key, value)

  return (
    <>
      <div className="plp-filter-bar">
        <label className="plp-filter-item plp-search">
          <span>Tìm kiếm</span>
          <div className="plp-input-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={filters.search}
              onChange={(event) => update('search', event.target.value)}
              placeholder="Tìm theo tên hoặc mô tả..."
            />
          </div>
        </label>

        <label className="plp-filter-item">
          <span>Danh mục</span>
          <select value={filters.selectedCategory} onChange={(event) => update('selectedCategory', event.target.value)}>
            <option value="all">Tất cả danh mục</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>

        <label className="plp-filter-item">
          <span>Tồn kho</span>
          <select value={filters.stockFilter} onChange={(event) => update('stockFilter', event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="in-stock">Còn hàng</option>
            <option value="low-stock">Sắp hết</option>
            <option value="out-of-stock">Hết hàng</option>
          </select>
        </label>

        <label className="plp-filter-item">
          <span>Sắp xếp</span>
          <select value={filters.ordering} onChange={(event) => update('ordering', event.target.value)}>
            {orderingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <button className="plp-reset-btn" type="button" onClick={onReset}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.27" />
          </svg>
          Đặt lại
        </button>
      </div>

      <div className="plp-filter-bar plp-advanced-filter-bar">
        <label className="plp-filter-item">
          <span>Nhà cung cấp</span>
          <select value={filters.selectedSupplier} onChange={(event) => update('selectedSupplier', event.target.value)}>
            <option value="all">Tất cả nhà cung cấp</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </label>

        <label className="plp-filter-item">
          <span>Kinh doanh</span>
          <select value={filters.selectedStatus} onChange={(event) => update('selectedStatus', event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang kinh doanh</option>
            <option value="inactive">Tạm ngưng</option>
            <option value="discontinued">Ngừng kinh doanh</option>
          </select>
        </label>

        <label className="plp-filter-item">
          <span>Giá từ</span>
          <input type="number" min="0" value={filters.minPrice} onChange={(event) => update('minPrice', event.target.value)} placeholder="0" />
        </label>

        <label className="plp-filter-item">
          <span>Giá đến</span>
          <input type="number" min="0" value={filters.maxPrice} onChange={(event) => update('maxPrice', event.target.value)} placeholder="Không giới hạn" />
        </label>

        <label className="plp-filter-item">
          <span>Tổng tồn từ</span>
          <input type="number" min="0" value={filters.minQuantity} onChange={(event) => update('minQuantity', event.target.value)} placeholder="0" />
        </label>

        <label className="plp-filter-item">
          <span>Tổng tồn đến</span>
          <input type="number" min="0" value={filters.maxQuantity} onChange={(event) => update('maxQuantity', event.target.value)} placeholder="Không giới hạn" />
        </label>
      </div>
    </>
  )
}
