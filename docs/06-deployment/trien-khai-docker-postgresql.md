# 06 - Deployment

## Trạng thái hiện tại

Dự án đã có cấu hình Docker cho backend Django và PostgreSQL.

Khi chạy bằng Docker Compose:

- Service `db` chạy PostgreSQL.
- Service `backend` chạy Django REST Framework.
- Backend đọc database config từ file `.env`.
- Backend tự chạy `python manage.py migrate` khi container khởi động.

Frontend và GitHub Actions chưa được cấu hình trong phạm vi hiện tại.

## File cấu hình liên quan

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
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend

DB_ENGINE=postgres
POSTGRES_DB=product_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_HOST_PORT=5432
```

## Chạy backend với PostgreSQL bằng Docker

Tại thư mục gốc dự án:

```bash
docker compose up --build
```

Backend chạy tại:

```text
http://127.0.0.1:8000
```

PostgreSQL chạy trong container `product_management_db`.

## Chạy migration thủ công nếu cần

Thông thường migration đã chạy tự động khi backend khởi động. Nếu cần chạy lại:

```bash
docker compose exec backend python manage.py migrate
```

## Tạo superuser trong Docker

```bash
docker compose exec backend python manage.py createsuperuser
```

## Kiểm tra backend kết nối PostgreSQL

```bash
docker compose exec backend python manage.py dbshell
```

Hoặc kiểm tra migration:

```bash
docker compose exec backend python manage.py showmigrations
```

## Chạy test backend trong Docker

```bash
docker compose exec backend python manage.py test
```

## Dừng containerx`

```bash
docker compose down
```

Nếu muốn xóa luôn dữ liệu PostgreSQL local:

```bash
docker compose down -v
```
