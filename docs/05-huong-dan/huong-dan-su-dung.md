# 05 - Hướng dẫn

## Chạy backend

```bash
cd backend
./venv/bin/python manage.py runserver
```

Backend chạy tại:

```text
http://127.0.0.1:8000
```

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

### Bước 5: Test upload nhiều ảnh sản phẩm bằng Postman

Method:

```text
POST
```

URL:

```text
http://127.0.0.1:8000/api/products/
```

Trong tab `Body`, chọn `form-data`:

| Key | Type | Value |
| --- | --- | --- |
| `name` | Text | `Keyboard` |
| `description` | Text | `Mechanical keyboard` |
| `selling_price` | Text | `490000` |
| `cost_price` | Text | `350000` |
| `minimum_stock` | Text | `5` |
| `unit` | Text | `piece` |
| `status` | Text | `active` |
| `category` | Text | `1` |
| `supplier` | Text | `2` |
| `uploaded_images` | File | Chọn ảnh thứ nhất |
| `uploaded_images` | File | Chọn ảnh thứ hai |

Ghi chú:

- Có thể thêm nhiều dòng cùng key `uploaded_images`.
- Tối đa 8 ảnh, mỗi ảnh tối đa 5MB.
- API trả `image` là ảnh đại diện và `images` là danh sách ảnh.
- Nếu cập nhật sản phẩm bằng `PATCH` và gửi `uploaded_images`, gallery cũ sẽ được thay bằng danh sách ảnh mới.

## Lưu ý khi chạy trên Render

Backend production đã expose `/media/` để hiển thị ảnh upload. Tuy nhiên Render dùng filesystem tạm nếu chưa cấu hình Persistent Disk. Vì vậy khi deploy thật cần:

1. Gắn disk cho service backend.
2. Mount vào thư mục media, ví dụ `/opt/render/project/src/backend/media`.
3. Set env `DJANGO_MEDIA_ROOT=/opt/render/project/src/backend/media`.
4. Redeploy backend.

## Chạy test backend

```bash
cd backend
./venv/bin/python manage.py test
```
