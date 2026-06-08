# 03 - Database

## Model Category

File: `backend/categories/models.py`

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| id | BigAutoField | Khóa chính |
| name | CharField(100) | Tên danh mục |

## Model Product

File: `backend/products/models.py`

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| id | BigAutoField | Khóa chính |
| name | CharField(255) | Tên sản phẩm |
| description | TextField | Mô tả, có thể rỗng |
| price | DecimalField(10, 2) | Giá sản phẩm |
| quantity | IntegerField | Số lượng tồn kho |
| category | ForeignKey(Category) | Danh mục sản phẩm |
| created_at | DateTimeField | Ngày tạo |
| updated_at | DateTimeField | Ngày cập nhật |

## Quan hệ dữ liệu

- Một `Category` có nhiều `Product`.
- Một `Product` thuộc về một `Category`.
- Khi xóa `Category`, các `Product` thuộc category đó cũng bị xóa do `on_delete=models.CASCADE`.

## Trạng thái hiện tại

Đã có migration ban đầu:

- `backend/categories/migrations/0001_initial.py`
- `backend/products/migrations/0001_initial.py`

## Cần làm thêm

- Thêm validation để `price` không âm.
- Thêm validation để `quantity` không âm.
- Cân nhắc thêm `slug`, `sku`, `status` hoặc `image` nếu yêu cầu sản phẩm mở rộng.
- Chuyển cấu hình database sang PostgreSQL trong môi trường Docker.
