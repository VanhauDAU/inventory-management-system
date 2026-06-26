# Tong Quan Project Va Luong Code

Tai lieu nay giup doc nhanh project `inventory-management`: project lam gi, code nam o dau, request chay qua nhung lop nao, cac chuc nang hoat dong ra sao, va can chu y gi khi chay local/deploy.

## 1. Project Lam Gi

Day la he thong quan ly san pham va ton kho theo mo hinh frontend/backend tach rieng.

Nghiep vu chinh:

- Dang nhap bang JWT.
- Quan ly nguoi dung, nhom quyen va permission.
- Quan ly danh muc san pham.
- Quan ly nha phan phoi.
- Quan ly san pham, SKU, barcode, anh, gia, ton kho, nguong ton toi thieu.
- Quan ly kho hang.
- Tao phieu nhap, xuat, dieu chinh kho.
- Tu dong cap nhat ton kho tong cua san pham va ton kho theo tung kho.
- Bao cao tong quan, san pham sap het hang, gia tri ton kho, lich su giao dich kho.
- Goi y nhap hang theo rule-based va co the bo sung OpenAI neu cau hinh API key.
- Chatbot ProductMS doc du lieu theo quyen nguoi dung va tra loi bang tieng Viet.

Cong nghe:

- Backend: Django 4.2, Django REST Framework, Simple JWT, django-filter, drf-spectacular, PostgreSQL/SQLite, Gunicorn.
- Frontend: React 18, Vite, Axios, CSS thuong.
- Deploy: Docker Compose cho local, Render Blueprint cho production.

## 2. Kien Truc Tong The

```text
Browser
  |
  | React/Vite UI
  | Bearer JWT
  v
Django REST API
  |
  | ORM
  v
PostgreSQL hoac SQLite
  |
  +-- OpenAI Responses API, tuy chon
```

Khi deploy Render:

- `inventory-management-api`: Django web service, root la `backend/`.
- `inventory-management-web`: Vite static site, root la `frontend/`.
- `inventory-management-db`: PostgreSQL managed database.

## 3. Cau Truc Thu Muc

```text
inventory-management/
├── backend/
│   ├── accounts/              # User, role/group, permission, current user
│   ├── ai_advisor/            # Goi y nhap hang va chatbot AI
│   ├── categories/            # Danh muc san pham
│   ├── inventory/             # Kho, ton theo kho, phieu kho
│   ├── product_management/    # Settings, URL root, middleware, ASGI/WSGI
│   ├── products/              # San pham, filter, image upload, stock history
│   ├── reports/               # API bao cao ton kho
│   ├── suppliers/             # Nha phan phoi
│   ├── .env.example           # File mau env duy nhat, chi gom key rong
│   ├── .python-version        # Pin Python 3.12 cho Render
│   ├── build.sh               # Build command cho Render
│   ├── Dockerfile
│   ├── entrypoint.sh          # Docker startup: wait DB, migrate, collectstatic, gunicorn
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── product-images/    # Anh SVG mac dinh/demo
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/        # Chart UI dung trong dashboard/report
│   │   │   ├── chat/          # Chatbot widget
│   │   │   ├── common/        # MetricCard, PlaceholderPage
│   │   │   └── layout/        # AppLayout, Sidebar, Topbar
│   │   ├── hooks/             # Hook lay du lieu dashboard/report
│   │   ├── pages/             # Trang theo module nghiep vu
│   │   ├── services/          # API client, auth helpers, product service
│   │   ├── utils/             # Permission, format, pagination, transform report
│   │   ├── App.jsx            # Router noi bo bang state activePage
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docs/
├── docker-compose.yml
├── render.yaml
└── README.md
```

Nguyen tac doc code:

- Backend moi module Django gom `models.py`, `serializers.py`, `views.py`, `tests.py`.
- API route tong nam o `backend/product_management/urls.py`.
- Frontend route noi bo nam o `frontend/src/App.jsx`.
- Quyen hien/an page nam o `frontend/src/utils/permissions.js`.
- API base URL duoc lay tu `VITE_API_URL` trong `backend/.env` nho `envDir: '../backend'` o Vite.

