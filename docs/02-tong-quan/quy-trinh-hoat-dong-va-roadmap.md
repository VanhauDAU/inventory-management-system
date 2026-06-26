# Quy trình hoạt động và roadmap phát triển

Tài liệu này mô tả luồng hoạt động hiện tại của Product Management System, các API chính, cách dữ liệu di chuyển trong hệ thống, những điểm còn hạn chế và các hạng mục nên phát triển tiếp.

## 1. Tổng quan hệ thống

Product Management System là hệ thống quản lý sản phẩm, danh mục, nhà cung cấp và kho hàng. Backend được xây dựng bằng Django REST Framework, xác thực bằng JWT, database chính là PostgreSQL khi chạy bằng Docker Compose.

Các module chính:

| Module | Vai trò |
| --- | --- |
| `categories` | Quản lý danh mục sản phẩm, hỗ trợ danh mục cha-con |
| `suppliers` | Quản lý nhà cung cấp |
| `products` | Quản lý sản phẩm, giá, tồn kho tổng, trạng thái |
| `inventory` | Quản lý kho, phiếu nhập, phiếu xuất, điều chỉnh tồn kho |
| `reports` | Cung cấp API báo cáo tồn kho, báo cáo nhập/xuất |
| `product_management` | Cấu hình project, router API, JWT, schema, middleware |

## 2. Luồng khởi động hệ thống

Khi chạy bằng Docker Compose:

1. Service `db` khởi động PostgreSQL.
2. PostgreSQL healthcheck xác nhận database sẵn sàng.
3. Service `backend` khởi động sau khi `db` healthy.
4. Backend đọc biến môi trường từ `.env`.
5. `entrypoint.sh` chạy migration.
6. Django server chạy tại `http://localhost:8000`.
7. Người dùng truy cập Swagger tại `http://localhost:8000/api/docs/`.

Lệnh chạy:

```bash
docker compose up --build -d
```

Kiểm tra container:

```bash
docker compose ps
```

## 3. Luồng xác thực người dùng

Các API nghiệp vụ đều yêu cầu JWT, ngoại trừ health check và tài liệu API.

### 3.1. Tạo tài khoản admin

```bash
docker compose exec backend python manage.py createsuperuser
```

### 3.2. Lấy access token

```http
POST /api/token/
```

Body:

```json
{
  "username": "admin",
  "password": "your_password"
}
```

Response:

```json
{
  "refresh": "refresh_token",
  "access": "access_token"
}
```

### 3.3. Gọi API có bảo vệ

Header:

```http
Authorization: Bearer access_token
```

Nếu không có token hoặc token sai, API trả về `401 Unauthorized`.

## 4. Luồng quản lý dữ liệu nền

### 4.1. Quản lý danh mục

Danh mục là dữ liệu nền để phân loại sản phẩm.

API:

```http
GET    /api/categories/
POST   /api/categories/
GET    /api/categories/{id}/
PATCH  /api/categories/{id}/
DELETE /api/categories/{id}/
```

Luồng sử dụng:

1. Người dùng tạo danh mục cha, ví dụ `Electronics`.
2. Người dùng có thể tạo danh mục con, ví dụ `Keyboard`, `Mouse`.
3. Khi tạo sản phẩm, bắt buộc chọn `category`.

### 4.2. Quản lý nhà cung cấp

Nhà cung cấp là dữ liệu liên kết với sản phẩm.

API:

```http
GET    /api/suppliers/
POST   /api/suppliers/
GET    /api/suppliers/{id}/
PATCH  /api/suppliers/{id}/
DELETE /api/suppliers/{id}/
```

Luồng sử dụng:

1. Người dùng tạo nhà cung cấp.
2. Khi tạo hoặc cập nhật sản phẩm, có thể gán `supplier`.
3. API supplier trả thêm `products_count` để biết nhà cung cấp đang có bao nhiêu sản phẩm.

## 5. Luồng quản lý sản phẩm

Sản phẩm là dữ liệu trung tâm của hệ thống.

API:

```http
GET    /api/products/
POST   /api/products/
GET    /api/products/{id}/
PATCH  /api/products/{id}/
DELETE /api/products/{id}/
GET    /api/products/{id}/stock-history/
```

Các field quan trọng:

