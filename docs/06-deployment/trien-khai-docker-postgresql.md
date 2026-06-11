# 06 - Deployment

## Trạng thái hiện tại

Dự án đã có cấu hình Docker cho backend Django và PostgreSQL.

Khi chạy bằng Docker Compose:

- Service `db` chạy PostgreSQL.
- Service `backend` chạy Django REST Framework.
- Backend đọc database config từ file `.env`.
- Backend tự chạy `python manage.py migrate` khi container khởi động.

GitHub Actions đã được cấu hình để chạy backend test với PostgreSQL service và build frontend.

Các file chính:

- `docker-compose.yml`
- `.env.example`
- `backend/Dockerfile`
- `backend/entrypoint.sh`
- `backend/product_management/settings.py`
- `.github/workflows/ci.yml`

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
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,backend
DB_ENGINE=postgres
POSTGRES_DB=product_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
VITE_API_URL=http://localhost:8000/api
```

Khi chạy bằng Docker, `POSTGRES_HOST` phải là `db` vì backend kết nối đến service PostgreSQL trong Docker network. Nếu chạy Django trực tiếp trên máy và PostgreSQL cũng publish ra máy host, có thể đổi `POSTGRES_HOST=localhost`.

## Chạy Docker Compose

Chạy từ thư mục gốc dự án:

```bash
docker compose up --build -d
```

Trên Windows, cần chạy từ thư mục gốc dự án, nơi có file `docker-compose.yml`. Không chạy trong thư mục `backend`.

Nếu gặp lỗi:

```text
exec /app/entrypoint.sh: no such file or directory
```

Nguyên nhân thường là file `entrypoint.sh` bị chuyển line ending từ LF sang CRLF. Dự án đã có `.gitattributes` và Dockerfile tự normalize line ending. Nếu vẫn lỗi do Docker cache cũ, chạy:

```bash
docker compose build --no-cache backend
docker compose up -d
```

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

## Migration

Backend container tự chạy migration trong `backend/entrypoint.sh` khi khởi động:

```bash
python manage.py migrate
```

Nếu cần chạy migration thủ công:

```bash
docker compose exec backend python manage.py migrate
```

Kiểm tra các migration database mở rộng:

```bash
docker compose exec backend python manage.py showmigrations suppliers categories products inventory
```

Các bảng nghiệp vụ sau migration:

```text
categories
suppliers
products
warehouses
stock_transactions
stock_transaction_items
```

## Tạo user để test JWT

```bash
docker compose exec backend python manage.py createsuperuser
```

Sau đó lấy token:

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

## Chạy test trong Docker

```bash
docker compose exec backend python manage.py test
```

## GitHub Actions CI

Workflow CI nằm tại:

```text
.github/workflows/ci.yml
```

CI tự chạy khi push lên `main`, `dev`, `feature/**` hoặc khi tạo Pull Request vào `dev`/`main`.

Các job hiện có:

- `backend-tests`: chạy trên Ubuntu, dùng PostgreSQL 16 service, cài dependency Python, chạy `python manage.py check`, `python manage.py migrate --noinput` và `python manage.py test`.
- `frontend-build`: cài dependency frontend bằng `npm ci` và chạy `npm run build`.

Trong CI, backend kết nối PostgreSQL qua `POSTGRES_HOST=127.0.0.1` vì database chạy dưới dạng GitHub Actions service. Khi chạy bằng Docker Compose local, backend vẫn dùng `POSTGRES_HOST=db`.

## Dừng container

```bash
docker compose down
```

Nếu muốn xóa luôn dữ liệu PostgreSQL local:

```bash
docker compose down -v
```

## Việc còn lại

- Thêm service frontend vào `docker-compose.yml` nếu nhóm muốn chạy React bằng Docker.
- Mở rộng GitHub Actions thêm lint, coverage hoặc deploy nếu nhóm cần.
