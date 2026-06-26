import PaginationControls from '../../../components/common/PaginationControls'

export default function WarehouseTable({
  canChange,
  canDelete,
  loading,
  onDelete,
  onEdit,
  onPageChange,
  onViewStock,
  page,
  pageSize,
  totalCount,
  warehouses,
}) {
  if (loading) return <div className="warehouse-state">Đang tải danh sách kho...</div>
  if (totalCount === 0) return <div className="warehouse-state">Không có kho phù hợp.</div>

  return (
    <div className="warehouse-table-wrap">
      <table className="warehouse-table">
        <thead>
          <tr>
            <th>Kho</th>
            <th>Quản lý</th>
            <th>SĐT</th>
            <th>Loại SP</th>
            <th>Số lượng tồn</th>
            <th>Phiếu kho</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {warehouses.map((warehouse) => (
            <tr key={warehouse.id}>
              <td>
                <div className="warehouse-name-cell">
                  <strong>{warehouse.name}</strong>
                  <small>{warehouse.address || 'Chưa có địa chỉ'}</small>
                </div>
              </td>
              <td>{warehouse.manager_name || 'Chưa gán'}</td>
              <td>{warehouse.phone || 'Chưa có'}</td>
              <td><span className="warehouse-count">{warehouse.product_kinds_count || 0}</span></td>
              <td><span className="warehouse-count">{warehouse.total_quantity || 0}</span></td>
              <td><span className="warehouse-count">{warehouse.stock_transactions_count || 0}</span></td>
              <td>
                <span className={`warehouse-status ${warehouse.is_active ? 'active' : 'inactive'}`}>
                  {warehouse.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                </span>
              </td>
              <td>
                <div className="warehouse-row-actions">
                  <button type="button" className="warehouse-action detail" onClick={() => onViewStock(warehouse)}>Tồn kho</button>
                  {canChange && <button type="button" className="warehouse-action edit" onClick={() => onEdit(warehouse)}>Sửa</button>}
                  {canDelete && <button type="button" className="warehouse-action delete" onClick={() => onDelete(warehouse)}>Xóa</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationControls
        itemLabel="kho"
        loading={loading}
        onPageChange={onPageChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  )
}
