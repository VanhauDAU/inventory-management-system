# 01 - Phân tích

## Mục tiêu dự án

Xây dựng hệ thống quản lý sản phẩm cho phép người dùng đăng nhập và quản lý danh sách sản phẩm, danh mục sản phẩm thông qua giao diện React và REST API Django.

## Công nghệ sử dụng

- Frontend: React.
- Backend: Django REST Framework.
- Authentication: JWT.
- Database: PostgreSQL khi triển khai, SQLite trong môi trường dev hiện tại.
- DevOps: Docker, GitHub Actions.

## Phân công

Chi tiết nhiệm vụ, nhánh Git và kết quả cần bàn giao của từng thành viên được mô tả trong `docs/01-phan-tich/phan-cong-thanh-vien.md`.

Kế hoạch tổng thể, trạng thái đã làm và các phần chưa thực hiện được mô tả trong `docs/01-phan-tich/ke-hoach-trang-thai-du-an.md`.

### Lê Văn Hậu

- Product Model.
- Category Model.
- CRUD API.
- Tài liệu database và API backend.

### Lê Doãn Long

- JWT Login.
- Search.
- Filter.
- Pagination.

### Lê Đình Nguyên

- React Layout.
- Product List.

### Nguyễn Nguyên Tài

- Login UI.
- Product CRUD UI.

### Trần Văn Sỹ

- Docker.
- PostgreSQL.
- GitHub Actions.

## Trạng thái phần Lê Văn Hậu

Phần backend CRUD cơ bản đã hoàn thiện:

- Có model `Category`.
- Có model `Product`.
- Có serializer cho `Category` và `Product`.
- Có `CategoryViewSet` và `ProductViewSet`.
- Có router `/api/categories/` và `/api/products/`.
- API yêu cầu JWT authentication.
- Có test backend cơ bản.

Chưa hoàn thiện hoàn toàn ở mức production:

- Chưa validate `price >= 0` và `quantity >= 0`.
- Chưa có permission theo role.
- Chưa chuyển cấu hình database chính sang PostgreSQL.
- Chưa có Postman collection export.
