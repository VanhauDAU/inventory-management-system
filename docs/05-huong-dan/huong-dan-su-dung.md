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

## Chạy test backend

```bash
cd backend
./venv/bin/python manage.py test
```
