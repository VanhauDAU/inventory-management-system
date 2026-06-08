# 02 - Tổng quan

## Kiến trúc hệ thống

Hệ thống gồm các thành phần chính:

- React frontend gọi REST API.
- Django REST Framework backend xử lý nghiệp vụ và trả JSON.
- PostgreSQL lưu dữ liệu sản phẩm, danh mục và user.
- JWT dùng để xác thực request API.
- Docker dùng để đóng gói môi trường chạy.

## Luồng xử lý chính

1. Người dùng đăng nhập từ frontend.
2. Backend kiểm tra username/password và trả JWT access token.
3. Frontend gửi token trong header `Authorization`.
4. Backend xác thực token.
5. Người dùng thực hiện CRUD Product và Category.

## Nhánh Git

- `main`: nhánh ổn định.
- `dev`: nhánh tích hợp chung của nhóm.
- `feature/products-api`: nhánh backend CRUD sản phẩm và danh mục.
- `feature/auth-api`: nhánh JWT/login.
- `feature/frontend-ui`: nhánh giao diện React.
- `feature/frontend-crud`: nhánh thao tác CRUD phía frontend.
- `feature/devops`: nhánh Docker, PostgreSQL, GitHub Actions.

## Quy trình đề xuất

1. Làm việc trên nhánh `feature/...`.
2. Commit và push lên GitHub.
3. Tạo Pull Request vào `dev`.
4. Review và merge vào `dev`.
5. Khi ổn định mới merge `dev` vào `main`.