## 4. Cau Hinh Moi Truong

Project chi nen co mot file env that:

```text
backend/.env
```

File mau:

```text
backend/.env.example
```

File mau chi gom ten bien rong, khong dua secret, password, host production, token, hoac du lieu that len repo.

Backend doc env tai:

```python
load_dotenv(BASE_DIR / ".env")
```

Frontend doc chung file env backend nhờ:

```js
envDir: '../backend'
```

Nhom bien chinh:

- Django: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`.
- Superuser tu dong: `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD`, `DJANGO_SUPERUSER_RESET_PASSWORD`.
- Database: `DB_ENGINE`, `DATABASE_URL`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`.
- Frontend: `VITE_API_URL`.
- AI: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_CHAT_MODEL`.

Thu tu uu tien database trong backend:

1. Neu co `DATABASE_URL`, parse connection string PostgreSQL.
2. Neu `DB_ENGINE=postgres` hoac `postgresql`, doc cac bien `POSTGRES_*`.
3. Neu khong, dung SQLite tai `backend/db.sqlite3`.

## 5. Backend Hoat Dong Nhu The Nao

### 5.1 Request lifecycle

```text
HTTP request
  -> product_management/urls.py
  -> DRF ViewSet/APIView
  -> permission_classes
  -> serializer validation
  -> model/ORM
  -> database
  -> serializer response
  -> JSON response
