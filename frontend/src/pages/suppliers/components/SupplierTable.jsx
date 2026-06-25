import PaginationControls from '../../../components/common/PaginationControls'

export default function SupplierTable({
  canChange,
  canDelete,
  formatDateTime,
  loading,
  onDelete,
  onEdit,
  onPageChange,
  onViewProducts,
  page,
  pageSize,
  suppliers,
  totalCount,
}) {
  if (loading) return <div className="supplier-state">Đang tải nhà phân phối...</div>
  if (totalCount === 0) return <div className="supplier-state">Không có nhà phân phối phù hợp.</div>

  return (
    <div className="supplier-table-wrap">
      <table className="supplier-table">
        <thead>
          <tr>
            <th>Nhà phân phối</th>
            <th>Liên hệ</th>
            <th>Email</th>
            <th>Mã số thuế</th>
            <th>Sản phẩm</th>
            <th>Trạng thái</th>
            <th>Cập nhật</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td>
                <div className="supplier-name-cell">
                  <strong>{supplier.name}</strong>
                  <small>{supplier.address || supplier.note || 'Chưa có địa chỉ/ghi chú'}</small>
                </div>
              </td>
              <td>
                <strong>{supplier.contact_name || 'Chưa gán'}</strong>
                <small>{supplier.phone || 'Chưa có SĐT'}</small>
              </td>
              <td>{supplier.email || 'Chưa có'}</td>
              <td>{supplier.tax_code || 'Chưa có'}</td>
              <td><span className="supplier-count">{supplier.products_count || 0}</span></td>
              <td>
                <span className={`supplier-status ${supplier.is_active ? 'active' : 'inactive'}`}>
                  {supplier.is_active ? 'Đang hợp tác' : 'Tạm ngưng'}
                </span>
              </td>
              <td>{formatDateTime(supplier.updated_at)}</td>
              <td>
                <div className="supplier-row-actions">
                  <button type="button" className="supplier-action detail" onClick={() => onViewProducts(supplier)}>Sản phẩm</button>
                  {canChange && <button type="button" className="supplier-action edit" onClick={() => onEdit(supplier)}>Sửa</button>}
                  {canDelete && <button type="button" className="supplier-action delete" onClick={() => onDelete(supplier)}>Xóa</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationControls
        itemLabel="nhà phân phối"
        loading={loading}
        onPageChange={onPageChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  )
}
