# Kế hoạch phát triển backend

## 1. Mục tiêu

Hoàn thiện backend cho hệ thống quản lý sản phẩm thông minh sử dụng Django REST Framework. Hệ thống cần quản lý được:

- Sản phẩm
- Danh mục sản phẩm
- Nhà phân phối / nhà cung cấp
- Kho hàng
- Nhập kho, xuất kho, điều chỉnh kho
- Người dùng, nhóm quyền và phân quyền bằng auth mặc định của Django
- Báo cáo tồn kho
- Tính năng AI gợi ý nhập hàng ở giai đoạn mở rộng

Hiện tại backend đã có:

```text
products
categories
```

Cần tạo thêm các app:

```text
suppliers
warehouses
inventory
reports
accounts
ai_assistant
```

Trong đó `ai_assistant` có thể làm sau cùng, khi đã có dữ liệu tồn kho và lịch sử giao dịch.

## 2. Danh sách app backend cần có

### 2.1. App `categories`

Trạng thái: đã có.

Vai trò:

- Quản lý danh mục sản phẩm.
- Hỗ trợ sản phẩm thuộc một danh mục.
- Có thể mở rộng danh mục cha - con.

Cần bổ sung:

```text
description
parent
is_active
created_at
updated_at
```

Model đề xuất:

```python
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="children",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2.2. App `suppliers`

Trạng thái: cần tạo mới.

Vai trò:

- Quản lý nhà phân phối / nhà cung cấp.
- Một nhà phân phối có thể cung cấp nhiều sản phẩm.

Lệnh tạo app:

```bash
cd backend
python manage.py startapp suppliers
```

Model đề xuất:

```python
class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    tax_code = models.CharField(max_length=50, blank=True)
    note = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

API cần có:

```text
GET    /api/suppliers/
POST   /api/suppliers/
GET    /api/suppliers/{id}/
PATCH  /api/suppliers/{id}/
DELETE /api/suppliers/{id}/
```

### 2.3. App `products`

Trạng thái: đã có.

Vai trò:

- Quản lý thông tin sản phẩm.
- Liên kết với danh mục và nhà phân phối.

Cần bổ sung field:

```text
sku
barcode
image
supplier
cost_price
selling_price
minimum_stock
unit
status
```

Model đề xuất:

