import PaginationControls from '../../../components/common/PaginationControls'

export default function CategoryTable({
  canChange,
  canDelete,
  canManage,
  categories,
  formatDateTime,
  loading,
  onDelete,
  onEdit,
  onPageChange,
  page,
  pageSize,
  totalCount,
}) {
  if (loading) return <div className="category-state">Đang tải danh mục...</div>
  if (totalCount === 0) return <div className="category-state">Không có danh mục phù hợp.</div>

  return (
    <div className="category-table-wrap">
      <table className="category-table">
        <thead>
          <tr>
            <th>Danh mục</th>
            <th>Danh mục cha</th>
            <th>Sản phẩm</th>
            <th>Danh mục con</th>
            <th>Trạng thái</th>
            <th>Cập nhật</th>
            {canManage && <th>Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>
                <div className="category-name-cell" style={{ paddingLeft: `${category.level * 1.25}rem` }}>
                  <span className="category-level-dot" />
                  <div>
                    <strong>{category.name}</strong>
                    <small>{category.description || 'Chưa có mô tả'}</small>
                  </div>
                </div>
              </td>
              <td>{category.parent_name || 'Danh mục gốc'}</td>
              <td><span className="category-count">{category.products_count || 0}</span></td>
              <td><span className="category-count">{category.children_count || 0}</span></td>
              <td>
                <span className={`category-status ${category.is_active ? 'active' : 'inactive'}`}>
                  {category.is_active ? 'Đang sử dụng' : 'Tạm ẩn'}
                </span>
              </td>
              <td>{formatDateTime(category.updated_at)}</td>
              {canManage && (
                <td>
                  <div className="category-row-actions">
                    {canChange && <button type="button" className="category-action edit" onClick={() => onEdit(category)}>Sửa</button>}
                    {canDelete && <button type="button" className="category-action delete" onClick={() => onDelete(category)}>Xóa</button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationControls
        itemLabel="danh mục"
        loading={loading}
        onPageChange={onPageChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  )
}
