# 03 - Database

Tài liệu này tóm tắt các model chính và quan hệ dữ liệu hiện tại.

## Model Category

File: `backend/categories/models.py`

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | BigAutoField | Khóa chính |
| `name` | CharField(100) | Tên danh mục |
| `description` | TextField | Mô tả, có thể rỗng |
| `parent` | ForeignKey(Category) | Danh mục cha, có thể rỗng |
| `is_active` | BooleanField | Trạng thái sử dụng |
| `created_at` | DateTimeField | Ngày tạo |
| `updated_at` | DateTimeField | Ngày cập nhật |

## Model Product

File: `backend/products/models.py`

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | BigAutoField | Khóa chính |
| `sku` | CharField(100) | Unique, có thể tự sinh khi tạo sản phẩm |
| `barcode` | CharField(100) | Unique nếu có, có thể rỗng/null |
| `name` | CharField(255) | Tên sản phẩm |
| `description` | TextField | Mô tả, có thể rỗng |
| `image` | ImageField | Ảnh legacy/đơn, vẫn giữ để tương thích dữ liệu cũ |
| `category` | ForeignKey(Category) | Bắt buộc, `on_delete=PROTECT` |
| `supplier` | ForeignKey(Supplier) | Có thể rỗng/null, `on_delete=PROTECT` |
| `cost_price` | DecimalField(12, 2) | Giá nhập, không âm |
| `selling_price` | DecimalField(12, 2) | Giá bán, không âm |
| `quantity` | PositiveIntegerField | Tổng tồn kho toàn hệ thống |
| `minimum_stock` | PositiveIntegerField | Ngưỡng cảnh báo tồn thấp |
| `unit` | CharField(50) | Đơn vị tính |
| `status` | CharField(20) | `active`, `inactive`, `discontinued` |
| `created_at` | DateTimeField | Ngày tạo |
| `updated_at` | DateTimeField | Ngày cập nhật |

## Model ProductImage

File: `backend/products/models.py`

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | BigAutoField | Khóa chính |
| `product` | ForeignKey(Product) | `related_name="images"`, xóa theo sản phẩm |
| `image` | ImageField | File ảnh, upload vào `products/gallery/` |
| `alt_text` | CharField(255) | Text thay thế, có thể rỗng |
| `is_primary` | BooleanField | Đánh dấu ảnh đại diện |
| `sort_order` | PositiveIntegerField | Thứ tự hiển thị |
| `created_at` | DateTimeField | Ngày tạo |

## Quan hệ dữ liệu

- Một `Category` có nhiều `Product`.
- Một `Product` thuộc một `Category`.
- Một `Supplier` có thể cung cấp nhiều `Product`.
- Một `Product` có nhiều `ProductImage`.
- Khi xóa `Category` hoặc `Supplier` đang có sản phẩm, database/API chặn xóa bằng `PROTECT`.
- Khi xóa `Product`, các `ProductImage` liên quan bị xóa theo `CASCADE`.

## Media và ảnh sản phẩm

- `Product.image` là trường ảnh cũ, vẫn tồn tại để tương thích dữ liệu và response cũ.
- Gallery nhiều ảnh dùng bảng `product_images`.
- API trả:
  - `image`: ảnh đại diện để frontend cũ vẫn hiển thị được.
  - `thumbnail`: alias của ảnh đại diện.
  - `images`: danh sách ảnh gallery.
- Khi upload nhiều ảnh qua field `uploaded_images`, ảnh đầu tiên được đặt `is_primary=True`.

## Migration liên quan

- `backend/categories/migrations/0001_initial.py`
- `backend/categories/migrations/0002_expand_category.py`
- `backend/products/migrations/0001_initial.py`
- `backend/products/migrations/0002_expand_product.py`
- `backend/products/migrations/0003_product_image_upload.py`
- `backend/products/migrations/0004_productimage.py`

## Ghi chú tồn kho

Không cập nhật trực tiếp `Product.quantity` khi CRUD sản phẩm. Số lượng tồn được cập nhật thông qua nghiệp vụ phiếu nhập, phiếu xuất và điều chỉnh kho.
