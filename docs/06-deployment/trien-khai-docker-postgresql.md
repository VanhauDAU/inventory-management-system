# 06 - Deployment

## Trạng thái hiện tại

Phần backend CRUD đang chạy được trong môi trường dev với SQLite. Backend đã có thể đọc cấu hình từ file `.env` ở thư mục gốc dự án.

Theo yêu cầu dự án, môi trường triển khai cần:

- Docker.
- PostgreSQL.
- Biến môi trường cho database và secret key.
- GitHub Actions để kiểm tra test tự động.

## Việc cần phối hợp với nhánh DevOps

- Tạo `Dockerfile` cho backend.
- Tạo `docker-compose.yml` gồm backend, frontend và PostgreSQL.
- Đọc database config từ file `.env` dùng chung ở thư mục gốc.
- Không hardcode `SECRET_KEY`, `DEBUG`, database username/password trong source code.
- Chạy migration khi container backend khởi động.

## Biến môi trường đề xuất

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DB_ENGINE=postgresql
POSTGRES_DB=product_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
VITE_API_URL=http://localhost:8000/api
```

## Kiểm tra trước khi merge

```bash
cd backend
./venv/bin/python manage.py test
```