| Field | Ý nghĩa |
| --- | --- |
| `sku` | Mã sản phẩm, unique, có thể tự sinh nếu không gửi |
| `barcode` | Mã barcode, unique, có thể rỗng |
| `name` | Tên sản phẩm |
| `image` | Ảnh đại diện trả về để tương thích UI cũ |
| `images` | Danh sách ảnh gallery của sản phẩm |
| `category` | Danh mục |
| `supplier` | Nhà cung cấp |
| `cost_price` | Giá nhập |
| `selling_price` | Giá bán |
| `price` | Alias tương thích với `selling_price` |
| `quantity` | Tồn kho tổng hiện tại |
| `minimum_stock` | Ngưỡng tồn tối thiểu |
| `status` | `active`, `inactive`, `discontinued` |

Luồng tạo sản phẩm:

1. Người dùng chọn danh mục.
2. Người dùng chọn nhà cung cấp nếu có.
3. Người dùng nhập tên, giá nhập, giá bán, ngưỡng tồn và các thông tin phân loại.
4. Nếu không nhập `sku`, backend tự sinh mã dạng `PRD-...`.
5. Nếu chọn ảnh, frontend gửi `multipart/form-data` với nhiều field `uploaded_images`.
6. Product được lưu vào database.
7. Backend lưu gallery vào bảng `product_images`; ảnh đầu tiên là ảnh đại diện.

Quy định upload ảnh:

- Field upload: `uploaded_images`.
- Tối đa 8 ảnh cho một sản phẩm.
- Mỗi ảnh tối đa 5MB.
- Nếu cập nhật sản phẩm và gửi ảnh mới, gallery cũ được thay bằng gallery mới.

Tìm kiếm, lọc, sắp xếp:

```http
GET /api/products/?search=keyboard
GET /api/products/?category=1
GET /api/products/?supplier=1
GET /api/products/?status=active
GET /api/products/?ordering=price
GET /api/products/?ordering=-created_at
```

## 6. Luồng quản lý kho

Inventory hiện gồm ba nhóm dữ liệu:

| Model | Vai trò |
| --- | --- |
| `Warehouse` | Kho hàng |
| `StockTransaction` | Phiếu nhập, phiếu xuất, phiếu điều chỉnh |
| `StockTransactionItem` | Dòng sản phẩm trong từng phiếu |

### 6.1. Quản lý kho

API:

```http
GET    /api/warehouses/
POST   /api/warehouses/
GET    /api/warehouses/{id}/
PATCH  /api/warehouses/{id}/
DELETE /api/warehouses/{id}/
```

Luồng sử dụng:

1. Người dùng tạo kho, ví dụ `Main Warehouse`.
2. Mỗi phiếu nhập/xuất/điều chỉnh phải chọn một kho.
3. API warehouse trả thêm `stock_transactions_count`.

### 6.2. Tạo phiếu nhập kho

API:

```http
POST /api/stock-transactions/
```

Body ví dụ:

```json
{
  "warehouse": 1,
  "transaction_type": "import",
  "transaction_code": "IMPORT-001",
  "reason": "Initial import",
  "items": [
    {
      "product": 1,
      "quantity": 5,
      "unit_price": "40000.00"
    }
  ]
}
```

Luồng xử lý:

1. Backend kiểm tra `items` không được rỗng.
2. Backend kiểm tra một sản phẩm không được lặp trong cùng một phiếu.
3. Backend tạo `StockTransaction`.
4. Backend tạo từng `StockTransactionItem`.
5. Với `transaction_type = import`, backend cộng `Product.quantity`.
6. `total_amount` của item tự tính bằng `quantity * unit_price`.
7. `created_by` tự lấy từ user đang đăng nhập.

### 6.3. Tạo phiếu xuất kho

Body ví dụ:

```json
{
  "warehouse": 1,
  "transaction_type": "export",
  "transaction_code": "EXPORT-001",
  "reason": "Customer order",
  "items": [
    {
      "product": 1,
      "quantity": 2,
      "unit_price": "55000.00"
    }
  ]
}
```

Luồng xử lý:

1. Backend kiểm tra sản phẩm còn đủ tồn kho tổng.
2. Nếu không đủ tồn, API trả `400 Bad Request`.
3. Nếu đủ tồn, backend tạo phiếu xuất.
4. Backend trừ `Product.quantity`.

### 6.4. Tạo phiếu điều chỉnh tồn kho

Body ví dụ:

```json
{
  "warehouse": 1,
  "transaction_type": "adjustment",
  "transaction_code": "ADJUST-001",
  "reason": "Stock count correction",
  "items": [
    {
      "product": 1,
      "quantity": 20,
      "unit_price": "40000.00"
    }
  ]
}
```