```

Middleware dang dung:

- `SecurityMiddleware`.
- `WhiteNoiseMiddleware` de serve static files production.
- `product_management.middleware.CORSMiddleware` tu viet de cho phep origin trong `CORS_ALLOWED_ORIGINS`.
- Session/common/csrf/auth/message/clickjacking cua Django.

DRF cau hinh mac dinh:

- JWT authentication.
- Permission mac dinh `IsAuthenticated`.
- Filter backend mac dinh `DjangoFilterBackend`.
- Pagination mac dinh `PageNumberPagination`, `PAGE_SIZE=10`.
- Schema bang drf-spectacular.

### 5.2 URL/API root

File: `backend/product_management/urls.py`

Endpoint chung:

- `GET /api/health/`: health check, public.
- `POST /api/token/`: lay access/refresh token.
- `POST /api/token/refresh/`: refresh access token.
- `GET /api/me/`: thong tin user hien tai.
- `GET /api/schema/`: OpenAPI schema.
- `GET /api/docs/`: Swagger UI.
- `GET /api/redoc/`: ReDoc.

Router CRUD:

- `/api/users/`
- `/api/roles/`
- `/api/permissions/`
- `/api/categories/`
- `/api/products/`
- `/api/suppliers/`
- `/api/warehouses/`
- `/api/warehouse-stocks/`
- `/api/stock-transactions/`
- `/api/stock-transaction-items/`

API them:

- `/api/reports/...`
- `/api/ai/inventory-advice/`
- `/api/ai/chat/`

### 5.3 Xac thuc va phan quyen

Dang nhap:

1. Frontend gui username/password toi `/api/token/`.
2. Backend Simple JWT tra ve `access` va `refresh`.
3. Frontend luu token vao `localStorage`.
4. Moi request sau gan header:

```http
Authorization: Bearer <access_token>
```

Phan quyen backend:

- Cac ViewSet dung `ViewDjangoModelPermissions`.
- Class nay map HTTP method thanh Django model permission:
  - `GET`: `view_model`
  - `POST`: `add_model`
  - `PUT/PATCH`: `change_model`
  - `DELETE`: `delete_model`

Phan quyen frontend:

- File `frontend/src/utils/permissions.js`.
- Moi page co rule `any` hoac `all`.
- Neu user khong co quyen, `App.jsx` hien `PlaceholderPage` "Khong co quyen truy cap".
- Superuser duoc xem tat ca.

### 5.4 Accounts

Module: `backend/accounts/`

Chuc nang:

- Quan ly users.
- Quan ly roles bang Django `Group`.
- Doc danh sach permissions bang Django `Permission`.
- API `/api/me/` tra ve profile user hien tai, groups va permissions.

Lu y nghiep vu:

- User khong duoc xoa chinh minh.
- User thuong khong duoc xoa/update superuser.
- Chi superuser duoc thay doi `is_staff`, `is_superuser`.
- Tao user bat buoc co password.
- Role dang co user thi khong cho xoa.
- Command `ensure_superuser` co the tao superuser tu bien env khi deploy/start container.

### 5.5 Categories

Module: `backend/categories/`

Model `Category`:

- `name`
- `description`
- `parent`: cho phep danh muc cha/con.
- `is_active`
- timestamps.

Validation:

- Ten it nhat 2 ky tu.
- Khong duoc chon chinh no lam parent.
- Khong duoc chon descendant lam parent de tranh vong lap.
- Khong trung ten trong cung mot parent.

Xoa danh muc:

- Neu danh muc con san pham thi API tra `409`.
- Khuyen nghi tat `is_active` hoac chuyen san pham sang danh muc khac.

### 5.6 Suppliers

Module: `backend/suppliers/`

Model `Supplier`:

- `name`, `contact_name`, `phone`, `email`, `address`, `tax_code`, `note`, `is_active`.
- `tax_code` unique neu co.

API:

- CRUD nha phan phoi.
- Search theo ten, contact, phone, email, address, tax_code, note.
- Filter `is_active`.
- Action `/api/suppliers/{id}/products/` tra danh sach san pham cua nha phan phoi.

Xoa supplier:

- Neu dang co san pham lien ket thi tra `409`.

### 5.7 Products

Module: `backend/products/`

Model `Product`:

- `sku`: unique.
- `barcode`: unique, co the null/blank.
- `name`, `description`, `image`.
- `category`: FK, `PROTECT`.
- `supplier`: FK, `PROTECT`, co the null.
- `cost_price`, `selling_price`.
- `quantity`: ton tong cua san pham tren toan he thong.
- `minimum_stock`: nguong canh bao.
- `unit`.
- `status`: `active`, `inactive`, `discontinued`.

Model `ProductImage`:

- `product`: FK toi `Product`, `related_name="images"`.
- `image`: file anh gallery trong `products/gallery/`.
- `alt_text`.
- `is_primary`: anh dai dien.
- `sort_order`: thu tu hien thi.
- `created_at`.

Serializer:

- `category_detail`, `supplier_detail`, `supplier_name` la read-only.
- `images` la danh sach anh gallery read-only.
- Field legacy `price` map sang `selling_price`.
- Response van tra `image`/`thumbnail` la anh dai dien de tuong thich UI cu.
- Khi tao san pham neu khong co `sku`, backend tu sinh dang `PRD-...`.
- `quantity` read-only, chi phieu kho moi cap nhat quantity.
- Upload nhieu anh dung `multipart/form-data` voi field `uploaded_images`, toi da 8 anh, moi anh toi da 5MB.

Filter/search/order:

- Search: `sku`, `barcode`, `name`, `description`.
- Filter: `category`, `supplier`, `status`, `min_price`, `max_price`, `min_quantity`, `max_quantity`, `low_stock`.
- Ordering: `name`, `price/selling_price`, `cost_price`, `quantity`, `minimum_stock`, `created_at`, `updated_at`.

Action them:

- `/api/products/{id}/stock-history/`: lich su dong phieu kho cua san pham.

Xoa san pham:

- Neu san pham da nam trong phieu kho, delete bi `ProtectedError` va API tra `409`.
- Neu khong kinh doanh nua, nen doi `status` thay vi xoa.

### 5.8 Inventory

Module: `backend/inventory/`

Model `Warehouse`:

- Thong tin kho: `name`, `address`, `phone`, `manager_name`, `is_active`.

Model `WarehouseStock`:

- Ton cua mot san pham tai mot kho.
- Unique theo `(warehouse, product)`.

Model `StockTransaction`:

- `warehouse`
- `transaction_type`: `import`, `export`, `adjustment`
- `transaction_code`
- `reason`, `note`
- `created_by`
- timestamps.

Model `StockTransactionItem`:

- Thuoc mot `StockTransaction`.
- `product`, `quantity`, `unit_price`, `total_amount`, `note`.
- Unique theo `(stock_transaction, product)`.
- `save()` tu tinh `total_amount = quantity * unit_price`.

Luong tao phieu kho:

```text
Frontend POST /api/stock-transactions/
  body: warehouse, transaction_type, transaction_code, reason, note, items[]
  -> StockTransactionSerializer.validate_items()
  -> validate export khong vuot ton kho
  -> transaction.atomic()
  -> select_for_update Product va WarehouseStock
  -> tao StockTransaction
  -> tao tung StockTransactionItem
  -> _apply_stock_change()
  -> update WarehouseStock.quantity
  -> update Product.quantity
