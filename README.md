# Product Management System

Hệ thống Quản lý Sản phẩm sử dụng React, Django REST Framework, PostgreSQL và Docker.

Dự án hiện tập trung vào backend API quản lý sản phẩm/danh mục, xác thực JWT, PostgreSQL chạy bằng Docker Compose và bộ tài liệu triển khai cho nhóm.

## Công nghệ sử dụng

- Frontend: React, Vite.
- Backend: Django 4.2, Django REST Framework.
- Authentication: JWT với `djangorestframework-simplejwt`.
- Database: PostgreSQL trong Docker, SQLite tùy chọn cho local dev.
- DevOps: Docker, Docker Compose, GitHub Actions.
- Testing: Django test framework, DRF API test client.

## Cấu trúc thư mục

```text
product-management-system/
├── backend/
│   ├── categories/
│   ├── products/
│   ├── product_management/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── 01-phan-tich/
│   ├── 02-tong-quan/
│   ├── 03-database/
│   ├── 04-api/
│   ├── 05-huong-dan/
│   ├── 06-deployment/
│   ├── 07-algorithms/
│   └── CHANGELOG.md
├── docker-compose.yml
├── .env.example
└── README.md
```

## Trạng thái hiện tại

Đã hoàn thiện mức cơ bản:

- CRUD API cho Product.
- CRUD API cho Category.
- JWT authentication cho API.
- Search, filter, ordering và pagination cơ bản cho Product API.
- PostgreSQL chạy bằng Docker Compose.
- Backend container tự chạy migration khi khởi động.
- GitHub Actions CI chạy backend test với PostgreSQL và build frontend.
- Test backend cho Product/Category API.
- Tài liệu database, API, hướng dẫn chạy, deployment và kế hoạch dự án.

Chưa hoàn thiện:

- Frontend React đầy đủ.
- Frontend service trong Docker Compose.
- Filter nâng cao theo khoảng giá và tồn kho.
- Validation nghiệp vụ cho `price` và `quantity`.
- Postman collection export.

## Cấu hình môi trường

Dự án dùng chung một file `.env` ở thư mục gốc. Không đặt `.env` riêng trong `backend` hoặc `frontend`.

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Ví dụ cấu hình khi chạy Docker Compose với PostgreSQL:

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,backend

DB_ENGINE=postgres
POSTGRES_DB=product_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_HOST_PORT=5432

VITE_API_URL=http://localhost:8000/api
```

Ghi chú:

- `POSTGRES_HOST=db` dùng khi backend chạy trong Docker.
- Nếu chạy Django trực tiếp trên máy và kết nối PostgreSQL publish ra host, dùng `POSTGRES_HOST=localhost`.
- File `.env` thật không được commit lên GitHub.

## Chạy bằng Docker Compose

Chạy từ thư mục gốc dự án:

```bash
docker compose up --build -d
```

Trên Windows cũng chạy lệnh này từ thư mục gốc, nơi có file `docker-compose.yml`, không chạy trong thư mục `backend`.

Nếu backend báo lỗi `exec /app/entrypoint.sh: no such file or directory`, rebuild không dùng cache:

```bash
docker compose build --no-cache backend
docker compose up -d
```

Lỗi này thường do file `.sh` bị chuyển line ending sang CRLF trên Windows. Dự án đã cấu hình `.gitattributes` và Dockerfile để tự xử lý LF/CRLF.

Kiểm tra container:

```bash
docker compose ps
```

Xem log backend:

```bash
docker compose logs backend -f
```

Backend chạy tại:

```text
http://127.0.0.1:8000
```

PostgreSQL được publish ra máy host tại:

```text
localhost:5432
```

Tắt container:

```bash
docker compose down
```

Tắt container và xóa dữ liệu PostgreSQL local:

```bash
docker compose down -v
```

## Migration

Backend container tự chạy migration trong `backend/entrypoint.sh`.

Nếu cần chạy thủ công:

```bash
docker compose exec backend python manage.py migrate
```

## Tạo user để test JWT

```bash
docker compose exec backend python manage.py createsuperuser
```

Sau đó lấy token bằng:

```http
POST http://127.0.0.1:8000/api/token/
```

Body:

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

Response sẽ có `access` và `refresh`.

Khi gọi API cần đăng nhập, thêm header:

```http
Authorization: Bearer access_token
```

## API chính

### Health Check

```http
GET /api/health/
```

Response:

```json
{
  "status": "ok"
}
```

### Authentication

```http
POST /api/token/
POST /api/token/refresh/
```

### Categories

```http
GET    /api/categories/
POST   /api/categories/
GET    /api/categories/{id}/
PATCH  /api/categories/{id}/
DELETE /api/categories/{id}/
```

### Products

```http
GET    /api/products/
POST   /api/products/
GET    /api/products/{id}/
PATCH  /api/products/{id}/
DELETE /api/products/{id}/
```

Search/filter/ordering:

```http
GET /api/products/?search=keyboard
GET /api/products/?category=1
GET /api/products/?ordering=price
GET /api/products/?ordering=-created_at
```

## Chạy test

Chạy test trong Docker với PostgreSQL:

```bash
docker compose exec backend python manage.py test
```

Chạy test local bằng SQLite:

```bash
cd backend
DB_ENGINE=sqlite ./venv/bin/python manage.py test
```

Kết quả kiểm tra gần nhất:

```text
5 tests OK
```

## CI bằng GitHub Actions

Workflow CI nằm tại:

```text
.github/workflows/ci.yml
```

CI tự chạy khi:

- Push lên `main`, `dev` hoặc các nhánh `feature/**`.
- Tạo hoặc cập nhật Pull Request vào `dev` hoặc `main`.

Các job hiện có:

- `backend-tests`: cài Python dependencies, chạy Django check, chạy migration và test backend với PostgreSQL service.
- `frontend-build`: cài frontend dependencies bằng `npm ci` và chạy `npm run build`.

Kiểm tra local tương đương trước khi push:

```bash
docker compose up --build -d
docker compose exec backend python manage.py test
cd frontend
npm ci
npm run build
```

## Quy trình Git đề xuất

- `main`: nhánh ổn định.
- `dev`: nhánh tích hợp chung.
- `feature/products-api`: backend Product/Category API.
- `feature/auth-api`: auth, filter nâng cao, test API.
- `feature/frontend-ui`: layout và product list.
- `feature/frontend-crud`: login UI và CRUD UI.
- `feature/devops`: Docker, PostgreSQL, CI/CD.

Quy trình:

```bash
git checkout feature/ten-nhiem-vu
git pull origin feature/ten-nhiem-vu
git add .
git commit -m "Mo ta cong viec"
git push origin feature/ten-nhiem-vu
```

Sau khi hoàn thiện, tạo Pull Request:

```text
feature/... -> dev
```

Không merge trực tiếp vào `main`.

## Tài liệu

- Mục lục tài liệu: `docs/muc-luc-tai-lieu.md`
- Kế hoạch và trạng thái dự án: `docs/01-phan-tich/ke-hoach-trang-thai-du-an.md`
- Phân công thành viên: `docs/01-phan-tich/phan-cong-thanh-vien.md`
- Thiết kế database: `docs/03-database/thiet-ke-database.md`
- Tài liệu API: `docs/04-api/tai-lieu-api.md`
- Hướng dẫn sử dụng: `docs/05-huong-dan/huong-dan-su-dung.md`
- Deployment Docker/PostgreSQL: `docs/06-deployment/trien-khai-docker-postgresql.md`
- Changelog: `docs/CHANGELOG.md`
