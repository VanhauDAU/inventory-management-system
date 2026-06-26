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

Body JSON tối thiểu:

```json
{
  "name": "Keyboard",
  "description": "Mechanical keyboard",
  "selling_price": "49.99",
  "category": 1
}
```

SKU được tự sinh nếu không gửi. `quantity` không cập nhật trực tiếp từ CRUD sản phẩm; tồn kho được cập nhật qua phiếu kho.

Body `multipart/form-data` khi upload nhiều ảnh:

```text
name=Keyboard
description=Mechanical keyboard
selling_price=49.99
cost_price=35.00
minimum_stock=5
unit=piece
status=active
category=1
supplier=2
uploaded_images=<file 1>
uploaded_images=<file 2>
```

Quy định ảnh:

- Field upload nhiều ảnh: `uploaded_images`.
- Tối đa 8 ảnh cho một sản phẩm.
- Mỗi ảnh tối đa 5MB.
- Định dạng hợp lệ do `ImageField`/Pillow kiểm tra, frontend đang cho phép JPG, PNG, WEBP và GIF.
- Ảnh đầu tiên được đặt làm ảnh đại diện.

Response rút gọn:

```json
{
  "id": 1,
  "sku": "PRD-ABC123",
  "name": "Keyboard",
  "image": "http://localhost:8000/media/products/gallery/front.png",
  "thumbnail": "http://localhost:8000/media/products/gallery/front.png",
  "images": [
    {
      "id": 10,
      "image": "http://localhost:8000/media/products/gallery/front.png",
      "alt_text": "Keyboard",
      "is_primary": true,
      "sort_order": 0,
      "created_at": "2026-06-26T00:00:00Z"
    }
  ],
  "selling_price": "49.99",
  "price": "49.99",
  "quantity": 0,
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
  "name": "Keyboard Pro",
  "minimum_stock": 10
}
```

Cập nhật ảnh dùng `multipart/form-data` giống tạo mới. Nếu gửi `uploaded_images`, backend sẽ thay gallery hiện tại bằng danh sách ảnh mới.

### Xóa product

```http
DELETE /api/products/{id}/
```

Nếu sản phẩm đã được dùng trong phiếu kho hoặc dữ liệu nghiệp vụ có ràng buộc, API trả `409 Conflict`.

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