```

Cach cap nhat ton:

- `import`: tang `WarehouseStock.quantity`, tang `Product.quantity`.
- `export`: giam `WarehouseStock.quantity`, giam `Product.quantity`, khong cho am.
- `adjustment`: set ton kho cua san pham tai kho ve so kiem ke moi; ton tong san pham cong phan chenh lech.

Tinh bat bien:

- Phieu kho khong duoc xoa sau khi tao vi la audit trail.
- Items khong duoc update sau khi phieu da tao.
- Muon sua sai ton kho thi tao phieu dieu chinh.

### 5.9 Reports

Module: `backend/reports/`

Endpoint:

- `/api/reports/inventory/summary/`: tong so san pham, tong ton, gia tri ton theo gia von, so san pham duoi nguong, so kho, so phieu theo loai.
- `/api/reports/inventory/low-stock/`: danh sach san pham `quantity <= minimum_stock`, co missing quantity va gia tri.
- `/api/reports/inventory/value/`: gia tri ton kho theo tong, danh muc, supplier, warehouse.
- `/api/reports/inventory/transactions/`: lich su phieu kho co filter ngay, kho, loai phieu.
- `/api/reports/inventory/imports/`: chi phieu nhap.
- `/api/reports/inventory/exports/`: chi phieu xuat.

Permission:

- Summary can `products.view_product`, `inventory.view_warehouse`, `inventory.view_stocktransaction`.
- Low stock can `products.view_product`.
- Inventory value can `products.view_product`, `inventory.view_warehousestock`.
- Transaction report can `inventory.view_stocktransaction`.

### 5.10 AI Advisor Va Chatbot

Module: `backend/ai_advisor/`

Goi y nhap hang:

- Endpoint: `GET /api/ai/inventory-advice/`.
- Yeu cau quyen: xem san pham va giao dich kho.
- Rule-based luon co the chay.
- Neu co `OPENAI_API_KEY`, backend goi OpenAI de enrich summary/recommendations.
- Neu OpenAI loi, API fallback ve rule-based va them meta fallback.

Logic rule-based:

- Xem du lieu xuat kho 30 ngay gan nhat.
- Tinh average daily export.
- Tinh days remaining neu co toc do xuat.
- De xuat nhap neu:
  - ton hien tai <= minimum_stock,
  - hoac gan nguong,
  - hoac so ngay con lai <= target cover days.
- Priority: `high`, `medium`, `low`.

Chatbot:

- Endpoint: `POST /api/ai/chat/`.
- Yeu cau dang nhap.
- Backend build context theo permission cua user:
  - Neu co quyen xem product: dua summary san pham va top low-stock.
  - Neu co quyen xem warehouse: dua danh sach kho va ton tong.
  - Neu co quyen xem transaction: dua summary va giao dich gan day.
- Chatbot chi doc/tu van, khong tao/sua/xoa du lieu.
- Neu thieu `OPENAI_API_KEY`, tra `503`.

## 6. Frontend Hoat Dong Nhu The Nao

### 6.1 Entry point va routing

Entry:

- `frontend/src/main.jsx` render `<App />`.
- `frontend/src/App.jsx` quan ly:
  - `isLoggedIn`
  - `activePage`
  - `currentUser`
  - `authReady`
  - `stats`

Project khong dung React Router. Thay vao do, sidebar set `activePage`, `App.jsx` switch `pageKey` de render component tuong ung.

Luong render:

```text
main.jsx
  -> App.jsx
    -> neu chua co token: LoginPage
    -> neu da co token:
       GET /api/me/
       -> AppLayout
          -> Sidebar
          -> Topbar
          -> page theo activePage
          -> ChatbotWidget