Luồng xử lý:

1. Backend tạo phiếu điều chỉnh.
2. Với `transaction_type = adjustment`, backend đặt `Product.quantity` bằng `item.quantity`.

Ghi chú quan trọng: hiện tại hệ thống đang quản lý tồn kho ở mức tổng toàn hệ thống qua `Product.quantity`, chưa có bảng tồn kho riêng theo từng kho.

### 6.5. Xem danh sách phiếu và item

API:

```http
GET /api/stock-transactions/
GET /api/stock-transactions/{id}/
GET /api/stock-transaction-items/
GET /api/stock-transaction-items/{id}/
```

Filter:

```http
GET /api/stock-transactions/?warehouse=1
GET /api/stock-transactions/?transaction_type=import
GET /api/stock-transaction-items/?product=1
GET /api/stock-transaction-items/?stock_transaction=1
```

## 7. Luồng lịch sử nhập/xuất của sản phẩm

Endpoint:

```http
GET /api/products/{id}/stock-history/
```

Mục đích:

- Xem toàn bộ dòng nhập/xuất/điều chỉnh liên quan đến một sản phẩm.
- Phục vụ màn hình chi tiết sản phẩm.
- Giúp kiểm tra vì sao tồn kho hiện tại tăng hoặc giảm.

Luồng xử lý:

1. Người dùng mở chi tiết sản phẩm.
2. Frontend gọi `/api/products/{id}/stock-history/`.
3. Backend lấy danh sách `StockTransactionItem` theo `product`.
4. Kết quả sắp xếp theo giao dịch mới nhất.
5. API trả dữ liệu dạng pagination.

Ví dụ response rút gọn:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "stock_transaction": 1,
      "product": 1,
      "quantity": 5,
      "unit_price": "40000.00",
      "total_amount": "200000.00",
      "note": ""
    }
  ]
}
```

## 8. Luồng báo cáo tồn kho

App `reports` cung cấp các API báo cáo read-only.

### 8.1. Tổng quan tồn kho

Endpoint:

```http
GET /api/reports/inventory/summary/
```

Response:

```json
{
  "total_products": 10,
  "total_quantity": 120,
  "total_stock_value": "5000000.00",
  "low_stock_products": 2,
  "warehouses_count": 1,
  "import_transactions": 5,
  "export_transactions": 3,
  "adjustment_transactions": 1
}
```

Ý nghĩa:

| Field | Ý nghĩa |
| --- | --- |
| `total_products` | Tổng số sản phẩm |
| `total_quantity` | Tổng tồn kho hiện tại |
| `total_stock_value` | Giá trị tồn kho theo `quantity * cost_price` |
| `low_stock_products` | Số sản phẩm có tồn kho nhỏ hơn hoặc bằng `minimum_stock` |
| `warehouses_count` | Tổng số kho |
| `import_transactions` | Số phiếu nhập |
| `export_transactions` | Số phiếu xuất |
| `adjustment_transactions` | Số phiếu điều chỉnh |

### 8.2. Báo cáo phiếu nhập

Endpoint:

```http
GET /api/reports/inventory/imports/
```

Trả về danh sách `StockTransaction` có `transaction_type = import`.

### 8.3. Báo cáo phiếu xuất

Endpoint:

```http
GET /api/reports/inventory/exports/
```

Trả về danh sách `StockTransaction` có `transaction_type = export`.

## 9. Luồng dữ liệu tổng quát

```text
User
  |
  | login
  v
JWT Token
  |
  | Authorization: Bearer token
  v
API Router
  |
  +-- Categories
  +-- Suppliers
  +-- Products
  |     |
  |     +-- Stock history
  |
  +-- Warehouses
  +-- Stock Transactions
  |     |
  |     +-- Stock Transaction Items
  |     +-- Update Product.quantity
  |
  +-- Reports
        |
        +-- Inventory summary
        +-- Import report
        +-- Export report
