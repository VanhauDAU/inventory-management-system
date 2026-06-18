# Product Management System

Hệ thống quản lý sản phẩm và tồn kho được xây dựng theo mô hình frontend/backend tách biệt. Dự án hỗ trợ quản lý sản phẩm, danh mục, nhà cung cấp, kho hàng, phiếu nhập/xuất/điều chỉnh, người dùng, phân quyền, báo cáo tồn kho và gợi ý nhập hàng.

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Chạy dự án với Docker](#chạy-dự-án-với-docker)
- [Chạy dự án thủ công](#chạy-dự-án-thủ-công)
- [Tài khoản và xác thực](#tài-khoản-và-xác-thực)
- [API chính](#api-chính)
- [Kiểm thử và CI](#kiểm-thử-và-ci)
- [Tài liệu dự án](#tài-liệu-dự-án)

## Tính năng chính

### Quản lý nghiệp vụ

- Quản lý sản phẩm, SKU, barcode, hình ảnh, giá nhập, giá bán và trạng thái.
- Quản lý danh mục nhiều cấp và nhà cung cấp.
- Quản lý kho và số lượng tồn của từng sản phẩm theo kho.
- Tạo phiếu nhập, xuất và điều chỉnh kho.
- Tự động cập nhật tồn kho tổng và tồn kho theo từng kho khi tạo giao dịch.
- Tra cứu lịch sử nhập/xuất của sản phẩm.
- Tìm kiếm, lọc, sắp xếp và phân trang dữ liệu.
- Cảnh báo sản phẩm có tồn kho thấp.

### Người dùng và phân quyền

- Đăng nhập bằng JSON Web Token (JWT).
- Quản lý người dùng, vai trò và quyền.
- Phân quyền API theo Django model permissions.
- Ẩn hoặc hiện chức năng trên frontend theo quyền của người dùng.

### Báo cáo và phân tích

- Tổng quan số lượng sản phẩm, kho và giao dịch.
- Báo cáo nhập kho, xuất kho và biến động kho.
- Báo cáo sản phẩm sắp hết hàng.
- Báo cáo giá trị tồn kho theo sản phẩm, danh mục, nhà cung cấp và kho.
- Gợi ý nhập hàng dựa trên ngưỡng tồn kho và tốc độ xuất trong 30 ngày gần nhất.
- Tùy chọn dùng OpenAI API để bổ sung phân tích; hệ thống tự chuyển về thuật toán rule-based nếu không cấu hình API key hoặc khi API gặp lỗi.
- Chatbot ProductMS hỗ trợ hỏi đáp về sản phẩm, tồn kho và giao dịch theo quyền của người dùng.

### Giao diện

- Trang đăng nhập và lưu JWT trong `localStorage`.
- Dashboard tổng quan.
- Màn hình quản lý sản phẩm, danh mục, nhà cung cấp và kho.
- Màn hình lập và tra cứu phiếu nhập/xuất/điều chỉnh.
- Màn hình báo cáo tồn kho và quản trị hệ thống.
- Trạng thái loading, empty, error và phân trang.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 18, React DOM, JavaScript (ES Modules), HTML5, CSS3 |
| Công cụ frontend | Vite 5, `@vitejs/plugin-react` |
| Gọi API | Axios |
| Backend | Python 3.12, Django 4.2 |
| REST API | Django REST Framework 3.16 |
| Xác thực | Simple JWT, PyJWT |
| Phân quyền | Django Authentication, Group, Permission và model permissions |
| Filter API | `django-filter` |
| API documentation | OpenAPI 3, drf-spectacular, Swagger UI, ReDoc |
| Database | PostgreSQL 16; SQLite có thể dùng khi phát triển local |
| Xử lý ảnh | Pillow |
| AI Advisor | OpenAI Responses API, kết hợp thuật toán rule-based |
| Cấu hình | `python-dotenv`, biến môi trường |
| Container | Docker, Docker Compose |
| CI | GitHub Actions |
| Kiểm thử | Django test framework, DRF APIClient |

## Kiến trúc hệ thống

```text
React/Vite (http://localhost:3000)
              |
              | HTTP + JWT
              v
Django REST API (http://localhost:8000)
              |
              v
PostgreSQL 16 / SQLite
              |
              +---- OpenAI Responses API (tùy chọn)
```

Frontend và backend là hai ứng dụng độc lập. Docker Compose hiện khởi chạy PostgreSQL và Django backend; frontend được chạy riêng bằng Vite.

## Cấu trúc thư mục

```text
product-management-system/
├── backend/
│   ├── accounts/              # Người dùng, vai trò và phân quyền
│   ├── ai_advisor/            # Gợi ý nhập hàng và tích hợp OpenAI
│   ├── categories/            # Danh mục sản phẩm
│   ├── inventory/             # Kho, tồn kho và giao dịch kho
│   ├── product_management/    # Cấu hình Django
│   ├── products/              # Sản phẩm
│   ├── reports/               # Báo cáo tồn kho
│   ├── suppliers/             # Nhà cung cấp
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── docs/                      # Phân tích, thiết kế, API và triển khai
├── .github/workflows/ci.yml
├── .env.example
├── docker-compose.yml
└── README.md
```

## Yêu cầu môi trường

Chọn một trong hai cách chạy:

- Docker Desktop hoặc Docker Engine có Docker Compose.
- Chạy thủ công với Python 3.12+, Node.js 20+, npm và PostgreSQL 16+; có thể dùng SQLite thay PostgreSQL.

## Chạy dự án với Docker

### 1. Tạo cấu hình backend và database

Tại thư mục gốc:

```bash
cp .env.example .env
```

Cập nhật các giá trị quan trọng trong `.env`:

```env
DJANGO_SECRET_KEY=replace-with-a-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_SUPERUSER_USERNAME=
DJANGO_SUPERUSER_EMAIL=
DJANGO_SUPERUSER_PASSWORD=
DJANGO_SUPERUSER_RESET_PASSWORD=False

DB_ENGINE=postgres
POSTGRES_DB=product_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_HOST_PORT=5432

OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
OPENAI_CHAT_MODEL=gpt-5.2
```

`POSTGRES_HOST=db` là hostname dùng bên trong Docker Compose. Không commit file `.env` chứa thông tin thật.

### 2. Khởi chạy PostgreSQL và backend

```bash
docker compose up --build -d
```

Backend tự chờ PostgreSQL sẵn sàng và chạy migration khi container khởi động.
Nếu các biến `DJANGO_SUPERUSER_*` được cấu hình, backend cũng tự tạo tài
khoản quản trị trong lần khởi động đầu tiên.

Kiểm tra trạng thái và log:

```bash
docker compose ps
docker compose logs -f backend
```

### 3. Khởi chạy frontend

Vite đọc biến môi trường từ thư mục `frontend`, vì vậy cần tạo file riêng:

```bash
cp frontend/.env.example frontend/.env
cd frontend
npm install
npm run dev
```

Nội dung mặc định của `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Nếu cài mới và Vite báo không tìm thấy module `axios`, cài dependency đang được frontend sử dụng:

```bash
npm install axios
```

### 4. Truy cập ứng dụng

| Dịch vụ | Địa chỉ |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |
| Swagger UI | http://localhost:8000/api/docs/ |
| ReDoc | http://localhost:8000/api/redoc/ |
| PostgreSQL từ máy host | `localhost:5432` |

### 5. Dừng dịch vụ

```bash
docker compose down
```

Xóa cả dữ liệu PostgreSQL và media đang lưu trong Docker volumes:

```bash
docker compose down -v
```

## Chạy dự án thủ công

### Backend với SQLite

```bash
cp .env.example .env
```

Đổi cấu hình database trong `.env`:

```env
DB_ENGINE=sqlite
```

Tạo môi trường Python và chạy server:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Trên Windows, kích hoạt virtual environment bằng:

```powershell
venv\Scripts\activate
```

### Backend với PostgreSQL trên máy host

Giữ `DB_ENGINE=postgres`, tạo database tương ứng và đặt:

```env
POSTGRES_HOST=localhost
```

Sau đó chạy migration và server như hướng dẫn phía trên.

### Frontend

```bash
cp frontend/.env.example frontend/.env
cd frontend
npm install
npm run dev
```

Build bản production:

```bash
npm run build
npm run preview
```

## Tài khoản và xác thực

Tạo tài khoản quản trị:

```bash
docker compose exec backend python manage.py createsuperuser
```

Hoặc khi chạy backend thủ công:

```bash
cd backend
python manage.py createsuperuser
```

Lấy JWT:

```http
POST /api/token/
Content-Type: application/json
```

```json
{
  "username": "admin",
  "password": "your_password"
}
```

Gửi access token trong các request cần đăng nhập:

```http
Authorization: Bearer <access_token>
```

Làm mới token:

```http
POST /api/token/refresh/
```

## API chính

| Nhóm | Endpoint |
| --- | --- |
| Health check | `GET /api/health/` |
| JWT | `POST /api/token/`, `POST /api/token/refresh/` |
| Người dùng hiện tại | `GET /api/me/` |
| Người dùng | `/api/users/` |
| Vai trò | `/api/roles/` |
| Quyền | `/api/permissions/` |
| Danh mục | `/api/categories/` |
| Sản phẩm | `/api/products/` |
| Nhà cung cấp | `/api/suppliers/` |
| Kho | `/api/warehouses/` |
| Tồn kho theo kho | `/api/warehouse-stocks/` |
| Phiếu kho | `/api/stock-transactions/` |
| Chi tiết phiếu kho | `/api/stock-transaction-items/` |
| Báo cáo | `/api/reports/` |
| Gợi ý nhập hàng | `GET /api/ai/inventory-advice/` |
| Chatbot | `POST /api/ai/chat/` |
| OpenAPI schema | `GET /api/schema/` |

Các resource dùng router hỗ trợ thao tác REST tiêu chuẩn tùy theo quyền:

```http
GET    /api/products/
POST   /api/products/
GET    /api/products/{id}/
PUT    /api/products/{id}/
PATCH  /api/products/{id}/
DELETE /api/products/{id}/
```

Ví dụ tìm kiếm và lọc sản phẩm:

```http
GET /api/products/?search=keyboard
GET /api/products/?category=1&supplier=2&status=active
GET /api/products/?min_price=100000&max_price=500000
GET /api/products/?min_quantity=1&max_quantity=20
GET /api/products/?low_stock=true
GET /api/products/?ordering=-selling_price
```

API danh sách được phân trang mặc định 10 bản ghi:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": []
}
```

Chi tiết request, response và schema mới nhất được cung cấp trực tiếp tại Swagger UI: http://localhost:8000/api/docs/

## Kiểm thử và CI

Dự án hiện có test cho accounts, AI advisor, categories, products, suppliers, inventory và reports.

Chạy toàn bộ backend test trong Docker:

```bash
docker compose exec backend python manage.py test
```

Chạy backend test bằng SQLite:

```bash
cd backend
DB_ENGINE=sqlite python manage.py test
```

Kiểm tra Django và build frontend:

```bash
cd backend
python manage.py check

cd ../frontend
npm run build
```

GitHub Actions tự động:

- Chạy Django check, migration và backend test với PostgreSQL 16.
- Cài dependency bằng `npm ci` và build frontend.
- Kích hoạt khi push lên `main`, `dev`, `feature/**` hoặc tạo pull request vào `dev`/`main`.

## Tài liệu dự án

- [Mục lục tài liệu](docs/muc-luc-tai-lieu.md)
- [Phân tích yêu cầu](docs/01-phan-tich/phan-tich-yeu-cau.md)
- [Tổng quan hệ thống](docs/02-tong-quan/tong-quan-he-thong.md)
- [Thiết kế database](docs/03-database/thiet-ke-database.md)
- [Tài liệu API](docs/04-api/tai-lieu-api.md)
- [Hướng dẫn sử dụng](docs/05-huong-dan/huong-dan-su-dung.md)
- [Triển khai Docker và PostgreSQL](docs/06-deployment/trien-khai-docker-postgresql.md)
- [Search, filter và pagination](docs/07-algorithms/search-filter-pagination.md)
- [Thiết kế frontend](docs/08-frontend/thiet-ke-giao-dien-sidebar.md)
- [Changelog](docs/CHANGELOG.md)