```python
class Product(models.Model):
    STATUS_CHOICES = [
        ("active", "Đang kinh doanh"),
        ("inactive", "Ngừng kinh doanh"),
    ]

    sku = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=100, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField(default=0)
    minimum_stock = models.IntegerField(default=5)
    unit = models.CharField(max_length=50, default="cái")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

Ghi chú:

- `quantity` có thể giữ để hiển thị nhanh tổng tồn.
- Nếu cần tồn kho chính xác theo từng kho, nên bổ sung bảng `inventory_balances`.
- Không cho xóa danh mục nếu đang có sản phẩm bằng `on_delete=models.PROTECT`.

API cần nâng cấp:

```text
GET /api/products/?search=&category=&supplier=&status=&min_price=&max_price=&low_stock=
```

### 2.4. App `warehouses`

Trạng thái: cần tạo mới.

Vai trò:

- Quản lý kho hàng.
- Một kho có nhiều phiếu nhập, xuất, điều chỉnh.

Lệnh tạo app:

```bash
cd backend
python manage.py startapp warehouses
```

Model đề xuất:

```python
class Warehouse(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    manager_name = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

API cần có:

```text
GET    /api/warehouses/
POST   /api/warehouses/
GET    /api/warehouses/{id}/
PATCH  /api/warehouses/{id}/
DELETE /api/warehouses/{id}/
```

### 2.5. App `inventory`

Trạng thái: cần tạo mới.

Vai trò:

- Quản lý phiếu nhập kho, xuất kho, điều chỉnh kho.
- Một phiếu có nhiều sản phẩm.
- Lưu lịch sử giao dịch tồn kho.

Lệnh tạo app:

```bash
cd backend
python manage.py startapp inventory
```

Model chính:

```text
StockTransaction
StockTransactionItem
InventoryBalance
```

#### StockTransaction

Lưu thông tin chung của một phiếu kho.

```python
class StockTransaction(models.Model):
    TRANSACTION_TYPES = [
        ("import", "Nhập kho"),
        ("export", "Xuất kho"),
        ("adjustment", "Điều chỉnh kho"),
    ]

    transaction_code = models.CharField(max_length=50, unique=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    reason = models.CharField(max_length=255, blank=True)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="stock_transactions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### StockTransactionItem

Lưu từng sản phẩm trong một phiếu.

```python
class StockTransactionItem(models.Model):
    stock_transaction = models.ForeignKey(
        StockTransaction,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    note = models.TextField(blank=True)
```

Ràng buộc nên có:

```text
unique(stock_transaction_id, product_id)
quantity > 0
unit_price >= 0
```

#### InventoryBalance

Lưu số lượng tồn hiện tại theo từng sản phẩm và từng kho.

```python
class InventoryBalance(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
```

Ràng buộc:

```text
unique(product_id, warehouse_id)
quantity >= 0
```

API cần có:

```text
GET    /api/stock-transactions/
POST   /api/stock-transactions/
GET    /api/stock-transactions/{id}/
GET    /api/inventory-balances/
GET    /api/inventory-balances/?warehouse=&product=&low_stock=
```

Nghiệp vụ khi tạo phiếu:

```text
transaction_type = import
- tăng InventoryBalance.quantity
- tăng Product.quantity nếu đang lưu tổng tồn

transaction_type = export
- kiểm tra tồn kho đủ hay không
- giảm InventoryBalance.quantity
- giảm Product.quantity nếu đang lưu tổng tồn

transaction_type = adjustment
- điều chỉnh InventoryBalance.quantity
- cập nhật Product.quantity nếu đang lưu tổng tồn
```

### 2.6. App `reports`

Trạng thái: cần tạo mới.

Vai trò:

- Cung cấp API tổng hợp dữ liệu cho dashboard.
- Không nhất thiết phải có nhiều model riêng.
- Chủ yếu dùng service/query để tổng hợp dữ liệu từ `products`, `inventory`, `warehouses`.

Lệnh tạo app:

```bash
cd backend
python manage.py startapp reports
```

API cần có:

```text
GET /api/reports/summary/
GET /api/reports/low-stock/
GET /api/reports/inventory-value/
GET /api/reports/stock-movement/
```

Dữ liệu trả về nên có:

```text
total_products
total_categories
total_suppliers
total_warehouses
total_inventory_value
low_stock_count
out_of_stock_count
recent_transactions
```

### 2.7. App `accounts`

Trạng thái: nên tạo mới, nhưng không tạo bảng user riêng.

Vai trò:

- Quản lý API liên quan tới người dùng.
- Dùng auth mặc định của Django: `auth_user`, `auth_group`, `auth_permission`.
- Tạo endpoint xem thông tin user hiện tại, danh sách group, gán group nếu cần.

Lệnh tạo app:

```bash
cd backend
python manage.py startapp accounts
```

Không tạo model `User` riêng.

API cần có:

```text
GET /api/accounts/me/
GET /api/accounts/users/
GET /api/accounts/groups/
PATCH /api/accounts/users/{id}/groups/
```

Group đề xuất:

```text
Admin
Manager
Staff
Viewer
```

Phân quyền đề xuất:

```text
Admin
- toàn quyền

Manager
- quản lý sản phẩm, danh mục, nhà phân phối, kho, nhập/xuất kho, báo cáo

Staff
- xem sản phẩm
- tạo phiếu nhập/xuất kho
- xem lịch sử kho

Viewer
- chỉ xem dữ liệu và báo cáo
```

### 2.8. App `ai_assistant`

Trạng thái: làm sau cùng.

Vai trò:

- Phân tích tồn kho.
- Gợi ý nhập hàng.
- Giải thích lý do gợi ý.

Lệnh tạo app:

```bash
cd backend
python manage.py startapp ai_assistant
```

API đề xuất:

```text
POST /api/ai/restock-suggestions/
GET  /api/ai/product-insights/
```

Giai đoạn đầu có thể làm rule-based trước:

```text
Nếu quantity <= minimum_stock:
  đưa vào danh sách cần nhập

Nếu số lượng xuất 30 ngày gần nhất cao:
  tăng mức độ ưu tiên
```

Sau đó mới tích hợp AI API thật.

## 3. Quan hệ dữ liệu tổng quát

```text
categories 1 - n products
categories 1 - n categories

suppliers 1 - n products

products 1 - n stock_transaction_items

warehouses 1 - n stock_transactions

stock_transactions 1 - n stock_transaction_items

products 1 - n inventory_balances
warehouses 1 - n inventory_balances

auth_user 1 - n stock_transactions
```

Không tạo quan hệ trực tiếp:

```text
products 1 - n stock_transactions
```

Vì một phiếu có nhiều sản phẩm, nên sản phẩm phải đi qua bảng:

```text
stock_transaction_items
```

## 4. Trình tự thực hiện

### Giai đoạn 1: Chuẩn hóa model hiện tại

Mục tiêu:

- Hoàn thiện `categories`.
- Hoàn thiện `products`.
- Đảm bảo migration hiện tại không bị lỗi.

Việc cần làm:

1. Sửa `categories/models.py`.
2. Sửa `products/models.py`.
3. Thêm validation cho `price`, `quantity`, `minimum_stock`.
4. Sửa `products/serializers.py`.
5. Sửa `products/views.py` để filter theo category, supplier, status, low_stock.
6. Chạy migration.
7. Chạy test.

Lệnh:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py test
```

### Giai đoạn 2: Tạo app `suppliers`

Mục tiêu:

- Có CRUD API cho nhà phân phối.
- Sản phẩm có thể liên kết với nhà phân phối.

Việc cần làm:

1. Tạo app `suppliers`.
2. Thêm `suppliers` vào `INSTALLED_APPS`.
3. Tạo model `Supplier`.
4. Tạo serializer.
5. Tạo viewset.
6. Đăng ký router trong `product_management/urls.py`.
7. Thêm field `supplier` vào `Product`.
8. Tạo migration.
9. Viết test CRUD supplier.

### Giai đoạn 3: Tạo app `warehouses`

Mục tiêu:

- Quản lý danh sách kho hàng.

Việc cần làm:

1. Tạo app `warehouses`.
2. Thêm `warehouses` vào `INSTALLED_APPS`.
3. Tạo model `Warehouse`.
4. Tạo serializer.
5. Tạo viewset.
6. Đăng ký router.
7. Viết test CRUD warehouse.

### Giai đoạn 4: Tạo app `inventory`

Mục tiêu:

- Quản lý phiếu nhập, xuất, điều chỉnh.
- Một phiếu có nhiều sản phẩm.
- Cập nhật tồn kho theo từng kho.

Việc cần làm:

1. Tạo app `inventory`.
2. Thêm `inventory` vào `INSTALLED_APPS`.
3. Tạo model `StockTransaction`.
4. Tạo model `StockTransactionItem`.
5. Tạo model `InventoryBalance`.
6. Tạo serializer nested để tạo phiếu cùng danh sách item.
7. Khi tạo phiếu, dùng `transaction.atomic()`.
8. Kiểm tra xuất kho không vượt tồn.
9. Cập nhật `InventoryBalance`.
10. Cập nhật `Product.quantity` nếu giữ field tổng tồn.
11. Viết test nhập kho.
12. Viết test xuất kho.
13. Viết test điều chỉnh kho.

Luồng tạo phiếu:

```text
Client gửi:
- warehouse_id
- transaction_type
- reason
- note
- items[]

Backend xử lý:
- validate dữ liệu
- tạo StockTransaction
- tạo StockTransactionItem
- cập nhật InventoryBalance
- cập nhật Product.quantity
- trả về phiếu đã tạo
```

### Giai đoạn 5: Tạo app `accounts`

Mục tiêu:

- Dùng user, group, permission mặc định của Django.
- Có API phục vụ frontend phân quyền.

Việc cần làm:

1. Tạo app `accounts`.
2. Không tạo model user mới.
3. Tạo API `/api/accounts/me/`.
4. Tạo API danh sách user nếu admin cần quản lý.
5. Tạo API danh sách group.
6. Tạo command hoặc migration data để tạo group mặc định.
7. Gán permission cho group.
8. Cập nhật permission trong các ViewSet.

### Giai đoạn 6: Tạo app `reports`

Mục tiêu:

- Có dữ liệu cho dashboard.
- Có báo cáo tồn kho và sản phẩm sắp hết hàng.

Việc cần làm:

1. Tạo app `reports`.
2. Thêm API summary.
3. Thêm API low stock.
4. Thêm API inventory value.
5. Thêm API stock movement.
6. Tối ưu query bằng `select_related`, `prefetch_related`, `annotate`.
7. Viết test cho các API báo cáo chính.

### Giai đoạn 7: Tạo app `ai_assistant`

Mục tiêu:

- Gợi ý nhập hàng.
- Chuẩn bị nền để tích hợp AI thật.

Việc cần làm:

1. Tạo app `ai_assistant`.
2. Tạo service tổng hợp dữ liệu tồn kho.
3. Tạo rule-based restock suggestion.
4. Tạo API `/api/ai/restock-suggestions/`.
5. Trả về danh sách sản phẩm cần nhập.
6. Thêm giải thích lý do.
7. Sau khi ổn định mới tích hợp AI API.

Ví dụ response:

```json
[
  {
    "product_id": 1,
    "product_name": "Laptop Dell",
    "current_stock": 4,
    "minimum_stock": 10,
    "suggested_quantity": 20,
    "priority": "high",
    "reason": "Tồn kho thấp hơn ngưỡng tối thiểu và có nhiều giao dịch xuất gần đây."
  }
]
```

## 5. Cấu trúc backend sau khi hoàn thiện

```text
backend/
├── accounts/
├── categories/
├── inventory/
├── products/
├── product_management/
├── reports/
├── suppliers/
├── warehouses/
├── manage.py
└── requirements.txt
```

## 6. Thứ tự đăng ký app trong settings

Trong `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    "categories",
    "suppliers",
    "products",
    "warehouses",
    "inventory",
    "reports",
    "accounts",
    "ai_assistant",
]
```

## 7. Thứ tự router API đề xuất

Trong `product_management/urls.py`:

```python
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"suppliers", SupplierViewSet, basename="supplier")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"warehouses", WarehouseViewSet, basename="warehouse")
router.register(r"stock-transactions", StockTransactionViewSet, basename="stock-transaction")
router.register(r"inventory-balances", InventoryBalanceViewSet, basename="inventory-balance")
```

Các API đặc biệt như reports, accounts, AI có thể dùng `path()` riêng.

## 8. Checklist hoàn thiện backend

### Database

- [ ] Category có parent, description, is_active.
- [ ] Product có sku, barcode, supplier, cost_price, selling_price, minimum_stock, unit, status.
- [ ] Supplier được tạo đầy đủ.
- [ ] Warehouse được tạo đầy đủ.
- [ ] StockTransaction và StockTransactionItem hỗ trợ một phiếu nhiều sản phẩm.
- [ ] InventoryBalance lưu tồn kho theo sản phẩm và kho.
- [ ] Không tạo bảng user/role riêng, dùng auth mặc định của Django.

### API

- [ ] CRUD categories.
- [ ] CRUD suppliers.
- [ ] CRUD products.
- [ ] CRUD warehouses.
- [ ] Tạo phiếu nhập kho.
- [ ] Tạo phiếu xuất kho.
- [ ] Tạo phiếu điều chỉnh kho.
- [ ] Xem lịch sử giao dịch kho.
- [ ] Xem tồn kho theo sản phẩm.
- [ ] Xem tồn kho theo kho.
- [ ] Xem dashboard summary.
- [ ] Xem báo cáo hàng sắp hết.
- [ ] Xem thông tin user hiện tại.

### Permission

- [ ] Tạo group Admin.
- [ ] Tạo group Manager.
- [ ] Tạo group Staff.
- [ ] Tạo group Viewer.
- [ ] Gán permission cho từng group.
- [ ] API yêu cầu JWT.
- [ ] ViewSet kiểm tra quyền phù hợp.

### Test

- [ ] Test CRUD category.
- [ ] Test CRUD supplier.
- [ ] Test CRUD product.
- [ ] Test CRUD warehouse.
- [ ] Test nhập kho cập nhật tồn.
- [ ] Test xuất kho không vượt tồn.
- [ ] Test điều chỉnh kho.
- [ ] Test permission cơ bản.
- [ ] Test report summary.

## 9. Ưu tiên thực hiện

Thứ tự khuyến nghị:

1. `suppliers`
2. nâng cấp `categories` và `products`
3. `warehouses`
4. `inventory`
5. `reports`
6. `accounts`
7. `ai_assistant`

Lý do:

- `products` cần `suppliers`.
- `inventory` cần `products` và `warehouses`.
- `reports` cần dữ liệu từ `inventory`.
- `ai_assistant` cần dữ liệu lịch sử tồn kho để phân tích.

## 10. Kết luận

Backend nên được mở rộng theo hướng nghiệp vụ trước, AI làm sau. Các app bắt buộc cần tạo thêm là:

```text
suppliers
warehouses
inventory
reports
accounts
```

App mở rộng sau:

```text
ai_assistant
```

Thiết kế này phù hợp với Django REST Framework, tận dụng auth mặc định của Django, đồng thời đủ nền để frontend xây các màn quản lý sản phẩm, danh mục, kho hàng, nhập/xuất kho, báo cáo và phân quyền.
