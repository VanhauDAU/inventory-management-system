# Phân công công việc thành viên

## Nguyên tắc làm việc

- Mỗi thành viên làm trên một nhánh `feature/...` riêng.
- Không commit trực tiếp lên `main`.
- Code hoàn thiện sẽ tạo Pull Request vào `dev`.
- Trước khi tạo Pull Request cần chạy test hoặc kiểm tra thủ công phần mình phụ trách.
- API response, field dữ liệu và luồng đăng nhập cần thống nhất giữa backend và frontend.

## Tổng quan phân công

| Thành viên | Nhánh đề xuất | Vai trò chính | Kết quả cần bàn giao |
| --- | --- | --- | --- |
| Lê Văn Hậu | `feature/products-api` | Backend Product/Category API, tài liệu database/API | CRUD API sản phẩm, danh mục, docs backend |
| Lê Doãn Long | `feature/auth-api` | Hoàn thiện auth, filter nâng cao, test API | Auth ổn định, filter nâng cao, test đầy đủ |
| Lê Đình Nguyên | `feature/frontend-ui` | Frontend layout, product list | Layout React, trang danh sách sản phẩm |
| Nguyễn Nguyên Tài | `feature/frontend-crud` | Frontend login và CRUD UI | Login UI, form thêm/sửa/xóa sản phẩm |
| Trần Văn Sỹ | `feature/devops` | Docker, PostgreSQL, CI/CD | Docker Compose, PostgreSQL config, GitHub Actions |

## Lê Văn Hậu - Backend Product/Category API

### Công việc chính

- Xây dựng model `Product`.
- Xây dựng model `Category`.
- Tạo serializer cho Product và Category.
- Tạo CRUD API bằng Django REST Framework.
- Bảo vệ API bằng JWT authentication.
- Viết tài liệu database và API.
- Viết test cơ bản cho Product và Category API.

### Trạng thái hiện tại

Đã hoàn thiện mức cơ bản:

- `GET`, `POST`, `PATCH`, `DELETE` cho `/api/products/`.
- `GET`, `POST`, `PATCH`, `DELETE` cho `/api/categories/`.
- API yêu cầu JWT token.
- Có search, filter, ordering, pagination cơ bản.
- Test backend đã chạy pass.

### Cần làm thêm

- Thêm validation `price >= 0`.
- Thêm validation `quantity >= 0`.
- Phối hợp frontend để thống nhất JSON response.
- Tạo Pull Request từ `feature/products-api` vào `dev`.

## Lê Doãn Long - Hoàn thiện Auth, Filter nâng cao và Test API

### Ghi chú trạng thái

Một phần công việc ban đầu của Long đã được triển khai cơ bản trong nhánh `feature/products-api` để phục vụ CRUD API:

- Endpoint lấy JWT token: `POST /api/token/`.
- Endpoint refresh token: `POST /api/token/refresh/`.
- Search sản phẩm theo `name`, `description`.
- Filter sản phẩm theo `category`.
- Ordering sản phẩm.
- Pagination mặc định 10 item/trang.

Vì vậy Long không cần làm lại từ đầu các phần này. Nhiệm vụ phù hợp hơn là kiểm tra, hoàn thiện, mở rộng và viết test cho các chức năng đó.

### Công việc chính

- Kiểm tra endpoint lấy token và refresh token đã hoạt động đúng.
- Bổ sung test cho đăng nhập đúng, đăng nhập sai và refresh token.
- Chuẩn hóa quyền truy cập API nếu nhóm cần phân quyền rõ hơn.
- Mở rộng filter theo khoảng giá: `min_price`, `max_price`.
- Mở rộng filter theo tồn kho: còn hàng, hết hàng.
- Kiểm tra pagination khi có nhiều sản phẩm.
- Viết test cho search, filter, ordering và pagination.
- Phối hợp merge phần auth/filter vào nhánh `dev`.

### API cần phụ trách

```http
POST /api/token/
POST /api/token/refresh/
GET /api/products/?search=...
GET /api/products/?category=...
GET /api/products/?ordering=...
GET /api/products/?page=...
```

### Kết quả cần bàn giao

- Đăng nhập đúng trả `access` và `refresh`.
- Sai tài khoản trả lỗi rõ ràng.
- API không có token trả `401 Unauthorized`.
- Search/filter/pagination có test chứng minh hoạt động ổn định.
- Có filter nâng cao theo giá và tồn kho nếu kịp tiến độ.
- Không làm trùng code đã có trong `feature/products-api`; ưu tiên bổ sung và kiểm thử.

## Lê Đình Nguyên - Frontend Layout và Product List

### Công việc chính

- Dựng layout chính của React app.
- Tạo navigation/header/sidebar nếu cần.
- Tạo trang danh sách sản phẩm.
- Gọi API `GET /api/products/`.
- Hiển thị loading, empty state và error state.
- Hiển thị phân trang nếu backend trả pagination.

### Màn hình cần làm

- Trang đăng nhập hoặc khung điều hướng đến trang đăng nhập.
- Trang danh sách sản phẩm.
- Bảng sản phẩm gồm tên, danh mục, giá, số lượng và thao tác.
- Ô tìm kiếm và bộ lọc cơ bản nếu nhận kịp API.

### Kết quả cần bàn giao

- Giao diện chạy được bằng React.
- Danh sách sản phẩm đọc từ backend API.
- Token được gửi kèm khi gọi API đã đăng nhập.
- UI không vỡ layout trên màn hình laptop phổ biến.

## Nguyễn Nguyên Tài - Frontend Login và Product CRUD UI

### Công việc chính

- Xây dựng màn hình đăng nhập.
- Gọi API `POST /api/token/`.
- Lưu access token để gọi API.
- Tạo form thêm sản phẩm.
- Tạo form sửa sản phẩm.
- Tạo chức năng xóa sản phẩm.
- Hiển thị thông báo lỗi khi API trả lỗi.

### API cần dùng

```http
POST /api/token/
POST /api/products/
PATCH /api/products/{id}/
DELETE /api/products/{id}/
GET /api/categories/
```

### Kết quả cần bàn giao

- Đăng nhập thành công chuyển vào màn hình quản lý.
- Thêm sản phẩm mới thành công.
- Sửa sản phẩm thành công.
- Xóa sản phẩm thành công.
- Form có validate cơ bản ở frontend.

## Trần Văn Sỹ - DevOps, PostgreSQL, Docker, CI/CD

### Công việc chính

- Tạo Dockerfile cho backend.
- Tạo Dockerfile cho frontend nếu cần.
- Tạo `docker-compose.yml` gồm backend, frontend và PostgreSQL.
- Cấu hình Django đọc database từ biến môi trường.
- Cấu hình PostgreSQL cho môi trường Docker.
- Tạo GitHub Actions chạy test backend.
- Viết hướng dẫn chạy dự án bằng Docker.

### Thành phần cần có

```text
backend
frontend
postgres
```

### Kết quả cần bàn giao

- Chạy được toàn bộ dự án bằng Docker Compose.
- Backend kết nối PostgreSQL thành công.
- Migration chạy được trên PostgreSQL.
- GitHub Actions tự động chạy test khi push hoặc mở Pull Request.
- Không hardcode thông tin nhạy cảm trong source code.

## Checklist trước khi merge vào dev

- Backend test pass.
- Frontend chạy được và gọi API thành công.
- Docker Compose chạy được trên máy thành viên khác.
- API có token bảo vệ đúng.
- Docs được cập nhật theo phần đã làm.
- Pull Request mô tả rõ chức năng đã hoàn thiện và cách test.