```

### 6.2 API client

Co hai lop API helper:

1. `frontend/src/services/api.js`
   - Axios instance.
   - `baseURL = import.meta.env.VITE_API_URL`.
   - Request interceptor gan Bearer token.
   - Response interceptor gap `401` thi xoa token va redirect login.

2. `frontend/src/services/authApi.js`
   - Dung `fetch`.
   - Co refresh access token bang `/token/refresh/`.
   - `authFetch`, `authJson`, `fetchPaginated`.
   - Hay dung trong cac CRUD can custom error/multipart.

### 6.3 Login

File: `frontend/src/pages/LoginPage.jsx`

Luong:

1. User nhap username/password.
2. POST `${VITE_API_URL}/token/`.
3. Neu thanh cong, luu:
   - `access_token`
   - `refresh_token`
   - `current_username`
4. Goi `onLogin()`.
5. `App.jsx` fetch `/api/me/` de lay user/groups/permissions.

### 6.4 Layout va menu

File:

- `components/layout/AppLayout.jsx`
- `components/layout/Sidebar.jsx`
- `components/layout/Topbar.jsx`

Sidebar co menu nhom:

- Trang chu.
- Quan ly san pham.
- Quan ly kho hang.
- Nhap/xuat kho.
- Bao cao.
- He thong.

Sidebar loc menu bang `canAccessPage(currentUser, pageKey)`, nen user chi thay menu co quyen.

### 6.5 Product page

File chinh:

- `pages/products/ProductListPage.jsx`
- `pages/products/hooks/useProductListData.js`
- `pages/products/components/ProductForm.jsx`
- `pages/products/components/ProductTable.jsx`
- `pages/products/components/ProductFilters.jsx`
- `pages/products/components/ProductDetailModal.jsx`
- `pages/products/components/ProductDeleteModal.jsx`

Luong load danh sach:

```text
ProductListPage
  -> useProductListData()
    -> GET /products/?page=...&ordering=...
    -> GET /categories/
    -> GET /suppliers/
  -> ProductFilters
  -> ProductTable
```

Tao/sua san pham:

1. User mo modal form.
2. `ProductForm` validate input, anh, gia, danh muc, supplier.
3. `createProductFormData()` build `FormData`.
4. `authJson('/products/', method POST)` hoac `PATCH /products/{id}/`.
5. Backend luu product va gallery `ProductImage` neu co `uploaded_images`.
6. Frontend refresh list va toast success.

Xoa san pham:

- `DELETE /products/{id}/`.
- Neu backend tra `409`, UI hien loi va goi y doi trang thai thay vi xoa.

### 6.6 Category, Supplier, Warehouse pages

Moi page co pattern gan giong nhau:

- Load danh sach tu API.
- Hien table/filter/modal.
- Tao/sua/xoa theo permission.
- Backend chan xoa neu du lieu dang duoc tham chieu.

Module lien quan:

- `pages/categories/CategoryPage.jsx`
- `pages/suppliers/SupplierPage.jsx`
- `pages/warehouses/WarehousePage.jsx`

### 6.7 Stock transaction page

File: `pages/stock-transactions/StockTransactionPage.jsx`

Page nay dung cho 4 mode:

- `import`: tao phieu nhap.
- `export`: tao phieu xuat.
- `adjustment`: tao phieu dieu chinh.
- `all`: xem lich su giao dich kho.

Luong load:

```text
StockTransactionPage
  -> fetchAllPages('/warehouses/')
  -> fetchAllPages('/products/?ordering=name')
  -> fetchAllPages('/stock-transactions/?transaction_type=...')
     hoac /reports/inventory/transactions/
