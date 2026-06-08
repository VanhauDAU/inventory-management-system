# 07 - Algorithms

## Search

Product API đang hỗ trợ search bằng DRF `SearchFilter`.

Các field đang search:

- `name`
- `description`

Ví dụ:

```http
GET /api/products/?search=keyboard
```

## Filter

Product API đang hỗ trợ filter theo category.

Ví dụ:

```http
GET /api/products/?category=1
```

## Ordering

Product API đang hỗ trợ sắp xếp theo:

- `id`
- `name`
- `price`
- `quantity`
- `created_at`
- `updated_at`

Ví dụ:

```http
GET /api/products/?ordering=price
GET /api/products/?ordering=-created_at
```

## Pagination

DRF đang cấu hình pagination mặc định:

- Page size: 10.
- Response gồm `count`, `next`, `previous`, `results`.

Ví dụ:

```http
GET /api/products/?page=1
```

## Cần làm thêm

- Filter theo khoảng giá: `min_price`, `max_price`.
- Filter theo tồn kho: còn hàng, hết hàng.
- Search không phân biệt dấu nếu cần hỗ trợ tiếng Việt tốt hơn.
