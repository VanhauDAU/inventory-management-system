# 06 - Deployment

Tài liệu này mô tả cách chạy dự án bằng Docker/PostgreSQL và cách deploy lên Render.

## 1. Chạy local bằng Docker Compose

Tạo file cấu hình môi trường:

```bash
cp backend/.env.example backend/.env
```

Khởi chạy PostgreSQL và backend:

```bash
docker compose up --build -d
```

Backend sẽ:

- Chờ PostgreSQL sẵn sàng.
- Chạy migration.
- Tạo superuser nếu có cấu hình `DJANGO_SUPERUSER_*`.
- Chạy Gunicorn.

Kiểm tra log:

```bash
docker compose logs -f backend
```

Chạy frontend:

```bash
cd frontend
npm install
npm run dev
```

## 2. Biến môi trường chính

Backend:

```env
DJANGO_SECRET_KEY=<generate-a-strong-random-secret>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
DB_ENGINE=postgres
DATABASE_URL=
POSTGRES_DB=product_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
DJANGO_MEDIA_ROOT=/path/to/media
```

Không để trống `DJANGO_SECRET_KEY` và không dùng giá trị ví dụ cho production. Có thể tạo secret local bằng:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Frontend:

```env
VITE_API_URL=http://localhost:8000/api
```

AI:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
OPENAI_CHAT_MODEL=gpt-5.2
```

## 3. Deploy lên Render

Repo có `render.yaml` để tạo ba tài nguyên:

- `inventory-management-api`: Django web service, `rootDir: backend`.
- `inventory-management-web`: Vite static site, `rootDir: frontend`.
- `inventory-management-db`: PostgreSQL 16.

Luồng deploy:

1. Push code lên GitHub/GitLab.
2. Trên Render, tạo Blueprint từ repo.
3. Điền các biến môi trường được prompt.
4. Kiểm tra frontend `VITE_API_URL` trỏ về domain backend `/api`.
5. Kiểm tra backend `CORS_ALLOWED_ORIGINS` chứa domain frontend.

Backend build bằng:

```bash
./build.sh
```

Backend start bằng:

```bash
python manage.py migrate --noinput && python manage.py ensure_superuser && gunicorn product_management.wsgi:application --bind 0.0.0.0:$PORT --access-logfile - --error-logfile -
```

Vì migration nằm trong `startCommand`, migration mới như `products.0004_productimage` sẽ được chạy sau khi redeploy backend.

## 4. Redeploy sau khi cập nhật code

Nếu Render bật auto deploy, chỉ cần:

```bash
git add .
git commit -m "Update product image upload docs"
git push
```

Nếu không bật auto deploy:

1. Vào Render Dashboard.
2. Mở `inventory-management-api`.
3. Chọn `Manual Deploy` -> `Deploy latest commit`.
4. Mở `inventory-management-web`.
5. Chọn `Manual Deploy` -> `Deploy latest commit`.

Luôn deploy backend trước frontend nếu thay đổi API contract.

## 5. Media upload và ảnh sản phẩm trên Render

Sản phẩm hỗ trợ upload nhiều ảnh. Backend lưu file vào `MEDIA_ROOT` và expose URL `/media/...`.

Code hiện tại đã expose `MEDIA_URL` cả khi `DJANGO_DEBUG=False`, nên ảnh upload có thể hiển thị trên Render. Tuy nhiên filesystem mặc định của Render là tạm thời. Nếu không cấu hình storage bền vững, ảnh có thể mất sau restart hoặc redeploy.

Khuyến nghị:

1. Gắn Persistent Disk cho service `inventory-management-api`.
2. Mount disk vào:

```text
/opt/render/project/src/backend/media
```

3. Thêm env var:

```env
DJANGO_MEDIA_ROOT=/opt/render/project/src/backend/media
```

4. Redeploy backend.
5. Upload thử sản phẩm có nhiều ảnh.
6. Refresh trang và mở lại chi tiết sản phẩm để kiểm tra gallery.

Nếu cần scale backend nhiều instance hoặc lưu file lâu dài độc lập với Render service, nên dùng storage ngoài như S3 hoặc Cloudinary thay cho filesystem cục bộ.

## 6. Kiểm tra sau deploy

Health check:

```http
GET https://<backend-domain>/api/health/
```

Swagger:

```http
GET https://<backend-domain>/api/docs/
```

Kiểm tra ảnh:

1. Đăng nhập frontend.
2. Tạo sản phẩm mới.
3. Chọn nhiều ảnh.
4. Lưu sản phẩm.
5. Mở chi tiết sản phẩm.
6. Kiểm tra ảnh đại diện và gallery.
7. Mở trực tiếp URL `/media/...` trả từ API để xác nhận backend serve file.

## 7. Kiểm tra trước khi merge/deploy

Backend:

```bash
cd backend
python manage.py check
python manage.py test
```

Frontend:

```bash
cd frontend
npm run build
```