```

Khi chon kho:

- Frontend goi `/warehouses/{id}/stocks/`.
- Neu la phieu xuat, chi cho chon san pham dang co ton trong kho.

Tao phieu:

1. Frontend tao `transaction_code` theo prefix:
   - `NK-...` cho nhap.
   - `XK-...` cho xuat.
   - `DC-...` cho dieu chinh.
2. User chon kho, san pham, so luong, don gia, ly do.
3. Frontend POST `/stock-transactions/`.
4. Backend validate va cap nhat stock trong transaction atomic.
5. Frontend refresh lich su va co the mo phieu HTML de in/luu PDF.

Tinh nang xuat file:

- Xuat lich su giao dich dang xem ra CSV.
- Xuat mot giao dich thanh HTML voucher de in hoac luu PDF bang print dialog.

### 6.8 Dashboard va reports

Hooks:

- `useDashboardData`
- `useInventoryOverviewData`
- `useLowStockReport`
- `useInventoryValueReport`

Pages:

- `HomePage.jsx`
- `reports/InventoryOverviewPage.jsx`
- `reports/LowStockReportPage.jsx`
- `reports/InventoryValueReportPage.jsx`

Luong du lieu:

- Dashboard goi summary/report API neu user co quyen.
- Mot so chart/view transform o `utils/reportTransforms.js`.
- Format tien, so, ngay gio o `utils/formatters.js`.
- Pagination helper o `utils/apiPagination.js` gom toan bo page neu can ve day du data.

### 6.9 User va role management

Pages:

- `pages/system/UserManagementPage.jsx`
- `pages/system/RoleManagementPage.jsx`

API:

- `/api/users/`
- `/api/roles/`
- `/api/permissions/`

Muc dich:

- Tao/sua user.
- Gan user vao group.
- Tao/sua group.
- Gan permission vao group.

Quyen tren frontend:

- `system-users`: can `auth.view_user` va `auth.view_group`.
- `system-roles`: can `auth.view_group` va `auth.view_permission`.

### 6.10 Chatbot

File: `components/chat/ChatbotWidget.jsx`

Luong:

1. Widget nam trong `AppLayout`, hien nut `AI`.
2. User gui cau hoi.
3. Frontend POST `/ai/chat/` voi:
   - `message`
   - `history` toi da 10 message gan nhat.
4. Backend build context theo quyen user.
5. OpenAI tra reply.
6. UI append reply vao conversation.

Neu OpenAI chua cau hinh, UI hien loi tu backend.

## 7. Luong Chuc Nang Tieu Bieu

### 7.1 Dang nhap va vao dashboard

```text
LoginPage
  -> POST /api/token/
  -> save token
  -> App.handleLogin()
  -> GET /api/me/
  -> currentUser.permissions
  -> Sidebar loc menu
  -> HomePage load dashboard theo quyen
```

### 7.2 Them san pham moi

```text
ProductListPage
  -> ProductFormModal
  -> ProductForm validate
  -> FormData uploaded_images[] + fields
  -> POST /api/products/
  -> ProductSerializer validate
  -> auto SKU neu thieu
  -> save Product
  -> save ProductImage gallery neu co file upload
  -> frontend refresh products
```

### 7.3 Nhap kho

```text
StockTransactionPage(import)
  -> load warehouses/products
  -> user nhap lines
  -> POST /api/stock-transactions/
  -> validate active warehouse/product
  -> transaction.atomic()
  -> create transaction/items
  -> IMPORT: tang WarehouseStock va Product.quantity
  -> response transaction
  -> frontend refresh + co the in phieu
```

### 7.4 Xuat kho

```text
StockTransactionPage(export)
  -> load warehouse stocks
  -> UI chi hien san pham con ton tai kho
  -> POST /api/stock-transactions/
  -> backend check ton kho du
  -> EXPORT: giam WarehouseStock va Product.quantity
  -> neu thieu ton: 400 validation error
