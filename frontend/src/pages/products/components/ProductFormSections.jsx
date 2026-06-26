export function ProductImageField({
  error,
  imageFiles,
  imagePreviews,
  isEdit,
  onImageChange,
}) {
  const primaryPreview = imagePreviews[0]
  const selectedFileNames = imageFiles.map((file) => file.name)

  return (
    <aside className="form-image-panel">
      <div className="image-preview">
        {primaryPreview ? (
          <img src={primaryPreview} alt="Xem trước sản phẩm" />
        ) : (
          <span>Chưa chọn ảnh</span>
        )}
      </div>
      {imagePreviews.length > 1 && (
        <div className="image-preview-grid" aria-label="Danh sách ảnh đã chọn">
          {imagePreviews.map((preview, index) => (
            <div className="image-preview-thumb" key={`${preview}-${index}`}>
              <img src={preview} alt={`Ảnh sản phẩm ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
      <label className="form-label">
        Ảnh sản phẩm {!isEdit && <span className="required">*</span>}
      </label>
      <label className={`image-file-picker ${error ? 'input-error' : ''}`}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={onImageChange}
        />
        <span>Chọn ảnh từ máy</span>
      </label>
      <small className="image-help">JPG, PNG, WEBP hoặc GIF. Tối đa 8 ảnh, mỗi ảnh 5MB.</small>
      {selectedFileNames.length > 0 && (
        <div className="image-filename-list">
          <small>{selectedFileNames.length} ảnh đã chọn</small>
          {selectedFileNames.map((fileName) => (
            <small className="image-filename" key={fileName}>{fileName}</small>
          ))}
        </div>
      )}
      {error && <p className="error-msg">{error}</p>}
    </aside>
  )
}

export function ProductIdentitySection({
  errors,
  form,
  isEdit,
  onChange,
}) {
  return (
    <div className="form-section">
      <h3>Thông tin nhận diện</h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">SKU</label>
          <input
            type="text"
            className="form-input readonly-input"
            value={isEdit ? (form.sku || 'Chưa có mã') : 'Tự sinh sau khi lưu'}
            disabled
            readOnly
          />
          <small className="field-help">SKU là mã nội bộ do hệ thống tự sinh, không nhập thủ công.</small>
        </div>

        <div className="form-group">
          <label className="form-label">Barcode</label>
          <input
            name="barcode"
            type="text"
            className={`form-input ${errors.barcode ? 'input-error' : ''}`}
            placeholder="Ví dụ: 893850597419"
            value={form.barcode}
            onChange={onChange}
            maxLength={100}
          />
          <small className="field-help">Barcode là mã vạch sản phẩm. Có thể để trống; nếu nhập thì không được trùng sản phẩm khác.</small>
          {errors.barcode && <p className="error-msg">{errors.barcode}</p>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Tên sản phẩm <span className="required">*</span>
        </label>
        <input
          name="name"
          type="text"
          className={`form-input ${errors.name ? 'input-error' : ''}`}
          placeholder="Nhập tên sản phẩm"
          value={form.name}
          onChange={onChange}
          maxLength={255}
        />
        {errors.name && <p className="error-msg">{errors.name}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Mô tả</label>
        <textarea
          name="description"
          className={`form-input form-textarea ${errors.description ? 'input-error' : ''}`}
          placeholder="Nhập mô tả sản phẩm"
          value={form.description}
          onChange={onChange}
          rows={4}
          maxLength={2000}
        />
        {errors.description && <p className="error-msg">{errors.description}</p>}
      </div>
    </div>
  )
}

export function ProductPricingSection({
  errors,
  form,
  onChange,
  onMoneyChange,
}) {
  return (
    <div className="form-section">
      <h3>Giá và ngưỡng tồn</h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Giá nhập (VNĐ)</label>
          <input
            name="cost_price"
            type="text"
            inputMode="numeric"
            className={`form-input ${errors.cost_price ? 'input-error' : ''}`}
            placeholder="0"
            value={form.cost_price}
            onChange={onMoneyChange}
          />
          {errors.cost_price && <p className="error-msg">{errors.cost_price}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Giá bán (VNĐ) <span className="required">*</span>
          </label>
          <input
            name="selling_price"
            type="text"
            inputMode="numeric"
            className={`form-input ${errors.selling_price ? 'input-error' : ''}`}
            placeholder="0"
            value={form.selling_price}
            onChange={onMoneyChange}
          />
          {errors.selling_price && <p className="error-msg">{errors.selling_price}</p>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tồn tối thiểu</label>
          <input
            name="minimum_stock"
            type="number"
            min="0"
            step="1"
            className={`form-input ${errors.minimum_stock ? 'input-error' : ''}`}
            placeholder="0"
            value={form.minimum_stock}
            onChange={onChange}
          />
          <small className="field-help">Tổng tồn được tính tự động từ nhập, xuất và điều chỉnh kho.</small>
          {errors.minimum_stock && <p className="error-msg">{errors.minimum_stock}</p>}
        </div>
      </div>
    </div>
  )
}

export function ProductClassificationSection({
  catLoading,
  categories,
  errors,
  form,
  onChange,
  supplierLoading,
  suppliers,
  unitOptions,
}) {
  return (
    <div className="form-section">
      <h3>Phân loại</h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Danh mục <span className="required">*</span>
          </label>
          <select
            name="category"
            className={`form-input form-select ${errors.category ? 'input-error' : ''}`}
            value={form.category}
            onChange={onChange}
            disabled={catLoading}
          >
            <option value="">{catLoading ? 'Đang tải...' : '-- Chọn danh mục --'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="error-msg">{errors.category}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Nhà cung cấp</label>
          <select
            name="supplier"
            className={`form-input form-select ${errors.supplier ? 'input-error' : ''}`}
            value={form.supplier}
            onChange={onChange}
            disabled={supplierLoading}
          >
            <option value="">{supplierLoading ? 'Đang tải...' : '-- Chưa gán --'}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          {errors.supplier && <p className="error-msg">{errors.supplier}</p>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Đơn vị tính <span className="required">*</span>
          </label>
          <select
            name="unit"
            className={`form-input form-select ${errors.unit ? 'input-error' : ''}`}
            value={form.unit}
            onChange={onChange}
          >
            {unitOptions.map((unit) => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </select>
          {errors.unit && <p className="error-msg">{errors.unit}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Trạng thái kinh doanh</label>
          <select
            name="status"
            className="form-input form-select"
            value={form.status}
            onChange={onChange}
          >
            <option value="active">Đang kinh doanh</option>
            <option value="inactive">Tạm ngưng</option>
            <option value="discontinued">Ngừng kinh doanh</option>
          </select>
        </div>
      </div>
    </div>
  )
}
