# 05 - Hướng dẫn

<<<<<<< HEAD
## Cấu hình môi trường

Dự án dùng chung một file `.env` ở thư mục gốc thay vì đặt riêng trong `backend` hoặc `frontend`.

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Frontend dùng biến có prefix `VITE_`, ví dụ:

```env
VITE_API_URL=http://localhost:8000/api
```

Backend dùng các biến `DJANGO_*`, `DB_ENGINE` và `POSTGRES_*`.

Khi chạy bằng Docker Compose với PostgreSQL, dùng:

```env
DB_ENGINE=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

Khi chạy Django trực tiếp trên máy và muốn dùng SQLite tạm thời, dùng:

```env
DB_ENGINE=sqlite
```

=======
>>>>>>> feature/frontend-crud
## Chạy backend

```bash
cd backend
./venv/bin/python manage.py runserver
```

Backend chạy tại:

```text
http://127.0.0.1:8000
```

<<<<<<< HEAD
## Chạy backend bằng Docker Compose và PostgreSQL

Chạy từ thư mục gốc dự án:

```bash
docker compose up --build
```

Backend chạy tại:

```text
http://127.0.0.1:8000
```

PostgreSQL trong Docker chạy ở service `db`. Dữ liệu được lưu trong volume `postgres_data`.

Tạo superuser trong container backend:

```bash
docker compose exec backend python manage.py createsuperuser
```

Chạy test backend trong container:

```bash
docker compose exec backend python manage.py test
```

Tắt container:

```bash
docker compose down
```

Tắt container và xóa dữ liệu PostgreSQL local:

```bash
docker compose down -v
```

=======
>>>>>>> feature/frontend-crud
## Chạy migration

```bash
cd backend
./venv/bin/python manage.py migrate
```

## Tạo tài khoản admin/user

```bash
cd backend
./venv/bin/python manage.py createsuperuser
```

## Test API bằng Postman

### Bước 1: Lấy JWT token

Method:

```text
POST
```

URL:

```text
http://127.0.0.1:8000/api/token/
```

Body chọn `raw` và `JSON`:

```json
{
  "username": "levanhau",
  "password": "12345678"
}
```

Copy giá trị `access` trong response.

### Bước 2: Gọi API có đăng nhập

Trong Postman, mở tab `Authorization`:

```text
Type: Bearer Token
Token: access_token
```

Hoặc thêm header:

```text
Authorization: Bearer access_token
```

### Bước 3: Test category

```http
GET http://127.0.0.1:8000/api/categories/
POST http://127.0.0.1:8000/api/categories/
PATCH http://127.0.0.1:8000/api/categories/1/
DELETE http://127.0.0.1:8000/api/categories/1/
```

### Bước 4: Test product

```http
GET http://127.0.0.1:8000/api/products/
POST http://127.0.0.1:8000/api/products/
PATCH http://127.0.0.1:8000/api/products/1/
DELETE http://127.0.0.1:8000/api/products/1/
```

## Chạy test backend

```bash
cd backend
./venv/bin/python manage.py test
```