```

### 7.5 Dieu chinh kho

```text
StockTransactionPage(adjustment)
  -> user nhap so luong kiem ke moi
  -> POST /api/stock-transactions/
  -> ADJUSTMENT:
       previous = WarehouseStock.quantity
       WarehouseStock.quantity = quantity moi
       Product.quantity += quantity moi - previous
```

### 7.6 Bao cao san pham sap het hang

```text
LowStockReportPage
  -> GET /api/reports/inventory/low-stock/
  -> backend filter Product.quantity <= Product.minimum_stock
  -> annotate missing_quantity va stock value
  -> frontend transform thanh cards/charts/table
```

### 7.7 Goi y AI nhap hang

```text
InventoryOverviewPage
  -> GET /api/ai/inventory-advice/
  -> backend lay export stats 30 ngay
  -> tinh average daily export, days remaining, suggested quantity
  -> neu co OPENAI_API_KEY: enrich bang OpenAI
  -> frontend hien summary/recommendations
```

## 8. Database Va Quan He Chinh

```text
Category 1 --- n Product
Supplier 1 --- n Product
Warehouse 1 --- n WarehouseStock
Product 1 --- n WarehouseStock
Warehouse 1 --- n StockTransaction
StockTransaction 1 --- n StockTransactionItem
Product 1 --- n StockTransactionItem
User 1 --- n StockTransaction
Group n --- n Permission
User n --- n Group
```

Bang quan trong:

- `products`
- `categories`
- `suppliers`
- `warehouses`
- `warehouse_stocks`
- `stock_transactions`
- `stock_transaction_items`
- Django auth tables: user, group, permission.

Ton kho duoc luu o hai muc:

- `Product.quantity`: tong ton cua san pham tren tat ca kho.
- `WarehouseStock.quantity`: ton cua san pham trong tung kho.

Hai so nay duoc dong bo khi tao phieu kho. Vi vay khong nen sua truc tiep `quantity` bang admin/database tru khi biet ro hau qua.

## 9. Chay Project Local

### 9.1 Chuan bi env

```bash
cp backend/.env.example backend/.env
```

Dien gia tri that vao `backend/.env`.

Neu chay nhanh bang SQLite:

```env
DB_ENGINE=sqlite
```

Neu chay Docker Compose/PostgreSQL:

```env
DB_ENGINE=postgres
POSTGRES_DB=...
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

Frontend can:

```env
VITE_API_URL=...
```

### 9.2 Docker

```bash
docker compose up --build -d
```

Docker Compose:

- Doc env tu `backend/.env`.
- Chay PostgreSQL.
- Build backend image.
- Backend entrypoint wait DB, migrate, ensure superuser, collectstatic, start Gunicorn.

Frontend chay rieng:

```bash
cd frontend
npm install
npm run dev
```

### 9.3 Thu cong

Backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## 10. Deploy Render

File: `render.yaml`

Render tao:

- PostgreSQL database.
- Python web service backend.
- Static site frontend.

Backend:

- `rootDir: backend`
- `buildCommand: ./build.sh`
- `startCommand: python manage.py migrate --noinput && python manage.py ensure_superuser && gunicorn product_management.wsgi:application --bind 0.0.0.0:$PORT ...`
- Migration duoc dat trong `startCommand` de dung duoc voi Render free tier, vi free tier khong ho tro pre-deploy command.
- `PYTHON_VERSION=3.12.11`
- `DATABASE_URL` lay tu Render Postgres.
- `DJANGO_MEDIA_ROOT` co the tro toi Render Persistent Disk de giu anh upload.

Frontend:

- `rootDir: frontend`
- `buildCommand: npm ci && npm run build`
- `staticPublishPath: dist`
- Rewrite `/*` ve `/index.html`.

Can cap nhat sau khi co domain that:

- Backend `CORS_ALLOWED_ORIGINS`.
- Frontend `VITE_API_URL`.

Media upload tren Render:

