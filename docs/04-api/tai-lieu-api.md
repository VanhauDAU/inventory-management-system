# 04 - API

## Authentication

### Lấy access token

```http
POST /api/token/
```

Body:

```json
{
  "username": "levanhau",
  "password": "12345678"
}
```

Response:

```json
{
  "refresh": "...",
  "access": "..."
}
```

### Refresh token

```http
POST /api/token/refresh/
```

Body:

```json
{
  "refresh": "refresh_token"
}
```

## Header cho API cần đăng nhập

```http
Authorization: Bearer access_token
```

## Health Check

Endpoint dùng để kiểm tra backend API đang chạy. Endpoint này không yêu cầu JWT token.

```http
GET /api/health/
```

Response:

```json
{
  "status": "ok"
}
```

## Swagger/OpenAPI

Tài liệu API tự động từ Django REST Framework:

```http
GET /api/docs/
```

OpenAPI schema:

```http
GET /api/schema/
```

ReDoc:

```http
GET /api/redoc/
```

## Category API

### Danh sách category

```http
GET /api/categories/
```

### Tạo category

```http
POST /api/categories/
```

Body:

```json
{
  "name": "Electronics"
}
```

### Chi tiết category

```http
GET /api/categories/{id}/
```

### Cập nhật category

```http
PATCH /api/categories/{id}/
```

Body:

```json
{
  "name": "Office Electronics"
}
```

### Xóa category

```http
DELETE /api/categories/{id}/
```

## Product API

### Danh sách product

```http
GET /api/products/
```

### Tạo product

```http
POST /api/products/
```

Body:

```json
{
  "name": "Keyboard",
  "description": "Mechanical keyboard",
  "price": "49.99",
  "quantity": 12,
  "category": 1
}
```

### Chi tiết product

```http
GET /api/products/{id}/
```

### Cập nhật product

```http
PATCH /api/products/{id}/
```

Body:

```json
{
  "quantity": 8
}
```

### Xóa product

```http
DELETE /api/products/{id}/
```

## Search, filter, ordering

### Search theo tên hoặc mô tả

```http
GET /api/products/?search=keyboard
```

### Filter theo category

```http
GET /api/products/?category=1
```

### Ordering

```http
GET /api/products/?ordering=price
GET /api/products/?ordering=-created_at
```

## Pagination

API danh sách trả về dạng:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": []
}
```