```

## 10. Danh sách API hiện tại

### Public API

```http
GET  /api/health/
GET  /api/docs/
GET  /api/schema/
GET  /api/redoc/
POST /api/token/
POST /api/token/refresh/
```

### Protected API

```http
/api/categories/
/api/products/
/api/products/{id}/stock-history/
/api/suppliers/
/api/warehouses/
/api/stock-transactions/
/api/stock-transaction-items/
/api/reports/inventory/summary/
/api/reports/inventory/imports/
/api/reports/inventory/exports/
```

## 11. Kiểm thử hiện tại

Backend hiện có test cho:

- Category API.
- Product API.
- Product stock history.
- Supplier API.
- Inventory model.
- Warehouse API.
- Stock transaction import/export.
- Chặn xuất quá tồn kho.
- Stock transaction item API.
- Reports API.
- Health check.

Chạy test:

```bash
docker compose exec backend python manage.py test
```

Kết quả gần nhất:

```text
Found 20 test(s).
OK
```

## 12. Những điểm cần cải thiện

### 12.1. Tồn kho theo từng kho

Vấn đề hiện tại:

- `StockTransaction` có `warehouse`.
- Nhưng tồn kho thực tế chỉ đang lưu tại `Product.quantity`.
- Nếu có nhiều kho, hệ thống chưa biết mỗi kho đang có bao nhiêu sản phẩm.

Hướng cải thiện:

Tạo model mới:

```text
InventoryBalance
```

Field đề xuất:

| Field | Ý nghĩa |
| --- | --- |
| `warehouse` | Kho |
| `product` | Sản phẩm |
| `quantity` | Số lượng tồn tại kho đó |
| `updated_at` | Ngày cập nhật |

Constraint:

```text
unique(warehouse, product)
```

API đề xuất:

```http
GET /api/inventory-balances/
GET /api/warehouses/{id}/stock/
GET /api/products/{id}/warehouse-stock/
```

### 12.2. Không nên sửa item sau khi tạo phiếu

Hiện serializer đã chặn update `items` trong `StockTransactionSerializer.update()`. Đây là hướng đúng vì nếu cho sửa item sau khi đã cộng/trừ tồn kho thì rất dễ lệch dữ liệu.

Cần cải thiện thêm:

- Cân nhắc không cho xóa phiếu kho đã tạo.
- Nếu cần hủy phiếu, nên tạo giao dịch đảo ngược hoặc thêm trạng thái `cancelled`.
- Ghi nhận người hủy và thời điểm hủy.

### 12.3. Mã giao dịch nên tự sinh

Hiện `transaction_code` do client gửi lên và phải unique.

Hướng cải thiện:

- Tự sinh mã theo ngày và loại giao dịch:

```text
IMP-20260611-0001
EXP-20260611-0001
ADJ-20260611-0001
```

- Cho phép client không gửi `transaction_code`.

### 12.4. Filter báo cáo theo thời gian

Reports hiện mới có summary/import/export cơ bản.

Cần thêm query params:

```http
GET /api/reports/inventory/imports/?date_from=2026-06-01&date_to=2026-06-30
GET /api/reports/inventory/exports/?date_from=2026-06-01&date_to=2026-06-30
```

Các filter nên có:

- `date_from`
- `date_to`
- `warehouse`
- `product`
- `category`
- `supplier`

### 12.5. Báo cáo giá trị nhập/xuất

Hiện import/export report trả danh sách phiếu, chưa trả tổng tiền.

Cần thêm:

```http
GET /api/reports/inventory/import-summary/
GET /api/reports/inventory/export-summary/
```

Response đề xuất:

```json
{
  "transactions_count": 5,
  "items_count": 12,
  "total_quantity": 100,
  "total_amount": "4000000.00"
}
```

### 12.6. Filter nâng cao cho sản phẩm

Hiện product đã có search, filter theo category/supplier/status và ordering.

Cần phát triển thêm:

```http
GET /api/products/?min_price=10000&max_price=100000
GET /api/products/?low_stock=true
GET /api/products/?quantity_min=1&quantity_max=50
```

### 12.7. Permission theo vai trò

Hiện chỉ cần đăng nhập là có thể thao tác API.

Cần phân quyền:

| Role | Quyền |
| --- | --- |
| Admin | Toàn quyền |
| Manager | Quản lý sản phẩm, kho, báo cáo |
| Staff | Tạo phiếu nhập/xuất |
| Viewer | Chỉ xem dữ liệu |

Các API nhạy cảm như xóa sản phẩm, xóa kho, sửa phiếu nên giới hạn cho Admin/Manager.

### 12.8. Audit log

Cần ghi log các thao tác quan trọng:

- Ai tạo sản phẩm.
- Ai sửa giá.
- Ai tạo phiếu nhập/xuất.
- Ai hủy phiếu.
- Dữ liệu trước và sau khi thay đổi.

API hoặc model đề xuất:

```text
AuditLog
```

### 12.9. Frontend chưa hoàn thiện

Backend đã có nhiều API, nhưng frontend cần phát triển tiếp:

- Login bằng JWT.
- Layout dashboard.
- Quản lý category.
- Quản lý supplier.
- Quản lý product.
- Quản lý warehouse.
- Tạo phiếu nhập.
- Tạo phiếu xuất.
- Xem lịch sử tồn kho của sản phẩm.
- Dashboard báo cáo tồn kho.
- UI cảnh báo hàng sắp hết.

### 12.10. Docker Compose chưa có frontend service

Hiện Docker Compose chính mới chạy backend và PostgreSQL.

Cần thêm:

```text
frontend service
```

Để nhóm có thể chạy toàn bộ hệ thống bằng một lệnh:

```bash
docker compose up --build -d
```

### 12.11. Cập nhật tài liệu cũ

Một số tài liệu cũ vẫn mô tả trạng thái trước khi có suppliers, inventory và reports API.

Cần cập nhật:

- `README.md`
- `docs/04-api/tai-lieu-api.md`
- `docs/01-phan-tich/ke-hoach-trang-thai-du-an.md`
- `docs/05-huong-dan/huong-dan-su-dung.md`

## 13. Hạng mục nên phát triển tiếp

### Giai đoạn 1 - Hoàn thiện backend kho

Mục tiêu: dữ liệu kho chính xác hơn.

Việc cần làm:

1. Tạo model `InventoryBalance`.
2. Khi nhập kho, cộng tồn theo `warehouse + product`.
3. Khi xuất kho, trừ tồn theo `warehouse + product`.
4. Khi điều chỉnh, set tồn theo `warehouse + product`.
5. Đồng bộ hoặc tính lại `Product.quantity` bằng tổng tồn các kho.
6. Viết test cho nhiều kho.
7. Thêm API xem tồn theo kho.

### Giai đoạn 2 - Hoàn thiện báo cáo

Mục tiêu: reports đủ dùng cho dashboard.

Việc cần làm:

1. Thêm filter ngày cho reports.
2. Thêm filter warehouse/category/supplier/product.
3. Thêm summary tổng tiền nhập/xuất.
4. Thêm top sản phẩm nhập nhiều nhất.
5. Thêm top sản phẩm xuất nhiều nhất.
6. Thêm danh sách hàng sắp hết.

### Giai đoạn 3 - Hoàn thiện frontend

Mục tiêu: người dùng thao tác được toàn bộ luồng nghiệp vụ.

Màn hình cần có:

1. Login.
2. Dashboard.
3. Product list.
4. Product create/edit.
5. Category management.
6. Supplier management.
7. Warehouse management.
8. Stock import form.
9. Stock export form.
10. Product stock history.
11. Inventory reports.

### Giai đoạn 4 - Phân quyền và audit

Mục tiêu: hệ thống an toàn hơn khi có nhiều người dùng.

Việc cần làm:

1. Thiết kế role.
2. Tạo permission class theo role.
3. Giới hạn API xóa/sửa dữ liệu quan trọng.
4. Thêm audit log.
5. Thêm lịch sử hủy phiếu.

### Giai đoạn 5 - DevOps và chất lượng

Mục tiêu: dễ chạy, dễ test, dễ deploy.

Việc cần làm:

1. Thêm frontend vào Docker Compose.
2. Cập nhật GitHub Actions nếu chưa chạy đủ backend/frontend.
3. Thêm lint/format.
4. Tạo seed data demo.
5. Tạo Postman collection.
6. Cập nhật toàn bộ tài liệu.

## 14. Ưu tiên đề xuất

Thứ tự nên làm tiếp:

1. Cập nhật tài liệu API hiện tại.
2. Tạo `InventoryBalance` để hỗ trợ tồn kho theo từng kho.
3. Thêm filter ngày và tổng tiền cho reports.
4. Làm frontend cho product/supplier/warehouse.
5. Làm frontend cho nhập kho/xuất kho.
6. Làm dashboard báo cáo tồn kho.
7. Thêm role permission.
8. Thêm audit log.

Nếu mục tiêu là demo sớm, nên ưu tiên frontend trước. Nếu mục tiêu là nghiệp vụ kho chính xác, nên ưu tiên `InventoryBalance` trước.
