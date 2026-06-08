# 06 - Deployment

## Trạng thái hiện tại

Dự án đã có cấu hình Docker cho backend Django và PostgreSQL.

Khi chạy bằng Docker Compose:

- Service `db` chạy PostgreSQL.
- Service `backend` chạy Django REST Framework.
- Backend đọc database config từ file `.env`.
- Backend tự chạy `python manage.py migrate` khi container khởi động.

Frontend và GitHub Actions chưa được cấu hình trong phạm vi hiện tại.

- Tạo `Dockerfile` cho backend.
- Tạo `docker-compose.yml` gồm backend, frontend và PostgreSQL.
- Đọc database config từ file `.env` dùng chung ở thư mục gốc.
- Không hardcode `SECRET_KEY`, `DEBUG`, database username/password trong source code.
- Chạy migration khi container backend khởi động.

- `docker-compose.yml`
- `.env.example`
- `backend/Dockerfile`
- `backend/entrypoint.sh`
- `backend/product_management/settings.py`

## Tạo file môi trường

Docker Compose đã có giá trị mặc định để chạy môi trường dev. Tuy nhiên nên tạo file `.env` từ file mẫu để đổi secret key, password database hoặc port PostgreSQL khi cần.

Copy file mẫu:

```bash
cp .env.example .env
```

Trên Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Nội dung chính:

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

Nếu muốn xóa luôn dữ liệu PostgreSQL local:

```bash
docker compose down -v
```
