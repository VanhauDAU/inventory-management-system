import { buildCategoryTree, flattenCategoryTree, getDescendantIds } from '../categoryUtils'

export default function CategoryForm({ form, errors, categories, editingCategory, onChange, onSubmit, onCancel, loading }) {
  const blockedParentIds = editingCategory
    ? new Set([editingCategory.id, ...getDescendantIds(categories, editingCategory.id)])
    : new Set()

  const treeOptions = flattenCategoryTree(buildCategoryTree(categories))

  return (
    <form className="category-form" onSubmit={onSubmit} noValidate>
      <div className="category-form-grid">
        <label className="category-field">
          <span>Tên danh mục <b>*</b></span>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className={errors.name ? 'input-error' : ''}
            placeholder="Ví dụ: Phụ kiện máy tính"
            maxLength={100}
          />
          {errors.name && <small className="category-error">{errors.name}</small>}
        </label>

        <label className="category-field">
          <span>Danh mục cha</span>
          <select
            name="parent"
            value={form.parent}
            onChange={onChange}
            className={errors.parent ? 'input-error' : ''}
          >
            <option value="">Không có danh mục cha</option>
            {treeOptions.map((category) => (
              <option key={category.id} value={category.id} disabled={blockedParentIds.has(category.id)}>
                {'— '.repeat(category.level)}{category.name}
              </option>
            ))}
          </select>
          {errors.parent && <small className="category-error">{errors.parent}</small>}
        </label>

        <label className="category-field category-field-wide">
          <span>Mô tả</span>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className={errors.description ? 'input-error' : ''}
            placeholder="Nhập mô tả ngắn cho nhóm sản phẩm"
            rows={4}
            maxLength={1000}
          />
          {errors.description && <small className="category-error">{errors.description}</small>}
        </label>

        <label className="category-toggle">
          <input
            name="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={onChange}
          />
          <span>Đang sử dụng danh mục này</span>
        </label>
      </div>

      <div className="category-form-actions">
        <button type="button" className="category-btn secondary" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button type="submit" className="category-btn primary" disabled={loading}>
          {loading ? 'Đang lưu...' : editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
        </button>
      </div>
    </form>
  )
}
