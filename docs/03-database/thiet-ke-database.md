# 03 - Database

<<<<<<< HEAD
## Tổng quan

Database PostgreSQL hiện gồm sáu bảng nghiệp vụ chính:

- `categories`
- `suppliers`
- `products`
- `warehouses`
- `stock_transactions`
- `stock_transaction_items`

Các bảng user và permission tiếp tục dùng hệ thống authentication mặc định của Django.

## Categories

Model: `backend/categories/models.py`
=======
## Model Category

File: `backend/categories/models.py`
>>>>>>> feature/frontend-crud

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| id | BigAutoField | Khóa chính |
| name | CharField(100) | Tên danh mục |
<<<<<<< HEAD
| description | TextField | Mô tả |
| parent | ForeignKey(Category) | Danh mục cha, có thể rỗng |
| is_active | BooleanField | Trạng thái hoạt động |
| created_at | DateTimeField | Ngày tạo |
| updated_at | DateTimeField | Ngày cập nhật |

Quan hệ `parent` tạo cây danh mục cha-con. Khi danh mục cha bị xóa, `parent_id` của danh mục con được đặt thành `NULL`.

## Suppliers

Model: `backend/suppliers/models.py`
=======

## Model Product

File: `backend/products/models.py`
>>>>>>> feature/frontend-crud

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| id | BigAutoField | Khóa chính |
<<<<<<< HEAD
| name | CharField(255) | Tên nhà cung cấp |
| contact_name | CharField(255) | Người liên hệ |
| phone | CharField(30) | Số điện thoại |
| email | EmailField | Email |
| address | TextField | Địa chỉ |
| tax_code | CharField(100) | Mã số thuế, unique |
| note | TextField | Ghi chú |
| is_active | BooleanField | Trạng thái hoạt động |
| created_at | DateTimeField | Ngày tạo |
| updated_at | DateTimeField | Ngày cập nhật |

## Products

Model: `backend/products/models.py`

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| id | BigAutoField | Khóa chính |
| sku | CharField(100) | Mã sản phẩm, unique |
| barcode | CharField(100) | Barcode, unique, có thể rỗng |
| name | CharField(255) | Tên sản phẩm |
| description | TextField | Mô tả |
| image | URLField(500) | URL ảnh |
| category | ForeignKey(Category) | Danh mục |
| supplier | ForeignKey(Supplier) | Nhà cung cấp, có thể rỗng |
| cost_price | DecimalField(12, 2) | Giá nhập |
| selling_price | DecimalField(12, 2) | Giá bán |
| quantity | PositiveIntegerField | Số lượng tồn hiện tại |
| minimum_stock | PositiveIntegerField | Ngưỡng tồn tối thiểu |
| unit | CharField(50) | Đơn vị tính |
| status | CharField(20) | `active`, `inactive`, `discontinued` |
| created_at | DateTimeField | Ngày tạo |
| updated_at | DateTimeField | Ngày cập nhật |

API vẫn hỗ trợ field `price` như alias của `selling_price` để tương thích frontend cũ.

## Warehouses

Model: `backend/inventory/models.py`

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| id | BigAutoField | Khóa chính |
| name | CharField(255) | Tên kho |
| address | TextField | Địa chỉ |
| phone | CharField(30) | Điện thoại |
| manager_name | CharField(255) | Người quản lý |
| is_active | BooleanField | Trạng thái hoạt động |
| created_at | DateTimeField | Ngày tạo |
| updated_at | DateTimeField | Ngày cập nhật |

## Stock Transactions

Model: `backend/inventory/models.py`

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| id | BigAutoField | Khóa chính |
| warehouse | ForeignKey(Warehouse) | Kho thực hiện giao dịch |
| transaction_type | CharField(20) | `import`, `export`, `adjustment` |
| transaction_code | CharField(100) | Mã giao dịch, unique |
| reason | CharField(255) | Lý do |
| note | TextField | Ghi chú |
| created_by | ForeignKey(User) | Người tạo |
| created_at | DateTimeField | Ngày tạo |
| updated_at | DateTimeField | Ngày cập nhật |

## Stock Transaction Items

Model: `backend/inventory/models.py`

| Field | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| id | BigAutoField | Khóa chính |
| stock_transaction | ForeignKey(StockTransaction) | Giao dịch kho |
| product | ForeignKey(Product) | Sản phẩm |
| quantity | PositiveIntegerField | Số lượng, tối thiểu 1 |
| unit_price | DecimalField(12, 2) | Đơn giá |
| total_amount | DecimalField(14, 2) | Tự tính `quantity * unit_price` |
| note | TextField | Ghi chú |

Mỗi sản phẩm chỉ xuất hiện một lần trong cùng một giao dịch, được bảo vệ bằng unique constraint trên `stock_transaction` và `product`.

## Quan hệ dữ liệu

- Một Category có nhiều Product.
- Một Category có thể có nhiều Category con.
- Một Supplier có nhiều Product.
- Một Warehouse có nhiều StockTransaction.
- Một User có thể tạo nhiều StockTransaction.
- Một StockTransaction có nhiều StockTransactionItem.
- Một Product có thể xuất hiện trong nhiều StockTransactionItem.

Các quan hệ Product với Category/Supplier, StockTransaction với Warehouse và StockTransactionItem với Product dùng `PROTECT` để tránh xóa dữ liệu đang được tham chiếu.

## Migration

Các migration mở rộng:

- `backend/categories/migrations/0002_expand_category.py`
- `backend/suppliers/migrations/0001_initial.py`
- `backend/products/migrations/0002_expand_product.py`
- `backend/inventory/migrations/0001_initial.py`

Migration Product rename cột `price` thành `selling_price` để giữ dữ liệu cũ. SKU của sản phẩm cũ được sinh theo định dạng `PRD-000001` trước khi áp unique constraint.

Chạy migration trong Docker:

```bash
docker compose up --build -d
docker compose exec backend python manage.py showmigrations
```
=======
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
>>>>>>> feature/frontend-crud