- Backend expose `/media/` ca khi `DJANGO_DEBUG=False` de anh upload hien thi duoc.
- Filesystem mac dinh cua Render la tam thoi, nen anh co the mat sau restart/redeploy neu khong gan Persistent Disk.
- Nen mount disk vao `/opt/render/project/src/backend/media` va set `DJANGO_MEDIA_ROOT=/opt/render/project/src/backend/media`.

## 11. Testing Va Chat Luong

Backend co test cho:

- accounts
- ai_advisor
- categories
- products
- suppliers
- inventory
- reports

Chay test:

```bash
cd backend
DB_ENGINE=sqlite python manage.py test
```

Check backend:

```bash
cd backend
python manage.py check
```

Build frontend:

```bash
cd frontend
npm run build
```

CI GitHub Actions:

- Backend test voi PostgreSQL.
- Frontend build bang npm.

## 12. Cac Diem Can Chu Y Khi Sua Code

- Khong update truc tiep `Product.quantity` trong CRUD san pham; dung phieu kho.
- Khong cho update items cua phieu kho sau khi tao; tao phieu dieu chinh neu sai.
- Khi them endpoint moi, nho gan permission backend va rule frontend neu la page moi.
- Khi them field model:
  - update model,
  - tao migration,
  - update serializer,
  - update frontend form/table neu can,
  - update test.
- File env that la `backend/.env`, khong tao them `.env` o root/frontend.
- `backend/.env.example` chi nen co key rong.
- Cac file image upload nam trong `backend/media/` local hoac `DJANGO_MEDIA_ROOT` production va khong commit.
- `frontend/dist/`, `node_modules/`, `backend/staticfiles/`, cache Python khong commit.

## 13. Ban Do File Nhanh

Backend:

- Settings: `backend/product_management/settings.py`
- URL root: `backend/product_management/urls.py`
- CORS middleware: `backend/product_management/middleware.py`
- User/role/permission: `backend/accounts/`
- Product: `backend/products/`
- Category: `backend/categories/`
- Supplier: `backend/suppliers/`
- Warehouse/stock transaction: `backend/inventory/`
- Reports: `backend/reports/`
- AI/chatbot: `backend/ai_advisor/`

Frontend:

- App root/page switch: `frontend/src/App.jsx`
- API Axios: `frontend/src/services/api.js`
- API fetch auth helper: `frontend/src/services/authApi.js`
- Permission rules: `frontend/src/utils/permissions.js`
- Layout: `frontend/src/components/layout/`
- Chatbot: `frontend/src/components/chat/`
- Product page: `frontend/src/pages/products/`
- Stock transaction page: `frontend/src/pages/stock-transactions/`
- Reports: `frontend/src/pages/reports/`
- System admin pages: `frontend/src/pages/system/`

## 14. Cach Doc Code Khi Debug

Neu loi API:

1. Xem frontend page goi endpoint nao.
2. Xem `services/api.js` hoac `services/authApi.js` de biet token/header.
3. Xem route trong `backend/product_management/urls.py`.
4. Xem ViewSet/APIView tuong ung.
5. Xem serializer validation.
6. Xem model constraint/protect/unique.
7. Xem response status va message frontend hien thi.

Neu sai ton kho:

1. Xem `StockTransaction` vua tao.
2. Xem `StockTransactionItem`.
3. Xem `_apply_stock_change()` trong `backend/inventory/serializers.py`.
4. Doi chieu `Product.quantity` voi tong `WarehouseStock.quantity`.
5. Neu can sua nghiep vu, tao phieu dieu chinh thay vi sua DB truc tiep.

Neu user khong thay menu:

1. Goi `/api/me/` xem `permissions`.
2. Xem rule trong `frontend/src/utils/permissions.js`.
3. Xem group/role cua user trong `/api/roles/`.
4. Xem backend permission cua endpoint tuong ung.

Neu chatbot/AI loi:

1. Kiem tra `OPENAI_API_KEY`.
2. Kiem tra user da dang nhap.
3. Kiem tra permission voi inventory advice.
4. Xem response `503` va `reason`.
